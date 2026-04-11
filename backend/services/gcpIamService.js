const { google } = require('googleapis');
const { GoogleAuth, OAuth2Client } = require('google-auth-library');
const { BigQuery } = require('@google-cloud/bigquery');

/**
 * Create a BigQuery client, optionally using a user's access token.
 * @param {string} projectId - The GCP Project ID.
 * @param {string} [userAccessToken] - Optional user OAuth access token.
 */
const createBigQueryClient = (projectId, userAccessToken) => {
    if (userAccessToken) {
        // Use user's OAuth token
        const oauth2Client = new OAuth2Client();
        oauth2Client.setCredentials({ access_token: userAccessToken });
        return new BigQuery({ projectId, authClient: oauth2Client });
    }
    // Fall back to ADC (service account)
    return new BigQuery({ projectId });
};

/**
 * Grant access to a user on a specific BigQuery dataset.
 * This is more granular than project-level IAM - users only get access to the specific dataset.
 *
 * @param {string} projectId - The GCP Project ID where the dataset lives.
 * @param {string} datasetId - The BigQuery dataset ID.
 * @param {string} email - The email of the user to grant access to.
 * @param {string} role - The BigQuery role (READER, WRITER, or OWNER). Defaults to READER.
 * @param {string} [userAccessToken] - Optional admin's OAuth token (if provided, uses user auth instead of service account).
 */
const grantDatasetAccess = async (projectId, datasetId, email, role = 'READER', userAccessToken = null) => {
    console.log(`[DATASET-ACCESS] Granting ${role} access: User=${email}, Dataset=${projectId}.${datasetId}`);
    console.log(`[DATASET-ACCESS] Using ${userAccessToken ? 'user OAuth token' : 'service account'}`);

    try {
        const bigquery = createBigQueryClient(projectId, userAccessToken);
        const dataset = bigquery.dataset(datasetId);

        // Get current dataset metadata
        const [metadata] = await dataset.getMetadata();
        const access = metadata.access || [];

        // Check if user already has access
        const member = `user:${email}`;
        const existingEntry = access.find(entry =>
            entry.userByEmail === email && entry.role === role
        );

        if (existingEntry) {
            console.log(`[DATASET-ACCESS] User ${email} already has ${role} access to ${datasetId}`);
            return true;
        }

        // Add new access entry
        access.push({
            role: role,
            userByEmail: email
        });

        // Update dataset with new access list
        metadata.access = access;
        await dataset.setMetadata(metadata);

        console.log(`[DATASET-ACCESS] Successfully granted ${role} access to ${email} on ${projectId}.${datasetId}`);
        return true;

    } catch (error) {
        console.error('[DATASET-ACCESS] Error granting dataset access:', error);
        throw new Error(`Failed to grant dataset access: ${error.message}`);
    }
};

/**
 * Revoke access from a user on a specific BigQuery dataset.
 *
 * @param {string} projectId - The GCP Project ID where the dataset lives.
 * @param {string} datasetId - The BigQuery dataset ID.
 * @param {string} email - The email of the user to revoke access from.
 * @param {string} role - The BigQuery role to revoke (READER, WRITER, or OWNER).
 * @param {string} [userAccessToken] - Optional admin's OAuth token (if provided, uses user auth instead of service account).
 */
const revokeDatasetAccess = async (projectId, datasetId, email, role = 'READER', userAccessToken = null) => {
    console.log(`[DATASET-ACCESS] Revoking ${role} access: User=${email}, Dataset=${projectId}.${datasetId}`);
    console.log(`[DATASET-ACCESS] Using ${userAccessToken ? 'user OAuth token' : 'service account'}`);

    try {
        const bigquery = createBigQueryClient(projectId, userAccessToken);
        const dataset = bigquery.dataset(datasetId);

        // Get current dataset metadata
        const [metadata] = await dataset.getMetadata();
        const access = metadata.access || [];

        // Find and remove the user's access entry
        const newAccess = access.filter(entry =>
            !(entry.userByEmail === email && entry.role === role)
        );

        if (newAccess.length === access.length) {
            console.log(`[DATASET-ACCESS] User ${email} doesn't have ${role} access to ${datasetId}`);
            return true;
        }

        // Update dataset with new access list
        metadata.access = newAccess;
        await dataset.setMetadata(metadata);

        console.log(`[DATASET-ACCESS] Successfully revoked ${role} access from ${email} on ${projectId}.${datasetId}`);
        return true;

    } catch (error) {
        console.error('[DATASET-ACCESS] Error revoking dataset access:', error);
        throw new Error(`Failed to revoke dataset access: ${error.message}`);
    }
};

