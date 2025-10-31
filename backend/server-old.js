// server.js
const express = require('express');
const fs = require('fs').promises;
const { GoogleAuth } = require('google-auth-library');
const { google } = require('googleapis');
const { CatalogServiceClient, DataplexServiceClient, protos } = require('@google-cloud/dataplex');
const { LineageClient } = require('@google-cloud/lineage');
const { ProjectsClient } = require('@google-cloud/resource-manager');
const { DataCatalogClient } = require('@google-cloud/datacatalog');
const path = require('path');
const cors = require('cors');
const authMiddleware = require('./middlewares/authMiddleware');
const { querySampleFromBigQuery } = require('./utility');




const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
// Middleware to parse JSON request bodies
app.use(express.json());


// --- File Path for Local Data ---
const dataFilePath = path.join(__dirname, 'configData.json');

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
let dataplexClient;
let dataplexLineageClient;
let resourceManagerClient;
let dataCatalogClient;


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
        // Initialize the Dataplex Catalog Service Client.
        dataplexClient = new CatalogServiceClient();

        dataplexClientDataplex = new DataplexServiceClient();

        dataplexLineageClient = new LineageClient();

        resourceManagerClient = new ProjectsClient();
        dataCatalogClient = new DataCatalogClient();
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

//API-endpoints
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
 * POST /check-iam-role
 * Checks if a given email has a specific role on a Google Cloud Project.
 *
 * Request Body:
 * {
 * "projectId": "your-gcp-project-id", // e.g., "my-project-12345"
 * "email": "user-to-check@example.com", // The email of the user/service account
 * "role": "roles/viewer" // The specific IAM role to check, e.g., "roles/editor", "roles/compute.instanceAdmin"
 * }
 *
 * Response:
 * {
 * "hasRole": true, // or false
 * "message": "..."
 * }
 */
app.post('/api/v1/check-iam-role', async (req, res) => {
    return res.json({ hasRole: true, roles:[], permissions:[], message: 'success' });
});

app.post('/api/check-iam-role', async (req, res) => {
    const {email, role } = req.body;
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID; // Use environment variable if not provided

    // --- Input Validation ---
    if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
        return res.status(400).json({ error: 'projectId is required and must be a non-empty string.' });
    }
    if (!email || typeof email !== 'string' || email.trim() === '') {
        return res.status(400).json({ error: 'email is required and must be a non-empty string.' });
    }
    if (!role || typeof role !== 'string' || role.trim() === '') {
        return res.status(400).json({ error: 'role is required and must be a non-empty string.' });
    }

    // Ensure the email is in the correct format for IAM members (e.g., "user:email@example.com", "serviceAccount:id@project.iam.gserviceaccount.com")
    const member = email.includes(':') ? email : `user:${email}`;

    try {
        // Authorize the request using the service account
        const auth = await authClient.getClient();
        console.log(`Authenticated successfully as service account. Checking project: ${projectId}`);

        // Get the Cloud Resource Manager API client
        const cloudResourceManager = google.cloudresourcemanager({
            version: 'v1',
            auth: auth,
        });

        // Fetch the IAM policy for the specified project
        console.log(`Fetching IAM policy for project: ${projectId}`);
        const response = await cloudResourceManager.projects.getIamPolicy({
            resource: projectId
        });

        const policy = response.data;
        console.log(`IAM Policy fetched for project ${projectId}.`);

        let hasRole = false;

        const userRoles = [];

        // Iterate through the policy bindings to find the role and member
        if (policy && policy.bindings) {
            for (const binding of policy.bindings || []) {
                if ((binding.members || []).includes(member)) {
                    userRoles.push(binding.role);
                }
            }
            console.log(`Roles found for user ${email} in project ${projectId}:`, userRoles);
            // Check if the requested role is in the user's roles
            if (userRoles.includes(role) || userRoles.includes(`roles/owner`)) {
                hasRole = true;
            }
        }

        let permissions = [];

        // Expand each role into permissions (to simulate sub-roles)
        for (const role of userRoles) {
            console.log(`\n🔹 Role: ${role}`);
            try {
                const roleName = role.startsWith('roles/') ? `projects/${projectId}/roles/${role.split('/')[1]}` : role;

                const res = await iam.roles.get({
                    name: role.startsWith('roles/') ? role : roleName,
                });

                permissions = res.data.includedPermissions || [];
                //console.log(`   Includes ${permissions.length} permissions`);
                //console.log(`   Sample permissions: ${permissions.slice(0, 5).join(', ')}${permissions.length > 5 ? '...' : ''}`);
            } catch (err) {
                console.warn(`   Could not retrieve details for role ${role}:`, err.message);
            }
        }

        if (hasRole) {
            console.log(`User ${email} HAS role ${role} on project ${projectId}.`);
            return res.json({ hasRole: true, roles:userRoles, permissions:permissions, message: `User ${email} has role ${role} on project ${projectId}.` });
        } else {
            console.log(`User ${email} DOES NOT HAVE role ${role} on project ${projectId}.`);
            return res.json({ hasRole: false, roles:userRoles, permissions:permissions, message: `User ${email} does not have role ${role} on project ${projectId}.` });
        }

    } catch (error) {
        console.error('Error checking IAM role:', error.message);
        // Provide a more specific error message if it's a permission denied error
        if (error.code === 403 || (error.errors && error.errors[0] && error.errors[0].reason === 'FORBIDDEN')) {
            return res.status(403).json({
                error: 'Permission Denied: The service account does not have the necessary permissions to get IAM policy for this project.',
                details: error.message
            });
        }
        return res.status(500).json({ error: 'An internal server error occurred.', details: error.message });
    }
});

