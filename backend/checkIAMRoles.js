// server.js
const express = require('express');
const { GoogleAuth } = require('google-auth-library');
const { google } = require('googleapis');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

// --- Configuration for Google Service Account ---
// IMPORTANT: Never hardcode your service account key in production.
// Use environment variables to store the path to your service account key file.
//
// To set this environment variable:
// On Linux/macOS: export GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account-key.json
// On Windows (CMD): set GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\your\service-account-key.json
// On Windows (PowerShell): $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\your\service-account-key.json"
//
// If not using GOOGLE_APPLICATION_CREDENTIALS env var, you can directly
// specify the path here, but this is less secure for production.
const serviceAccountKeyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!serviceAccountKeyPath) {
    console.warn('Environment variable GOOGLE_APPLICATION_CREDENTIALS is not set.');
    console.warn('The application will attempt to use default credentials (e.g., from gcloud CLI or GCE metadata).');
    console.warn('For explicit service account authentication, please set this variable.');
}

// Initialize GoogleAuth client
let authClient;
let cloudResourceManager;
let iam;

async function initializeGoogleClients() {
    try {
        authClient = new GoogleAuth({
            keyFile: serviceAccountKeyPath, // This will be null if GOOGLE_APPLICATION_CREDENTIALS is not set
            scopes: ['https://www.googleapis.com/auth/cloud-platform'], // Scope for accessing Google Cloud resources
        });
        const auth = await authClient.getClient();

        cloudResourceManager = google.cloudresourcemanager({
            version: 'v1',
            auth: auth,
        });

        iam = google.iam({
            version: 'v1',
            auth: auth,
        });
        console.log('Google API clients (Cloud Resource Manager, IAM) initialized.');
    } catch (error) {
        console.error('Failed to initialize Google API clients:', error.message);
        // In a real application, you might want to handle this more gracefully
        // e.g., by retrying or exposing a health check that fails.
        // For now, we'll let the API endpoints handle the error if clients are not ready.
    }
}

// Call the initialization function once on startup
initializeGoogleClients();

/**
 * Fetches the details of a given IAM role, including its permissions and any included roles.
 * Handles both predefined and custom roles.
 * @param {string} roleName - The full name of the role (e.g., "roles/viewer", "projects/my-project/roles/myCustomRole").
 * @returns {Promise<Object>} - An object containing role details (permissions, includedRoles).
 */
const getRoleDetails = async (roleName) => {
    try {
        // Predefined roles
        if (roleName.startsWith('roles/')) {
            const response = await iam.roles.get({ name: roleName });
            return {
                permissions: response.data.includedPermissions || [],
                includedRoles: response.data.includedRoles || [], // Note: predefined roles can include other predefined roles
            };
        }
        // Project-level custom roles (assuming project context for custom roles)
        // This is a simplification; custom roles can also be at organization level.
        // For project-level custom roles, the roleName will be like "projects/PROJECT_ID/roles/ROLE_ID"
        // We need to extract the project ID and role ID.
        const parts = roleName.split('/');
        if (parts.length >= 4 && parts[0] === 'projects' && parts[2] === 'roles') {
            const projectId = parts[1];
            const customRoleId = parts[3];
            const response = await iam.projects.roles.get({
                name: `projects/${projectId}/roles/${customRoleId}`,
            });
            return {
                permissions: response.data.includedPermissions || [], // Custom roles also use includedPermissions
                includedRoles: [], // Custom roles typically don't directly 'include' other roles like predefined ones
            };
        }

        // Fallback for unrecognized role format or other custom role types (e.g., organization roles)
        console.warn(`Could not determine type for role: ${roleName}. Assuming no permissions or included roles.`);
        return { permissions: [], includedRoles: [] };

    } catch (error) {
        console.error(`Error fetching details for role ${roleName}:`, error.message);
        // If a role is not found (e.g., deleted custom role), treat it as having no permissions
        if (error.code === 404) {
            return { permissions: [], includedRoles: [] };
        }
        throw error; // Re-throw for other types of errors
    }
};