/**
 * Grant an IAM role to a user on a specific project.
 * NOTE: This grants project-level access. For more granular access, use grantDatasetAccess.
 * 
 * @param {string} projectId - The GCP Project ID.
 * @param {string} email - The email of the user or service account.
 * @param {string} role - The IAM role to grant (e.g., 'roles/bigquery.dataViewer').
 */
const grantIamAccess = async (projectId, email, role) => {
    console.log(`Granting IAM access: User=${email}, Role=${role}, Project=${projectId}`);

    try {
        // Use ADC
        const auth = new GoogleAuth({
            scopes: 'https://www.googleapis.com/auth/cloud-platform'
        });

        // Initialize Cloud Resource Manager API v1
        const cloudResourceManager = google.cloudresourcemanager({
            version: 'v1',
            auth: auth
        });

        // 1. Get current IAM Policy
        const getResponse = await cloudResourceManager.projects.getIamPolicy({
            resource: projectId,
            requestBody: {}
        });

        const policy = getResponse.data;
        let bindings = policy.bindings || [];
        const member = email.includes(':') ? email : `user:${email}`;

        // 2. Modify Policy
        let roleBinding = bindings.find(b => b.role === role);

        if (roleBinding) {
            // Check if member already exists
            if (!roleBinding.members.includes(member)) {
                roleBinding.members.push(member);
                console.log(`Added ${member} to existing binding for ${role}`);
            } else {
                console.log(`User ${member} already has role ${role}`);
                return true; // Already exists
            }
        } else {
            // Create new binding
            bindings.push({
                role: role,
                members: [member]
            });
            console.log(`Created new binding for ${role} with member ${member}`);
        }

        // 3. Set updated IAM Policy
        const setResponse = await cloudResourceManager.projects.setIamPolicy({
            resource: projectId,
            requestBody: {
                policy: {
                    bindings: bindings,
                    etag: policy.etag
                }
            }
        });

        console.log(`Successfully updated IAM policy for ${projectId}`);
        return true;

    } catch (error) {
        console.error('Error granting IAM access:', error);
        // Throwing error so calling service knows it failed
        throw new Error(`Failed to grant IAM access: ${error.message}`);
    }
};

/**
 * Revoke an IAM role from a user on a specific project.
 *
 * @param {string} projectId - The GCP Project ID.
 * @param {string} email - The email of the user or service account.
 * @param {string} role - The IAM role to revoke (e.g., 'roles/bigquery.dataViewer').
 */