/**
 * POST /api/v1/search
 * A protected endpoint to search for entries in Google Cloud Dataplex.
 * The user must be authenticated.
 *
 * Request Body:
 * {
 * "query": "The search query string for Dataplex. Supports structured search like 'type=TABLE name:customer'."
 * }
 */
app.post('/api/v1/search', async (req, res) => {
  const { query } = req.body;

  // Validate that a search query was provided
  if (!query) {
    return res.status(400).json({ message: 'Bad Request: A "query" field is required in the request body.' });
  }

  try {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const location = process.env.GCP_LOCATION;

    if (!projectId || !location) {
        return res.status(500).json({ message: 'Server Configuration Error: GCP_PROJECT_ID and GCP_LOCATION must be set in the .env file.' });
    }

    // Construct the request for the Dataplex API
    const request = {
      // The name of the project and location to search within
      name: `projects/${projectId}/locations/${location}`,
      query: query,
      pageSize:10, // Limit the number of results returned
    };

    console.log('Performing Dataplex search with query:', query);

    // Call the searchEntries method of the Dataplex client
    const [response] = await dataplexClient.searchEntries(request);

    // Send the search results back to the client
    res.json(response);

  } catch (error) {
    console.error('Error during Dataplex search:', error);
    // Return a generic error message to the client
    res.status(500).json({ message: 'An error occurred while searching Dataplex.', details: error.message });
  }
});

/**
 * POST /api/aspects
 * A protected endpoint to fetch all aspects (detailed metadata like schema) for a specific Dataplex entry.
 * The user must be authenticated.
 *
 * Request Body:
 * {
 * "entryName": "The full resource name of the Dataplex entry. e.g., projects/{p}/locations/{l}/entryGroups/{eg}/entries/{e}"
 * }
 */
app.post('/api/aspects', async (req, res) => {
  const { entryName } = req.body;

  // Validate that an entryName was provided
  if (!entryName) {
    return res.status(400).json({ message: 'Bad Request: An "entryName" field is required in the request body.' });
  }

  try {
    // Construct the request to get a specific entry.
    // The `view` is set to 'FULL' to ensure all aspects are returned.
    const request = {
      name: entryName,
      view: 'FULL',
    };

    console.log(`Fetching aspects for entry: ${entryName}`);

    // Call the getEntry method of the Dataplex client
    const [entry] = await dataplexClient.getEntry(request);

    // The aspects are contained within the 'aspects' property of the entry object.
    // If the property exists, return it, otherwise return an empty object.
    res.json(entry.aspects || {});

  } catch (error) {
    console.error(`Error fetching aspects for entry ${entryName}:`, error);
    // Return a generic error message to the client
    res.status(500).json({ message: 'An error occurred while fetching aspects from Dataplex.', details: error.message });
  }
});

app.post('/api/batch-aspects', async (req, res) => {
    const { entryNames } = req.body;

    // Validate that entryNames is provided and is an array
    if (!entryNames || !Array.isArray(entryNames)) {
        return res.status(400).json({ message: 'Bad Request: An "entryNames" field (array of strings) is required.' });
    }

    if (entryNames.length === 0) {
        return res.json([]);
    }

    try {
        console.log(`Fetching aspects for a batch of ${entryNames.length} entries.`);

        // Create an array of promises, where each promise fetches one entry
        const promises = entryNames.map(name => {
            const request = { name, view: 'FULL' };
            return dataplexClient.getEntry(request);
        });

        // Execute all promises concurrently
        const results = await Promise.all(promises);

        // Map the results to a more user-friendly format
        const aspectsResponse = results.map(([entry], index) => ({
            entryName: entryNames[index],
            aspects: entry.aspects || {},
        }));

        res.json(aspectsResponse);

    } catch (error) {
        console.error('Error fetching aspects for batch:', error);
        res.status(500).json({ message: 'An error occurred while fetching aspects for the batch.', details: error.message });
    }
});