/**
 * Recursively resolves all permissions granted by a set of roles.
 * @param {Set<string>} rolesToResolve - A set of role names to process.
 * @param {string} projectId - The project ID (needed for custom roles).
 * @param {Map<string, Object>} roleCache - Cache to store already resolved role details to prevent redundant API calls.
 * @returns {Promise<Set<string>>} - A set of unique effective permissions.
 */
const resolveEffectivePermissions = async (rolesToResolve, projectId, roleCache) => {
    const effectivePermissions = new Set();
    const queue = new Set(rolesToResolve);
    const processed = new Set();

    for (const roleName of queue) { // Iterate over a copy of the set to allow modification
        if (processed.has(roleName)) {
            continue;
        }
        processed.add(roleName);

        let roleDetails;
        if (roleCache.has(roleName)) {
            roleDetails = roleCache.get(roleName);
        } else {
            roleDetails = await getRoleDetails(roleName);
            roleCache.set(roleName, roleDetails);
        }

        // Add direct permissions
        roleDetails.permissions.forEach(perm => effectivePermissions.add(perm));

        // Add included roles to the queue for further processing
        roleDetails.includedRoles.forEach(includedRole => {
            if (!processed.has(includedRole)) {
                queue.add(includedRole); // Add to the queue for next iteration
            }
        });
    }
    return effectivePermissions;
};


/**
 * POST /check-iam-permissions
 * Checks all effective IAM permissions for a given email on a Google Cloud Project.
 *
 * Request Body:
 * {
 * "projectId": "your-gcp-project-id", // e.g., "my-project-12345"
 * "email": "user-to-check@example.com" // The email of the user/service account
 * }
 *
 * Response:
 * {
 * "email": "user-to-check@example.com",
 * "projectId": "your-gcp-project-id",
 * "assignedRoles": ["roles/viewer", "roles/editor"],
 * "effectivePermissions": ["compute.instances.get", "storage.objects.list", ...],
 * "message": "..."
 * }
 */
app.post('/check-iam-permissions', async (req, res) => {
    const { projectId, email } = req.body;

    // --- Input Validation ---
    if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
        return res.status(400).json({ error: 'projectId is required and must be a non-empty string.' });
    }
    if (!email || typeof email !== 'string' || email.trim() === '') {
        return res.status(400).json({ error: 'email is required and must be a non-empty string.' });
    }

    if (!cloudResourceManager || !iam) {
        console.error('Google API clients not initialized. Attempting re-initialization.');
        await initializeGoogleClients(); // Try to re-initialize if not ready
        if (!cloudResourceManager || !iam) {
            return res.status(500).json({ error: 'Google API clients failed to initialize. Please check service account setup.' });
        }
    }

    // Ensure the email is in the correct format for IAM members (e.g., "user:email@example.com", "serviceAccount:id@project.iam.gserviceaccount.com")
    const memberIdentifier = email.includes(':') ? email : `user:${email}`;
    const serviceAccountIdentifier = email.includes(':') ? email : `serviceAccount:${email}`; // Also check as serviceAccount

    try {
        console.log(`Fetching IAM policy for project: ${projectId} to check email: ${email}`);
        const response = await cloudResourceManager.projects.getIamPolicy({
            resource: projectId,
        });

        const policy = response.data;
        const assignedRoles = new Set();

        // Iterate through the policy bindings to find roles assigned to the member
        if (policy && policy.bindings) {
            for (const binding of policy.bindings) {
                if (binding.members && (binding.members.includes(memberIdentifier) || binding.members.includes(serviceAccountIdentifier))) {
                    assignedRoles.add(binding.role);
                }
            }
        }

        if (assignedRoles.size === 0) {
            console.log(`Email ${email} has no direct roles on project ${projectId}.`);
            return res.json({
                email: email,
                projectId: projectId,
                assignedRoles: [],
                effectivePermissions: [],
                message: `Email ${email} has no direct roles on project ${projectId}.`
            });
        }

        // Resolve effective permissions from the assigned roles
        const roleCache = new Map(); // Cache to prevent redundant API calls for role details
        const effectivePermissions = await resolveEffectivePermissions(assignedRoles, projectId, roleCache);

        const sortedPermissions = Array.from(effectivePermissions).sort();
        const sortedAssignedRoles = Array.from(assignedRoles).sort();

        console.log(`Successfully analyzed permissions for ${email} on project ${projectId}.`);
        return res.json({
            email: email,
            projectId: projectId,
            assignedRoles: sortedAssignedRoles,
            effectivePermissions: sortedPermissions,
            message: `Successfully retrieved effective permissions for ${email} on project ${projectId}.`
        });

    } catch (error) {
        console.error('Error checking IAM permissions:', error.message);
        if (error.code === 403 || (error.errors && error.errors[0] && error.errors[0].reason === 'FORBIDDEN')) {
            return res.status(403).json({
                error: 'Permission Denied: The service account does not have the necessary permissions to get IAM policy or role details.',
                details: error.message,
                requiredPermissions: ['resourcemanager.projects.getIamPolicy', 'iam.roles.get', 'iam.roles.list'] // Add list for general role lookup
            });
        }
        return res.status(500).json({ error: 'An internal server error occurred.', details: error.message });
    }
});