const revokeIamAccess = async (projectId, email, role) => {
    console.log(`Revoking IAM access: User=${email}, Role=${role}, Project=${projectId}`);

    try {
        const auth = new GoogleAuth({
            scopes: 'https://www.googleapis.com/auth/cloud-platform'
        });

        const cloudResourceManager = google.cloudresourcemanager({
            version: 'v1',
            auth: auth
        });

        // 1. Get current IAM Policy
        const getResponse = await cloudResourceManager.projects.getIamPolicy({
            resource: projectId,
            requestBody: {}
        });

        const policy = getResponse.data;
        let bindings = policy.bindings || [];
        const member = email.includes(':') ? email : `user:${email}`;

        // 2. Find and modify the role binding
        const roleBindingIndex = bindings.findIndex(b => b.role === role);

        if (roleBindingIndex === -1) {
            console.log(`Role ${role} not found in project ${projectId}`);
            return true; // Role doesn't exist, nothing to revoke
        }

        const roleBinding = bindings[roleBindingIndex];
        const memberIndex = roleBinding.members.indexOf(member);

        if (memberIndex === -1) {
            console.log(`User ${member} doesn't have role ${role}`);
            return true; // User doesn't have this role, nothing to revoke
        }

        // Remove member from binding
        roleBinding.members.splice(memberIndex, 1);
        console.log(`Removed ${member} from role ${role}`);

        // If no members left in this binding, remove the entire binding
        if (roleBinding.members.length === 0) {
            bindings.splice(roleBindingIndex, 1);
            console.log(`Removed empty binding for role ${role}`);
        }

        // 3. Set updated IAM Policy
        const setResponse = await cloudResourceManager.projects.setIamPolicy({
            resource: projectId,
            requestBody: {
                policy: {
                    bindings: bindings,
                    etag: policy.etag
                }
            }
        });

        console.log(`Successfully revoked IAM access for ${email} on ${projectId}`);
        return true;

    } catch (error) {
        console.error('Error revoking IAM access:', error);
        throw new Error(`Failed to revoke IAM access: ${error.message}`);
    }
};

/**
 * Get all IAM bindings for a project
 *
 * @param {string} projectId - The GCP Project ID.
 * @returns {Object[]} List of IAM bindings
 */
const getIamBindings = async (projectId) => {
    console.log(`Fetching IAM bindings for project: ${projectId}`);

    try {
        const auth = new GoogleAuth({
            scopes: 'https://www.googleapis.com/auth/cloud-platform'
        });

        const cloudResourceManager = google.cloudresourcemanager({
            version: 'v1',
            auth: auth
        });

        const response = await cloudResourceManager.projects.getIamPolicy({
            resource: projectId,
            requestBody: {}
        });

        return response.data.bindings || [];

    } catch (error) {
        console.error('Error fetching IAM bindings:', error);
        throw new Error(`Failed to fetch IAM bindings: ${error.message}`);
    }
};

/**
 * Verify if a user has a specific IAM role on a project
 *
 * @param {string} projectId - The GCP Project ID.
 * @param {string} email - The email of the user.
 * @param {string} role - The IAM role to check.
 * @returns {boolean} True if user has the role
 */
const verifyUserAccess = async (projectId, email, role) => {
    try {
        const bindings = await getIamBindings(projectId);
        const member = email.includes(':') ? email : `user:${email}`;

        const roleBinding = bindings.find(b => b.role === role);
        if (!roleBinding) return false;

        return roleBinding.members.includes(member);

    } catch (error) {
        console.error('Error verifying user access:', error);
        return false;
    }
};

/**
 * List all members for a specific project (grouped by role)
 *
 * @param {string} projectId - The GCP Project ID.
 * @returns {Object[]} List of members with their roles
 */
const listProjectMembers = async (projectId) => {
    try {
        const bindings = await getIamBindings(projectId);

        // Create a map of members to roles
        const memberRoles = new Map();

        for (const binding of bindings) {
            for (const member of binding.members) {
                if (!memberRoles.has(member)) {
                    memberRoles.set(member, []);
                }
                memberRoles.get(member).push(binding.role);
            }
        }

        // Convert to array format
        const result = [];
        for (const [member, roles] of memberRoles.entries()) {
            // Extract email from member string (e.g., "user:email@example.com" -> "email@example.com")
            const email = member.includes(':') ? member.split(':')[1] : member;
            const type = member.includes(':') ? member.split(':')[0] : 'user';

            result.push({
                member,
                email,
                type,
                roles
            });
        }

        return result;

    } catch (error) {
        console.error('Error listing project members:', error);
        throw new Error(`Failed to list project members: ${error.message}`);
    }
};

module.exports = {
    // Dataset-level access (recommended - more granular)
    grantDatasetAccess,
    revokeDatasetAccess,
    // Project-level IAM (grants access to all datasets in project)
    grantIamAccess,
    revokeIamAccess,
    getIamBindings,
    verifyUserAccess,
    listProjectMembers
};
