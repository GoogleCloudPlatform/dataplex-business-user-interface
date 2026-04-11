const { Firestore } = require('@google-cloud/firestore');
const { CatalogServiceClient } = require('@google-cloud/dataplex');
const { BigQuery } = require('@google-cloud/bigquery');

// Lazy Firestore initialization to avoid blocking server startup
// Auto-detects project from Cloud Run environment (GOOGLE_CLOUD_PROJECT is set automatically by Cloud Run)
let firestore = null;
const getFirestore = () => {
    if (!firestore) {
        // Cloud Run automatically sets GOOGLE_CLOUD_PROJECT
        // This ensures Firestore uses the same project as the Cloud Run service
        const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT_ID;
        firestore = new Firestore(projectId ? { projectId } : {});
        console.log(`Firestore initialized for project: ${projectId || 'auto-detected via ADC'}`);
    }
    return firestore;
};

const COLLECTION_NAME = 'admin-roles';

/**
 * Admin Role Entity Structure:
 * {
 *   id: string,                    // Email as ID
 *   email: string,
 *   role: 'super-admin' | 'project-admin' | 'data-steward',
 *   assignedProjects: string[],    // For project-admin only
 *   createdAt: string (ISO),
 *   updatedAt: string (ISO),
 *   createdBy: string,
 *   isActive: boolean
 * }
 */

/**
 * Get admin role for a specific user
 * @param {string} email - User email
 * @returns {Object|null} Admin role object or null if not admin
 */
const getAdminRole = async (email) => {
    try {
        const docRef = getFirestore().collection(COLLECTION_NAME).doc(email);
        const doc = await docRef.get();

        if (!doc.exists) {
            return null;
        }

        const data = doc.data();
        return data.isActive ? data : null;
    } catch (error) {
        console.error(`Error fetching admin role for ${email}:`, error);
        throw error;
    }
};

/**
 * Set or update admin role for a user
 * @param {string} email - User email
 * @param {'super-admin'|'project-admin'} role - Admin role type
 * @param {string[]} assignedProjects - Projects for project-admin (empty for super-admin)
 * @param {string} createdBy - Email of admin who assigned the role
 * @returns {Object} Created/updated admin role
 */
const setAdminRole = async (email, role, assignedProjects = [], createdBy) => {
    try {
        const docRef = getFirestore().collection(COLLECTION_NAME).doc(email);
        const existingDoc = await docRef.get();

        const now = new Date().toISOString();

        const adminRole = {
            id: email,
            email: email,
            role: role,
            assignedProjects: role === 'super-admin' ? [] : assignedProjects,
            updatedAt: now,
            isActive: true
        };

        if (existingDoc.exists) {
            // Update existing
            await docRef.update(adminRole);
        } else {
            // Create new
            adminRole.createdAt = now;
            adminRole.createdBy = createdBy;
            await docRef.set(adminRole);
        }

        return adminRole;
    } catch (error) {
        console.error(`Error setting admin role for ${email}:`, error);
        throw error;
    }
};

/**
 * Delete/deactivate admin role for a user
 * @param {string} email - User email
 * @returns {boolean} Success status
 */
const deleteAdminRole = async (email) => {
    try {
        const docRef = getFirestore().collection(COLLECTION_NAME).doc(email);
        const doc = await docRef.get();

        if (!doc.exists) {
            return false;
        }

        // Soft delete - mark as inactive
        await docRef.update({
            isActive: false,
            updatedAt: new Date().toISOString()
        });

        return true;
    } catch (error) {
        console.error(`Error deleting admin role for ${email}:`, error);
        throw error;
    }
};

/**
 * Check if user is any type of admin
 * @param {string} email - User email
 * @returns {boolean}
 */
const isAdmin = async (email) => {
    const role = await resolveAdminRole(email);
    return role !== null;
};

/**
 * Check if user is super-admin
 * @param {string} email - User email
 * @returns {boolean}
 */
const isSuperAdmin = async (email) => {
    const role = await resolveAdminRole(email);
    return role?.role === 'super-admin';
};

/**
 * Check if user is admin for a specific project
 * @param {string} email - User email
 * @param {string} projectId - GCP Project ID
 * @returns {boolean}
 */
const isProjectAdmin = async (email, projectId) => {
    const role = await resolveAdminRole(email);

    if (!role) return false;

    // Super-admins have access to all projects
    if (role.role === 'super-admin') return true;

    // Project-admins only have access to assigned projects
    return role.assignedProjects.includes(projectId);
};

/**
 * Get all active admin roles
 * @returns {Object[]} List of admin roles
 */