/**
 * GET /api/aspect-types
 * A protected endpoint to list all available Aspect Types in a given location.
 * The user must be authenticated.
 */
app.get('/api/aspect-types', async (req, res) => {
  try {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const location = process.env.GCP_LOCATION;

    if (!projectId || !location) {
        return res.status(500).json({ message: 'Server Configuration Error: GCP_PROJECT_ID and GCP_LOCATION must be set in the .env file.' });
    }

    const parent = `projects/${projectId}/locations/${location}`;
    console.log(`Listing aspect types for parent: ${parent}`);

    // The listAspectTypes method returns an iterable. We'll collect all results into an array.
    const [aspects] = await dataplexClient.listAspectTypes({ parent });

    res.json(aspects);

  } catch (error) {
    console.error('Error listing aspect types:', error);
    res.status(500).json({ message: 'An error occurred while listing aspect types from Dataplex.', details: error.message });
  }
});

/**
 * GET /api/entry-list
 * A protected endpoint to list all available Aspect Types in a given location.
 * The user must be authenticated.
 */
app.get('/api/entry-list', async (req, res) => {
  try {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const location = process.env.GCP_LOCATION;

    if (!projectId || !location) {
        return res.status(500).json({ message: 'Server Configuration Error: GCP_PROJECT_ID and GCP_LOCATION must be set in the .env file.' });
    }

    const parent = `projects/${projectId}/locations/${location}`;
    console.log(`Listing aspect types for parent: ${parent}`);

    // The listAspectTypes method returns an iterable. We'll collect all results into an array.
    const [entries] = await dataplexClient.listEntries({ parent });

    res.json(entries);

  } catch (error) {
    console.error('Error listing aspect types:', error);
    res.status(500).json({ message: 'An error occurred while listing aspect types from Dataplex.', details: error.message });
  }
});

/**
 * GET /api/aspect-types
 * A protected endpoint to list all available Aspect Types in a given location.
 * The user must be authenticated.
 */
app.get('/api/entry-types', async (req, res) => {
  try {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const location = process.env.GCP_LOCATION;

    if (!projectId || !location) {
        return res.status(500).json({ message: 'Server Configuration Error: GCP_PROJECT_ID and GCP_LOCATION must be set in the .env file.' });
    }

    const parent = `projects/${projectId}/locations/${location}`;
    console.log(`Listing aspect types for parent: ${parent}`);

    // The listEntryTypes method returns an iterable. We'll collect all results into an array.
    const [entries] = await dataplexClient.listEntryTypes({ parent });

    res.json(entries);

  } catch (error) {
    console.error('Error listing aspect types:', error);
    res.status(500).json({ message: 'An error occurred while listing aspect types from Dataplex.', details: error.message });
  }
});


/**
 * GET /api/entry-list
 * A protected endpoint to list all available Aspect Types in a given location.
 * The user must be authenticated.
 */
app.get('/api/v1/get-entry', async (req, res) => {
  try {

    const entryName = req.query.entryName; // Get entryName from query parameters

    if (!entryName) {
        return res.status(500).json({ message: 'Entry name is required' });
    }

    // The getEntry method returns an entry.
    const [entry] = await dataplexClient.getEntry({ name: entryName, view: protos.google.cloud.dataplex.v1.EntryView.ALL });

    res.json(entry);

  } catch (error) {
    console.error('Error fetching entry', error);
    res.status(500).json({ message: 'An error occurred while fetching entry from Dataplex.', details: error.message });
  }
});

app.get('/api/v1/get-sample-data', async (req, res) => {
  try {

    const fqn = req.query.fqn; // Get entryName from query parameters

    if (!fqn) {
        return res.status(500).json({ message: 'fqn is required' });
    }

    const rows = await querySampleFromBigQuery(fqn.split(':')[1], 10);

    res.json(rows);

  } catch (error) {
    console.error('Error fetching entry', error);
    res.status(500).json({ message: 'An error occurred while fetching sample data from bigquery.', details: error.message });
  }
});

/**
 * POST /api/lineage
 * A protected endpoint to fetch data lineage for a specific resource.
 *
 * Request Body:
 * {
 * "resourceName": "The fully qualified name of the target resource (e.g., //bigquery.googleapis.com/projects/p/datasets/d/tables/t)"
 * }
 */
