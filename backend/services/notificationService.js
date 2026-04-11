const { Firestore } = require('@google-cloud/firestore');

// Lazy Firestore initialization to avoid blocking server startup
// Auto-detects project from Cloud Run environment (GOOGLE_CLOUD_PROJECT is set automatically by Cloud Run)
let firestore = null;
const getFirestore = () => {
    if (!firestore) {
        const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT_ID;
        firestore = new Firestore(projectId ? { projectId } : {});
    }
    return firestore;
};

const COLLECTION_NAME = 'notifications';

/**
 * Notification Types
 */
const NotificationType = {
    ACCESS_APPROVED: 'ACCESS_APPROVED',
    ACCESS_REJECTED: 'ACCESS_REJECTED',
    ACCESS_REVOKED: 'ACCESS_REVOKED',
    NEW_REQUEST: 'NEW_REQUEST',
    BULK_ACTION: 'BULK_ACTION'
};

/**
 * Notification Entity Structure:
 * {
 *   id: string,
 *   recipientEmail: string,
 *   type: NotificationType,
 *   title: string,
 *   message: string,
 *   metadata: {
 *     requestId?: string,
 *     assetName?: string,
 *     projectId?: string,
 *     role?: string,
 *     actionBy?: string
 *   },
 *   read: boolean,
 *   createdAt: string (ISO),
 *   expiresAt: string (ISO)  // 30 days from creation
 * }
 */

/**
 * Generate a unique ID for a notification
 * @returns {string}
 */
const generateId = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `notif_${timestamp}_${random}`;
};

/**
 * Create a new notification
 * @param {Object} data - Notification data
 * @returns {Object} Created notification
 */
const createNotification = async (data) => {
    try {
        const id = generateId();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

        const notification = {
            id,
            recipientEmail: data.recipientEmail,
            type: data.type,
            title: data.title,
            message: data.message,
            metadata: data.metadata || {},
            read: false,
            createdAt: now.toISOString(),
            expiresAt: expiresAt.toISOString()
        };

        console.log(`[NOTIFICATION] Creating: type=${data.type}, recipient=${data.recipientEmail}, title="${data.title}"`);
        const docRef = getFirestore().collection(COLLECTION_NAME).doc(id);
        await docRef.set(notification);
        console.log(`[NOTIFICATION] Created successfully: id=${id}`);

        return notification;
    } catch (error) {
        console.error(`[NOTIFICATION] Error creating (type=${data.type}, recipient=${data.recipientEmail}):`, error);
        throw error;
    }
};

/**
 * Get notifications for a specific user
 * @param {string} recipientEmail - User email
 * @param {Object} filters - Optional filters (read, limit)
 * @returns {Object[]} List of notifications
 */
const getNotifications = async (recipientEmail, filters = {}) => {
    try {
        let query = getFirestore()
            .collection(COLLECTION_NAME)
            .where('recipientEmail', '==', recipientEmail);

        if (filters.read !== undefined) {
            query = query.where('read', '==', filters.read);
        }

        const snapshot = await query.get();

        if (snapshot.empty) {
            return [];
        }

        const notifications = [];
        const now = new Date();

        snapshot.forEach(doc => {
            const data = doc.data();
            // Filter out expired notifications
            if (new Date(data.expiresAt) > now) {
                notifications.push(data);
            }
        });

        // Sort by createdAt (newest first)
        notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Apply limit if provided
        if (filters.limit && filters.limit > 0) {
            return notifications.slice(0, filters.limit);
        }

        return notifications;
    } catch (error) {
        console.error(`Error fetching notifications for ${recipientEmail}:`, error);
        throw error;
    }
};

/**
 * Get unread notification count for a user
 * @param {string} recipientEmail - User email
 * @returns {number} Unread count
 */
const getUnreadCount = async (recipientEmail) => {
    try {
        const snapshot = await getFirestore()
            .collection(COLLECTION_NAME)
            .where('recipientEmail', '==', recipientEmail)
            .where('read', '==', false)
            .get();

        // Filter out expired
        let count = 0;
        const now = new Date();
        snapshot.forEach(doc => {
            if (new Date(doc.data().expiresAt) > now) {
                count++;
            }
        });

        return count;
    } catch (error) {
        console.error(`Error getting unread count for ${recipientEmail}:`, error);
        throw error;
    }
};

/**
 * Mark notifications as read
 * @param {string[]} notificationIds - Array of notification IDs
 * @returns {number} Number of notifications updated
 */
const markAsRead = async (notificationIds) => {
    try {
        const db = getFirestore();
        const batch = db.batch();
        let count = 0;

        for (const id of notificationIds) {
            const docRef = db.collection(COLLECTION_NAME).doc(id);
            batch.update(docRef, { read: true });
            count++;
        }

        await batch.commit();
        return count;
    } catch (error) {
        console.error('Error marking notifications as read:', error);
        throw error;
    }
};