const getAllAdmins = async () => {
    try {
        const snapshot = await getFirestore()
            .collection(COLLECTION_NAME)
            .where('isActive', '==', true)
            .get();

        if (snapshot.empty) {
            return [];
        }

        const admins = [];
        snapshot.forEach(doc => {
            admins.push(doc.data());
        });

        return admins;
    } catch (error) {
        console.error('Error fetching all admins:', error);
        throw error;
    }
};

/**
 * Get all admins for a specific project
 * @param {string} projectId - GCP Project ID
 * @returns {Object[]} List of admin roles with access to the project
 */
const getProjectAdmins = async (projectId) => {
    try {
        const allAdmins = await getAllAdmins();

        return allAdmins.filter(admin =>
            admin.role === 'super-admin' ||
            admin.assignedProjects.includes(projectId)
        );
    } catch (error) {
        console.error(`Error fetching admins for project ${projectId}:`, error);
        throw error;
    }
};

/**
 * Add a project to a project-admin's assigned projects
 * @param {string} email - Admin email
 * @param {string} projectId - Project ID to add
 * @returns {Object} Updated admin role
 */
const addProjectToAdmin = async (email, projectId) => {
    try {
        const role = await getAdminRole(email);

        if (!role) {
            throw new Error(`No admin role found for ${email}`);
        }

        if (role.role === 'super-admin') {
            return role; // Super-admins have access to all projects
        }

        if (!role.assignedProjects.includes(projectId)) {
            role.assignedProjects.push(projectId);

            const docRef = getFirestore().collection(COLLECTION_NAME).doc(email);
            await docRef.update({
                assignedProjects: role.assignedProjects,
                updatedAt: new Date().toISOString()
            });
        }

        return role;
    } catch (error) {
        console.error(`Error adding project ${projectId} to admin ${email}:`, error);
        throw error;
    }
};

/**
 * Remove a project from a project-admin's assigned projects
 * @param {string} email - Admin email
 * @param {string} projectId - Project ID to remove
 * @returns {Object} Updated admin role
 */
const removeProjectFromAdmin = async (email, projectId) => {
    try {
        const role = await getAdminRole(email);

        if (!role) {
            throw new Error(`No admin role found for ${email}`);
        }

        if (role.role === 'super-admin') {
            return role; // Can't remove projects from super-admin
        }

        role.assignedProjects = role.assignedProjects.filter(p => p !== projectId);

        const docRef = getFirestore().collection(COLLECTION_NAME).doc(email);
        await docRef.update({
            assignedProjects: role.assignedProjects,
            updatedAt: new Date().toISOString()
        });

        return role;
    } catch (error) {
        console.error(`Error removing project ${projectId} from admin ${email}:`, error);
        throw error;
    }
};

/**
 * Check if a user is a data owner (has OWNER role) on a specific BigQuery dataset
 * @param {string} email - User email
 * @param {string} projectId - GCP Project ID
 * @param {string} datasetId - BigQuery Dataset ID
 * @returns {boolean}
 */
const isDatasetOwner = async (email, projectId, datasetId) => {
    if (!email || !projectId || !datasetId) return false;

    try {
        const bigquery = new BigQuery({ projectId });
        const dataset = bigquery.dataset(datasetId);
        const [metadata] = await dataset.getMetadata();
        const access = metadata.access || [];

        // Check if user has OWNER role on this dataset
        const isOwner = access.some(entry =>
            entry.userByEmail?.toLowerCase() === email.toLowerCase() &&
            entry.role === 'OWNER'
        );

        if (isOwner) {
            console.log(`[ADMIN-RESOLVE] User ${email} is data owner on ${projectId}.${datasetId}`);
        }

        return isOwner;
    } catch (err) {
        console.warn(`[ADMIN-RESOLVE] Dataset owner check failed for ${email} on ${projectId}.${datasetId}:`, err.message);
        return false;
    }
};

/**
 * Check if user can manage access for a specific dataset (is admin OR data owner)
 * @param {string} email - User email
 * @param {string} projectId - GCP Project ID
 * @param {string} datasetId - BigQuery Dataset ID (optional)
 * @returns {boolean}
 */
const canManageDatasetAccess = async (email, projectId, datasetId = null) => {
    // First check if user is a regular admin (super-admin or project-admin)
    const isAdminUser = await isProjectAdmin(email, projectId);
    if (isAdminUser) return true;

    // If datasetId provided, check if user is data owner
    if (datasetId) {
        const isOwner = await isDatasetOwner(email, projectId, datasetId);
        if (isOwner) return true;
    }

    return false;
};

/**
 * Get all datasets where user is OWNER (for showing relevant access requests)
 * @param {string} email - User email
 * @param {string[]} projectIds - List of project IDs to check
 * @returns {Array<{projectId: string, datasetId: string}>}
 */
