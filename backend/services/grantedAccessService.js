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

const COLLECTION_NAME = 'granted-accesses';

/**
 * Granted Access Entity Structure:
 * {
 *   id: string,                     // Unique ID (e.g., grant_12345_xyz)
 *   userEmail: string,              // Who has access
 *   assetName: string,              // Resource path
 *   gcpProjectId: string,           // GCP project
 *   role: string,                   // IAM role granted
 *   grantedAt: string (ISO),        // When access was granted
 *   grantedBy: string,              // Admin who approved
 *   originalRequestId: string,      // Reference to access-requests doc
 *   status: 'ACTIVE' | 'REVOKED',   // Current status
 *   revokedAt: string | null,
 *   revokedBy: string | null
 * }
 */

/**
 * Generate a unique ID for a granted access
 * @returns {string}
 */
const generateId = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `grant_${timestamp}_${random}`;
};

/**
 * Create a new granted access record
 * @param {Object} data - Access grant data
 * @returns {Object} Created granted access
 */
const createGrantedAccess = async (data) => {
    try {
        const id = generateId();
        const now = new Date().toISOString();

        const grantedAccess = {
            id,
            userEmail: data.userEmail,
            assetName: data.assetName,
            gcpProjectId: data.gcpProjectId,
            role: data.role,
            grantedAt: now,
            grantedBy: data.grantedBy,
            originalRequestId: data.originalRequestId || null,
            status: 'ACTIVE',
            revokedAt: null,
            revokedBy: null
        };

        const docRef = getFirestore().collection(COLLECTION_NAME).doc(id);
        await docRef.set(grantedAccess);

        return grantedAccess;
    } catch (error) {
        console.error('Error creating granted access:', error);
        throw error;
    }
};

/**
 * Get all granted accesses with optional filters
 * @param {Object} filters - Optional filters (status, projectId, userEmail)
 * @returns {Object[]} List of granted accesses
 */
const getGrantedAccesses = async (filters = {}) => {
    try {
        let query = getFirestore().collection(COLLECTION_NAME);

        if (filters.status) {
            query = query.where('status', '==', filters.status);
        }
        if (filters.projectId) {
            query = query.where('gcpProjectId', '==', filters.projectId);
        }
        if (filters.userEmail) {
            query = query.where('userEmail', '==', filters.userEmail);
        }

        const snapshot = await query.get();

        if (snapshot.empty) {
            return [];
        }

        const accesses = [];
        snapshot.forEach(doc => {
            accesses.push(doc.data());
        });

        // Sort by grantedAt (newest first)
        accesses.sort((a, b) => new Date(b.grantedAt) - new Date(a.grantedAt));

        return accesses;
    } catch (error) {
        console.error('Error fetching granted accesses:', error);
        throw error;
    }
};

/**
 * Get a single granted access by ID
 * @param {string} id - Grant ID
 * @returns {Object|null}
 */
const getGrantedAccessById = async (id) => {
    try {
        const docRef = getFirestore().collection(COLLECTION_NAME).doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return null;
        }

        return doc.data();
    } catch (error) {
        console.error(`Error fetching granted access ${id}:`, error);
        throw error;
    }
};

/**
 * Get all accesses for a specific project
 * @param {string} projectId - GCP Project ID
 * @returns {Object[]} List of granted accesses
 */
const getAccessesByProject = async (projectId) => {
    return getGrantedAccesses({ projectId, status: 'ACTIVE' });
};

/**
 * Get all users with access to a specific asset
 * @param {string} assetName - Asset name/path
 * @returns {Object[]} List of granted accesses
 */
const getAccessesByAsset = async (assetName) => {
    try {
        const snapshot = await getFirestore()
            .collection(COLLECTION_NAME)
            .where('assetName', '==', assetName)
            .where('status', '==', 'ACTIVE')
            .get();

        if (snapshot.empty) {
            return [];
        }

        const accesses = [];
        snapshot.forEach(doc => {
            accesses.push(doc.data());
        });

        return accesses;
    } catch (error) {
        console.error(`Error fetching accesses for asset ${assetName}:`, error);
        throw error;
    }
};