/**
 * Mark all notifications as read for a user
 * @param {string} recipientEmail - User email
 * @returns {number} Number of notifications updated
 */
const markAllAsRead = async (recipientEmail) => {
    try {
        const db = getFirestore();
        const snapshot = await db
            .collection(COLLECTION_NAME)
            .where('recipientEmail', '==', recipientEmail)
            .where('read', '==', false)
            .get();

        if (snapshot.empty) {
            return 0;
        }

        const batch = db.batch();
        snapshot.forEach(doc => {
            batch.update(doc.ref, { read: true });
        });

        await batch.commit();
        return snapshot.size;
    } catch (error) {
        console.error(`Error marking all as read for ${recipientEmail}:`, error);
        throw error;
    }
};

/**
 * Delete a notification
 * @param {string} id - Notification ID
 * @returns {boolean} Success status
 */
const deleteNotification = async (id) => {
    try {
        await getFirestore().collection(COLLECTION_NAME).doc(id).delete();
        return true;
    } catch (error) {
        console.error(`Error deleting notification ${id}:`, error);
        throw error;
    }
};

/**
 * Clean up expired notifications
 * @returns {number} Number of notifications deleted
 */
const cleanupExpiredNotifications = async () => {
    try {
        const db = getFirestore();
        const now = new Date().toISOString();
        const snapshot = await db
            .collection(COLLECTION_NAME)
            .where('expiresAt', '<', now)
            .get();

        if (snapshot.empty) {
            return 0;
        }

        const batch = db.batch();
        snapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        console.log(`Cleaned up ${snapshot.size} expired notifications`);
        return snapshot.size;
    } catch (error) {
        console.error('Error cleaning up expired notifications:', error);
        throw error;
    }
};

// ===== Notification Trigger Helpers =====

/**
 * Send notification when access is approved
 * @param {Object} requestData - Original access request data
 * @param {string} adminEmail - Admin who approved
 */
const notifyAccessApproved = async (requestData, adminEmail) => {
    return createNotification({
        recipientEmail: requestData.requesterEmail,
        type: NotificationType.ACCESS_APPROVED,
        title: 'Access Request Approved',
        message: `Your access request for ${requestData.assetName} has been approved.`,
        metadata: {
            requestId: requestData.id,
            assetName: requestData.assetName,
            projectId: requestData.gcpProjectId,
            role: requestData.requestedRole,
            actionBy: adminEmail
        }
    });
};

/**
 * Send notification when access is rejected
 * @param {Object} requestData - Original access request data
 * @param {string} adminEmail - Admin who rejected
 * @param {string} reason - Optional rejection reason
 */
const notifyAccessRejected = async (requestData, adminEmail, reason = '') => {
    return createNotification({
        recipientEmail: requestData.requesterEmail,
        type: NotificationType.ACCESS_REJECTED,
        title: 'Access Request Rejected',
        message: `Your access request for ${requestData.assetName} has been rejected.${reason ? ` Reason: ${reason}` : ''}`,
        metadata: {
            requestId: requestData.id,
            assetName: requestData.assetName,
            projectId: requestData.gcpProjectId,
            role: requestData.requestedRole,
            actionBy: adminEmail,
            reason
        }
    });
};

/**
 * Send notification when access is revoked
 * @param {Object} grantData - Granted access data
 * @param {string} adminEmail - Admin who revoked
 */
const notifyAccessRevoked = async (grantData, adminEmail) => {
    return createNotification({
        recipientEmail: grantData.userEmail,
        type: NotificationType.ACCESS_REVOKED,
        title: 'Access Revoked',
        message: `Your access to ${grantData.assetName} has been revoked.`,
        metadata: {
            grantId: grantData.id,
            assetName: grantData.assetName,
            projectId: grantData.gcpProjectId,
            role: grantData.role,
            actionBy: adminEmail
        }
    });
};

/**
 * Send notification to admins about new access request
 * @param {Object} requestData - Access request data
 * @param {string[]} projectAdmins - List of admin emails to notify
 */
const notifyNewRequest = async (requestData, projectAdmins) => {
    const notifications = [];

    for (const adminEmail of projectAdmins) {
        const notification = await createNotification({
            recipientEmail: adminEmail,
            type: NotificationType.NEW_REQUEST,
            title: 'New Access Request',
            message: `${requestData.requesterEmail} is requesting access to ${requestData.assetName}`,
            metadata: {
                requestId: requestData.id,
                assetName: requestData.assetName,
                projectId: requestData.gcpProjectId,
                role: requestData.requestedRole,
                requester: requestData.requesterEmail
            }
        });
        notifications.push(notification);
    }

    return notifications;
};

module.exports = {
    NotificationType,
    createNotification,
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    cleanupExpiredNotifications,
    notifyAccessApproved,
    notifyAccessRejected,
    notifyAccessRevoked,
    notifyNewRequest
};