const getOwnedDatasets = async (email, projectIds) => {
    const ownedDatasets = [];

    for (const projectId of projectIds) {
        try {
            const bigquery = new BigQuery({ projectId });
            const [datasets] = await bigquery.getDatasets();

            for (const dataset of datasets) {
                try {
                    const [metadata] = await dataset.getMetadata();
                    const access = metadata.access || [];

                    const isOwner = access.some(entry =>
                        entry.userByEmail?.toLowerCase() === email.toLowerCase() &&
                        entry.role === 'OWNER'
                    );

                    if (isOwner) {
                        ownedDatasets.push({
                            projectId: projectId,
                            datasetId: dataset.id
                        });
                    }
                } catch (err) {
                    // Skip datasets we can't read metadata for
                }
            }
        } catch (err) {
            console.warn(`[ADMIN-RESOLVE] Could not list datasets in ${projectId}:`, err.message);
        }
    }

    console.log(`[ADMIN-RESOLVE] User ${email} owns ${ownedDatasets.length} datasets`);
    return ownedDatasets;
};

/**
 * Helper: Check if a user is a Data Steward in Dataplex Catalog
 * Searches for any entries where this user is listed in the contacts aspect.
 */
const isUserASteward = async (email) => {
    if (!email) return false;

    try {
        const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT_ID;
        if (!projectId) return false;

        const client = new CatalogServiceClient();
        const location = 'global';

        // Search query specifically looking for the email in any contact role (steward, owner, producer, etc.)
        // We use the common pattern found in the app
        const query = `(dataplex-types.global.contacts.steward:"${email}" OR dataplex-types.global.contacts.owner:"${email}")`;

        console.log(`[ADMIN-RESOLVE] Checking Data Steward status for ${email} via Dataplex search...`);

        const [results] = await client.searchEntries({
            name: `projects/${projectId}/locations/${location}`,
            query: query,
            pageSize: 1
        });

        const isSteward = results && results.length > 0;
        if (isSteward) {
            console.log(`[ADMIN-RESOLVE] User ${email} is a Data Steward for at least one asset.`);
        }
        return isSteward;
    } catch (err) {
        console.warn(`[ADMIN-RESOLVE] Data Steward search failed for ${email}:`, err.message);
        return false;
    }
};

/**
 * Resolve admin role with fallbacks (Firestore -> Super Admin Env -> GCP IAM -> Data Steward)
 * @param {string} email - User email
 * @returns {Object|null}
 */
const resolveAdminRole = async (email) => {
    if (!email) return null;

    // 1. Check Firestore (Primary Source of Truth)
    const firestoreRole = await getAdminRole(email);
    if (firestoreRole) return firestoreRole;

    // 2. Check SUPER_ADMIN_EMAIL environment variable
    const SUPER_ADMIN = process.env.SUPER_ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL;
    if (SUPER_ADMIN && email.toLowerCase() === SUPER_ADMIN.toLowerCase()) {
        console.log(`[ADMIN-RESOLVE] User ${email} matches SUPER_ADMIN env`);
        return {
            email: email,
            role: 'super-admin',
            assignedProjects: [],
            isActive: true,
            isEnvAligned: true
        };
    }

    // 3. Optional: Check GCP IAM (Fallback for Project Owners/Editors)
    try {
        const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT_ID;
        if (projectId) {
            const { verifyUserAccess } = require('./gcpIamService');
            const isOwner = await verifyUserAccess(projectId, email, 'roles/owner');
            const isEditor = await verifyUserAccess(projectId, email, 'roles/editor');

            if (isOwner || isEditor) {
                console.log(`[ADMIN-RESOLVE] User ${email} recognized as admin via IAM on ${projectId}`);
                return {
                    email: email,
                    role: 'project-admin',
                    assignedProjects: [projectId],
                    isActive: true,
                    isGcpAligned: true
                };
            }
        }
    } catch (err) {
        console.warn('[ADMIN-RESOLVE] IAM fallback check failed:', err.message);
    }

    // 4. Data Steward Fallback (Dynamic Admin Rights)
    const isSteward = await isUserASteward(email);
    if (isSteward) {
        const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT_ID;
        return {
            email: email,
            role: 'data-steward', // New role type for dynamic stewards
            assignedProjects: projectId ? [projectId] : [],
            isActive: true,
            isStewardAligned: true
        };
    }

    return null;
};

module.exports = {
    getAdminRole,
    setAdminRole,
    deleteAdminRole,
    isAdmin,
    isSuperAdmin,
    isProjectAdmin,
    getAllAdmins,
    getProjectAdmins,
    addProjectToAdmin,
    removeProjectFromAdmin,
    resolveAdminRole,
    // Data owner functions
    isDatasetOwner,
    canManageDatasetAccess,
    getOwnedDatasets
};