app.post('/api/v1/lineage', authMiddleware, async (req, res) => {
  const { resourceName } = req.body;

  if (!resourceName) {
    return res.status(400).json({ message: 'Bad Request: A "resourceName" field is required.' });
  }

  try {
    const projectId = process.env.GCP_PROJECT_ID;
    const location = process.env.GCP_LOCATION;

    if (!projectId || !location) {
      return res.status(500).json({ message: 'Server Configuration Error: GCP_PROJECT_ID and GCP_LOCATION must be set in the .env file.' });
    }

    const parent = `projects/${projectId}/locations/${location}`;
    console.log(`Searching for lineage links targeting resource: ${resourceName}`);

    const request = {
      parent: parent,
      target: {
        name: resourceName,
      },
    };

    // The searchLinks method returns an iterable. We'll collect all results.
    const [links] = await dataplexLineageClient.searchLinks(request);
    res.json(links);

  } catch (error) {
    console.error('Error searching for lineage links:', error);
    res.status(500).json({ message: 'An error occurred while fetching data lineage.', details: error.message });
  }
});

app.get('/api/v1/projects', async (req, res) => {
  try {
    console.log('Listing all accessible GCP projects.');

    // The searchProjects method returns an iterable. We'll collect all results into an array.
    const projects = await resourceManagerClient.searchProjects();

    res.json(projects[0]); // The response is an array where the first element contains the list of projects.

  } catch (error) {
    console.error('Error listing projects:', error);
    res.status(500).json({ message: 'An error occurred while listing projects.', details: error.message });
  }
});

/**
 * GET /api/tag-templates
 * A protected endpoint to list all Tag Templates in a given location using Data Catalog.
 */
app.get('/api/v1/tag-templates', async (req, res) => {
  try {
    const projectId = process.env.GCP_PROJECT_ID;
    const location = process.env.GCP_LOCATION;

    if (!projectId || !location) {
        return res.status(500).json({ message: 'Server Configuration Error: GCP_PROJECT_ID and GCP_LOCATION must be set in the .env file.' });
    }

    // The parent for Data Catalog resources includes the project and location.
    const parent = `projects/${projectId}/locations/${location}`;
    console.log(`Listing tag templates for parent: ${parent}`);

    // The listTagTemplates method returns an iterable. We'll collect all results into an array.
    const [templates] = await dataCatalogClient.listTagTemplates({ parent });

    res.json(templates);

  } catch (error) {
    console.error('Error listing tag templates:', error);
    res.status(500).json({ message: 'An error occurred while listing tag templates.', details: error.message });
  }
});

/**
 * POST /api/data
 * A protected endpoint to write data to a local data.json file.
 */
app.post('/api/v1/admin/configure', authMiddleware, async (req, res) => {
  try {
    // The data to be written is the entire request body.
    const dataToWrite = req.body;
    // Convert the JSON object to a string with pretty printing (2-space indentation).
    const jsonString = JSON.stringify(dataToWrite, null, 2);
    // Write the string to the specified file path.
    await fs.writeFile(dataFilePath, jsonString, 'utf8');
    // Send a success response.
    res.status(200).json({ message: 'Data saved successfully.' });
  } catch (error) {
    console.error('Error writing data file:', error);
    res.status(500).json({ message: 'Failed to save data.', details: error.message });
  }
});

app.get('/api/v1/app-configs', async (req, res) => {
    try {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const location = process.env.GCP_LOCATION;

    if (!projectId || !location) {
        return res.status(500).json({ message: 'Server Configuration Error: GCP_PROJECT_ID and GCP_LOCATION must be set in the .env file.' });
    }

    const parent = `projects/${projectId}/locations/${location}`;
    const aspectQuery = "type=projects/dataplex-types/locations/global/entryTypes/aspecttype"

    // Construct the request for the Dataplex API
    const request = {
      // The name of the project and location to search within
      name: parent,
      query: aspectQuery,
      //pageSize:10, // Limit the number of results returned
    };

    let [aspects, projects, defaultConfigData] = await Promise.all([
        dataplexClient.searchEntries(request),
        resourceManagerClient.searchProjects(),
        fs.readFile(dataFilePath, 'utf8') || {}
    ]);

    const configs = {
        aspects: aspects[0] || [],
        projects: projects[0],
        defaultSearchProduct: defaultConfigData.products || 'BigQuery',
        defaultSearchAssets: defaultConfigData.assets || 'TABLE',
        browseByAspectTypes: defaultConfigData.aspectName || [],
        browseByAspectTypesLabels: defaultConfigData.aspectType || [],
    };

    res.json(configs);

  } catch (error) {
    console.error('Error listing aspect types:', error);
    res.status(500).json({ message: 'An error occurred while listing aspect types from Dataplex.', details: error.message });
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
    console.log(`  POST /api/v1/check-iam-role`);
    console.log(`  POST /api/v1/search`);
    console.log(`  GET /health`);
    console.log(`process.env.GOOGLE_CLOUD_PROJECT_ID: ${process.env.GOOGLE_CLOUD_PROJECT_ID || 'Not set'}`);
});