/**
 * Get all accesses for a specific user
 * @param {string} email - User email
 * @returns {Object[]} List of granted accesses
 */
const getAccessesByUser = async (email) => {
    return getGrantedAccesses({ userEmail: email, status: 'ACTIVE' });
};

/**
 * Revoke access (mark as revoked)
 * @param {string} grantId - Grant ID
 * @param {string} revokedBy - Email of admin who revoked
 * @returns {Object} Updated granted access
 */
const revokeAccess = async (grantId, revokedBy) => {
    try {
        const docRef = getFirestore().collection(COLLECTION_NAME).doc(grantId);
        const doc = await docRef.get();

        if (!doc.exists) {
            throw new Error(`Granted access ${grantId} not found`);
        }

        const now = new Date().toISOString();

        await docRef.update({
            status: 'REVOKED',
            revokedAt: now,
            revokedBy: revokedBy
        });

        const updatedDoc = await docRef.get();
        return updatedDoc.data();
    } catch (error) {
        console.error(`Error revoking access ${grantId}:`, error);
        throw error;
    }
};

/**
 * Check if a user has active access to a specific asset with a specific role
 * @param {string} userEmail - User email
 * @param {string} assetName - Asset name
 * @param {string} role - IAM role
 * @returns {Object|null} Existing access or null
 */
const findExistingAccess = async (userEmail, assetName, role) => {
    try {
        const snapshot = await getFirestore()
            .collection(COLLECTION_NAME)
            .where('userEmail', '==', userEmail)
            .where('assetName', '==', assetName)
            .where('role', '==', role)
            .where('status', '==', 'ACTIVE')
            .get();

        if (snapshot.empty) {
            return null;
        }

        // Return first match
        let access = null;
        snapshot.forEach(doc => {
            if (!access) access = doc.data();
        });

        return access;
    } catch (error) {
        console.error('Error finding existing access:', error);
        throw error;
    }
};

/**
 * Get access statistics for a project
 * @param {string} projectId - GCP Project ID
 * @returns {Object} Statistics object
 */
const getAccessStats = async (projectId) => {
    try {
        const activeSnapshot = await getFirestore()
            .collection(COLLECTION_NAME)
            .where('gcpProjectId', '==', projectId)
            .where('status', '==', 'ACTIVE')
            .get();

        const revokedSnapshot = await getFirestore()
            .collection(COLLECTION_NAME)
            .where('gcpProjectId', '==', projectId)
            .where('status', '==', 'REVOKED')
            .get();

        // Get unique users
        const uniqueUsers = new Set();
        activeSnapshot.forEach(doc => {
            uniqueUsers.add(doc.data().userEmail);
        });

        return {
            activeGrants: activeSnapshot.size,
            revokedGrants: revokedSnapshot.size,
            uniqueUsers: uniqueUsers.size
        };
    } catch (error) {
        console.error(`Error getting access stats for project ${projectId}:`, error);
        throw error;
    }
};

/**
 * Get a grant by its original request ID
 * @param {string} requestId 
 * @returns {Object|null}
 */
const getGrantByRequestId = async (requestId) => {
    try {
        const snapshot = await getFirestore()
            .collection(COLLECTION_NAME)
            .where('originalRequestId', '==', requestId)
            .where('status', '==', 'ACTIVE')
            .limit(1)
            .get();

        if (snapshot.empty) return null;
        return snapshot.docs[0].data();
    } catch (error) {
        console.error(`Error finding grant by requestId ${requestId}:`, error);
        return null;
    }
};

module.exports = {
    createGrantedAccess,
    getGrantedAccesses,
    getGrantedAccessById,
    getAccessesByProject,
    getAccessesByAsset,
    getAccessesByUser,
    revokeAccess,
    findExistingAccess,
    getAccessStats,
    getGrantByRequestId
};