/**
 * GET /list-gcp-roles
 * Lists all predefined GCP roles and their direct permissions.
 * This does not resolve nested permissions recursively, just direct ones.
 *
 * Response:
 * {
 * "roles": [
 * { "name": "roles/viewer", "title": "Viewer", "description": "Provides read-only access to all resources.", "permissions": ["compute.disks.get", ...] },
 * ...
 * ],
 * "message": "..."
 * }
 */
app.get('/list-gcp-roles', async (req, res) => {
    try {
        if (!iam) {
            console.error('Google IAM client not initialized. Attempting re-initialization.');
            await initializeGoogleClients();
            if (!iam) {
                return res.status(500).json({ error: 'Google IAM client failed to initialize. Please check service account setup.' });
            }
        }

        console.log('Listing all predefined GCP roles...');
        const roles = [];
        let pageToken = null;

        do {
            const response = await iam.roles.list({
                pageSize: 100, // Fetch 100 roles at a time
                pageToken: pageToken,
                view: 'FULL', // Request full details including permissions
            });

            if (response.data.roles) {
                roles.push(...response.data.roles.map(role => ({
                    name: role.name,
                    title: role.title,
                    description: role.description,
                    permissions: role.includedPermissions || [],
                    stage: role.stage,
                })));
            }
            pageToken = response.data.nextPageToken;
        } while (pageToken);

        console.log(`Successfully listed ${roles.length} predefined GCP roles.`);
        return res.json({
            roles: roles.sort((a, b) => a.name.localeCompare(b.name)),
            message: `Successfully listed ${roles.length} predefined GCP roles.`
        });

    } catch (error) {
        console.error('Error listing GCP roles:', error.message);
        if (error.code === 403 || (error.errors && error.errors[0] && error.errors[0].reason === 'FORBIDDEN')) {
            return res.status(403).json({
                error: 'Permission Denied: The service account does not have the necessary permissions to list IAM roles.',
                details: error.message,
                requiredPermissions: ['iam.roles.list']
            });
        }
        return res.status(500).json({ error: 'An internal server error occurred.', details: error.message });
    }
});


// Basic health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('API is running!');
});

// Start the server
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
    console.log('API Endpoints:');
    console.log(`  POST /check-iam-permissions`);
    console.log(`  GET /list-gcp-roles`);
    console.log(`  GET /health`);
});
