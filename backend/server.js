// server.js
const express = require('express');
const fs = require('fs').promises;
const { GoogleAuth, OAuth2Client } = require('google-auth-library');
const { google } = require('googleapis');
const { CatalogServiceClient, DataScanServiceClient, protos, DataplexServiceClient } = require('@google-cloud/dataplex');
const { LineageClient } = require('@google-cloud/lineage');
const { ProjectsClient } = require('@google-cloud/resource-manager');
const { DataCatalogClient } = require('@google-cloud/datacatalog');
const path = require('path');
const cors = require('cors');
const authMiddleware = require('./middlewares/authMiddleware');
const { querySampleFromBigQuery } = require('./utility');
const { sendAccessRequestEmail, sendFeedbackEmail } = require('./services/emailService');
const { BigQuery } = require('@google-cloud/bigquery');


class CustomGoogleAuth extends GoogleAuth {
  constructor(token) {
    super();
    this.token = token;
  }

  async getClient() {
    const client = new OAuth2Client();
    client.setCredentials({ access_token: this.token });
    return client;
  }

  // Add getUniverseDomain() stub to fix gax compatibility
  async getUniverseDomain() {
    return 'googleapis.com'; // default public cloud domain
  }
}


const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());

// Middleware to parse JSON request bodies
app.use(express.json());

// Serve static files from the React build folder
app.use(express.static(path.join(__dirname, 'dist')));

// --- File Path for Local Data ---
const dataFilePath = path.join(__dirname, 'configData.json');


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
    
    const {email, role } = req.body;
    const accessToken = req.headers.authorization?.split(' ')[1]; // Expect
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
        const oauth2Client = new CustomGoogleAuth(accessToken);
        
        // Get the Cloud Resource Manager API client
        const cloudResourceManager = google.cloudresourcemanager({
             version: 'v1',
            auth: oauth2Client,
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
  const { query, pageSize, pageToken } = req.body;

  // Validate that a search query was provided
  if (!query) {
    return res.status(400).json({ message: 'Bad Request: A "query" field is required in the request body.' });
  }

  try {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const location = process.env.GCP_LOCATION;
    const accessToken = req.headers.authorization?.split(' ')[1]; // Expect

    const oauth2Client = new CustomGoogleAuth(accessToken);

    const dataplexClientv1 = new CatalogServiceClient({
        auth: oauth2Client,
    });


    if (!projectId || !location) {
        return res.status(500).json({ message: 'Server Configuration Error: GOOGLE_CLOUD_PROJECT_ID and GCP_LOCATION must be set in the .env file.' });
    }

    // Construct the request for the Dataplex API
    const request = {
      // The name of the project and location to search within
      name: `projects/${projectId}/locations/${location}`,
      query: query,
      pageSize: pageSize ?? 20,
      pageToken: pageToken ?? '',
    };

    console.log('Performing Dataplex search with query:', query);

    // Call the searchEntries method of the Dataplex client
    const [data, requestData, response] = await dataplexClientv1.searchEntries(request, { autoPaginate: false });

    // Send the search results back to the client
    res.json({data : data, requestData : requestData, results : response});

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
app.post('/api/v1/aspects', async (req, res) => {
  const { entryName } = req.body;
  const accessToken = req.headers.authorization?.split(' ')[1]; // Expect

  // Validate that an entryName was provided
  if (!entryName) {
    return res.status(400).json({ message: 'Bad Request: An "entryName" field is required in the request body.' });
  }

  try {

    const oauth2Client = new CustomGoogleAuth(accessToken);

    const dataplexClientv1 = new CatalogServiceClient({
        auth: oauth2Client,
    });
    // Construct the request to get a specific entry.
    // The `view` is set to 'FULL' to ensure all aspects are returned.
    const request = {
      name: entryName,
      view: 'FULL',
    };

    console.log(`Fetching aspects for entry: ${entryName}`);

    // Call the getEntry method of the Dataplex client
    const [entry] = await dataplexClientv1.getEntry(request);

    // The aspects are contained within the 'aspects' property of the entry object.
    // If the property exists, return it, otherwise return an empty object.
    res.json(entry.aspects || {});

  } catch (error) {
    console.error(`Error fetching aspects for entry ${entryName}:`, error);
    // Return a generic error message to the client
    res.status(500).json({ message: 'An error occurred while fetching aspects from Dataplex.', details: error.message });
  }
});

app.post('/api/v1/batch-aspects', async (req, res) => {
    const { entryNames } = req.body;
    const accessToken = req.headers.authorization?.split(' ')[1]; // Expect

    // Validate that entryNames is provided and is an array
    if (!entryNames || !Array.isArray(entryNames)) {
        return res.status(400).json({ message: 'Bad Request: An "entryNames" field (array of strings) is required.' });
    }

    // if (entryNames.length === 0) {
    //     return res.json([]);
    // }

    try {

        const oauth2Client = new CustomGoogleAuth(accessToken);

        const dataplexClientv1 = new CatalogServiceClient({
            auth: oauth2Client,
        });
        console.log(`Fetching aspects for a batch of ${entryNames.length} entries.`);

        // Create an array of promises, where each promise fetches one entry
        const promises = entryNames.map(n => {
            //const request = { name, view: protos.google.cloud.dataplex.v1.EntryView.ALL };
            return dataplexClientv1.getAspectType({ name:n });
        });

        // Execute all promises concurrently
        const results = await Promise.all(promises);

        // Map the results to a more user-friendly format
        let aspectsResponse = {};
        results.forEach(([aspectType], index) => {
            aspectsResponse[aspectType.displayName ?? entryNames[index]] = aspectType.metadataTemplate?.recordFields?.map(f =>f.name);
        });

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
app.get('/api/v1/aspect-types', async (req, res) => {
  try {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const location = process.env.GCP_LOCATION;
    const accessToken = req.headers.authorization?.split(' ')[1]; // Expect

    const oauth2Client = new CustomGoogleAuth(accessToken);

    const dataplexClientv1 = new CatalogServiceClient({
        auth: oauth2Client,
    });

    if (!projectId || !location) {
        return res.status(500).json({ message: 'Server Configuration Error: GOOGLE_CLOUD_PROJECT_ID and GCP_LOCATION must be set in the .env file.' });
    }

    const parent = `projects/${projectId}/locations/${location}`;
    console.log(`Listing aspect types for parent: ${parent}`);

    // The listAspectTypes method returns an iterable. We'll collect all results into an array.
    const [aspects] = await dataplexClientv1.listAspectTypes({ parent });

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
app.get('/api/v1/entry-list', async (req, res) => {
  try {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const location = process.env.GCP_LOCATION;
    const accessToken = req.headers.authorization?.split(' ')[1]; // Expect

    const oauth2Client = new CustomGoogleAuth(accessToken);

    const dataplexClientv1 = new CatalogServiceClient({
        auth: oauth2Client,
    });

    if (!projectId || !location) {
        return res.status(500).json({ message: 'Server Configuration Error: GOOGLE_CLOUD_PROJECT_ID and GCP_LOCATION must be set in the .env file.' });
    }

    const parent = `projects/${projectId}/locations/${location}`;
    console.log(`Listing aspect types for parent: ${parent}`);

    // The listAspectTypes method returns an iterable. We'll collect all results into an array.
    const [entries] = await dataplexClientv1.listEntries({ parent });

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
app.get('/api/v1/entry-types', async (req, res) => {
  try {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const location = process.env.GCP_LOCATION;
    const accessToken = req.headers.authorization?.split(' ')[1]; // Expect

    const oauth2Client = new CustomGoogleAuth(accessToken);

    const dataplexClientv1 = new CatalogServiceClient({
        auth: oauth2Client,
    });

    if (!projectId || !location) {
        return res.status(500).json({ message: 'Server Configuration Error: GOOGLE_CLOUD_PROJECT_ID and GCP_LOCATION must be set in the .env file.' });
    }

    const parent = `projects/${projectId}/locations/${location}`;
    console.log(`Listing aspect types for parent: ${parent}`);

    // The listEntryTypes method returns an iterable. We'll collect all results into an array.
    const [entries] = await dataplexClientv1.listEntryTypes({ parent });

    res.json(entries);

  } catch (error) {
    console.error('Error listing aspect types:', error);
    res.status(500).json({ message: 'An error occurred while listing aspect types from Dataplex.', details: error.message });
  }
});


/**
 * GET /api/get-entry
 * A protected endpoint to list all available Aspect Types in a given location.
 * The user must be authenticated.
 */
app.get('/api/v1/get-entry', async (req, res) => {
  try {

    const entryName = req.query.entryName; // Get entryName from query parameters
    const accessToken = req.headers.authorization?.split(' ')[1]; // Expect

    const oauth2Client = new CustomGoogleAuth(accessToken);

    const dataplexClientv1 = new CatalogServiceClient({
        auth: oauth2Client,
    });

    if (!entryName) {
        return res.status(500).json({ message: 'Entry name is required' });
    }

    // The getEntry method returns an entry.
    const [entry] = await dataplexClientv1.getEntry({ name: entryName, view: protos.google.cloud.dataplex.v1.EntryView.ALL });

    res.json(entry);

  } catch (error) {
    console.error('Error fetching entry', error);
    res.status(500).json({ message: 'An error occurred while fetching entry from Dataplex.', details: error.message });
  }
});

/**
 * GET /api/get-entry-by-fqn
 * A protected endpoint to list all available Aspect Types in a given location.
 * The user must be authenticated.
 */
app.get('/api/v1/get-entry-by-fqn', async (req, res) => {
  try {

    let query  = `fully_qualified_name=${req.query.fqn}`;

    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const location = process.env.GCP_LOCATION;
    const accessToken = req.headers.authorization?.split(' ')[1]; // Expect

    const oauth2Client = new CustomGoogleAuth(accessToken);

    const dataplexClientv1 = new CatalogServiceClient({
        auth: oauth2Client,
    });


    if (!projectId || !location) {
        return res.status(500).json({ message: 'Server Configuration Error: GOOGLE_CLOUD_PROJECT_ID and GCP_LOCATION must be set in the .env file.' });
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
    const [response] = await dataplexClientv1.searchEntries(request);


    const entryName = response.length > 0 ? response[0].dataplexEntry.name : null ; // Get entryName from query parameters

    if (!entryName) {
        return res.status(500).json({ message: 'FQN is not provided or incorrect' });
    }

    // The getEntry method returns an entry.
    const [entry] = await dataplexClientv1.getEntry({ name: entryName, view: protos.google.cloud.dataplex.v1.EntryView.ALL });

    res.json(entry);

  } catch (error) {
    console.error('Error fetching entry', error);
    res.status(500).json({ message: 'An error occurred while fetching entry from Dataplex.', details: error.message });
  }
});

app.get('/api/v1/lookup-entry', async (req, res) => {
  try {

    const entryName = req.query.entryName; // Get entryName from query parameters
    const accessToken = req.headers.authorization?.split(' ')[1]; // Expect

    const oauth2Client = new CustomGoogleAuth(accessToken);

    const dataplexClientv1 = new CatalogServiceClient({
        auth: oauth2Client,
    });

    if (!entryName) {
        return res.status(500).json({ message: 'Entry name is required' });
    }

    // The getEntry method returns an entry.
    const [entry] = await dataplexClientv1.lookupEntry({ name: entryName, view: protos.google.cloud.dataplex.v1.EntryView.ALL });

    res.json(entry);

  } catch (error) {
    console.error('Error fetching entry', error);
    res.status(500).json({ message: 'An error occurred while fetching entry from Dataplex.', details: error.message });
  }
});

app.get('/api/v1/get-sample-data', async (req, res) => {
  try {

    const fqn = req.query.fqn; // Get entryName from query parameters
    const accessToken = req.headers.authorization?.split(' ')[1]; // Expect

    if (!fqn) {
        return res.status(500).json({ message: 'fqn is required' });
    }

    // const oauth2Client = new CustomGoogleAuth(accessToken);
    const oauth2Client = new OAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });
    const bigquery = new BigQuery({
        authClient: oauth2Client,
        projectId: fqn.split(':')[1].split('.')[0],
    });

    const rows = await querySampleFromBigQuery(bigquery, fqn.split(':')[1], 10);

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
app.post('/api/v1/lineage', async (req, res) => {
  const { parent, fqn } = req.body;

  if (!fqn && !parent) {
    return res.status(400).json({ message: 'Bad Request: A "fqn and parent" field is required.' });
  }

  try {
    const accessToken = req.headers.authorization?.split(' ')[1]; // Expect

    const oauth2Client = new CustomGoogleAuth(accessToken);

    const dataplexLineageClientv1 = new LineageClient({
        auth: oauth2Client,
    });

    //const parent = `projects/${projectId}/locations/us`;
    console.log(`Searching for lineage links targeting resource: ${fqn}`);

    // The searchLinks method returns an iterable. We'll collect all results.
    const source = dataplexLineageClientv1.searchLinks({
      parent: parent,
      source: {
        fullyQualifiedName: fqn,
      }
    });
    const target = dataplexLineageClientv1.searchLinks({
      parent: parent,
      target: {
        fullyQualifiedName: fqn,
      }
    });

    const [sourceLinks, targetLinks] = await Promise.all([
        source, target
    ]);

    const links = [...sourceLinks[0].map(s => s.name), ...targetLinks[0].map(t => t.name)];
    //let batchData = [];
    let sourceData = sourceLinks[0];
    let targetData = targetLinks[0];
    if(links.length > 0){
        const batchProcess = dataplexLineageClientv1.batchSearchLinkProcesses({
            parent:parent,
            links:links,
            pageSize:20
        });

        const [batchProcessLinks] = await Promise.all([
            batchProcess
        ]);

        if(batchProcessLinks[0].length > 0){
            batchData = batchProcessLinks[0];
            const linkToProcessMap = {};

            batchProcessLinks[0].forEach(f => {
                f.links.forEach(l => {
                    linkToProcessMap[l.link] = f.process;
                });
            });
            sourceData = sourceLinks[0].map(s => ({
                ...s,
                process: linkToProcessMap[s.name] || ""
            }));
            
            targetData = targetLinks[0].map(s => ({
                ...s,
                process: linkToProcessMap[s.name] || ""
            }));
        }
    }


    res.json({sourceLinks:sourceData, targetLinks:targetData});//, batchSearchLinkProcesses : batchData});

  } catch (error) {
    console.error('Error searching for lineage links:', error);
    res.status(500).json({ message: 'An error occurred while fetching data lineage.', details: error.message });
  }
});

app.post('/api/v1/lineage-downstream', async (req, res) => {
  const { parent, fqn } = req.body;

  if (!fqn && !parent) {
    return res.status(400).json({ message: 'Bad Request: A "fqn and parent" field is required.' });
  }

  try {
    const accessToken = req.headers.authorization?.split(' ')[1]; // Expect

    const oauth2Client = new CustomGoogleAuth(accessToken);

    const dataplexLineageClientv1 = new LineageClient({
        auth: oauth2Client,
    });

    //const parent = `projects/${projectId}/locations/us`;
    console.log(`Searching for lineage links targeting resource: ${fqn}`);

    // The searchLinks method returns an iterable. We'll collect all results.
    const [sourceLinks] = await dataplexLineageClientv1.searchLinks({
      parent: parent,
      source: {
        fullyQualifiedName: fqn,
      }
    });

    res.json({sourceLinks : sourceLinks[0]});

  } catch (error) {
    console.error('Error searching for lineage links:', error);
    res.status(500).json({ message: 'An error occurred while fetching data lineage.', details: error.message });
  }
});

app.post('/api/v1/lineage-upstream', async (req, res) => {
  const { parent, fqn } = req.body;

  if (!fqn && !parent) {
    return res.status(400).json({ message: 'Bad Request: A "fqn and parent" field is required.' });
  }

  try {
    const accessToken = req.headers.authorization?.split(' ')[1]; // Expect

    const oauth2Client = new CustomGoogleAuth(accessToken);

    const dataplexLineageClientv1 = new LineageClient({
        auth: oauth2Client,
    });

    //const parent = `projects/${projectId}/locations/us`;
    console.log(`Searching for lineage links targeting resource: ${fqn}`);

    // The searchLinks method returns an iterable. We'll collect all results.
    const [targetLinks] = await dataplexLineageClientv1.searchLinks({
      parent: parent,
      target: {
        fullyQualifiedName: fqn,
      }
    });

    res.json({targetLinks : targetLinks[0]});//, batchSearchLinkProcesses : batchProcessLinks});

  } catch (error) {
    console.error('Error searching for lineage links:', error);
    res.status(500).json({ message: 'An error occurred while fetching data lineage.', details: error.message });
  }
});

app.post('/api/v1/lineage-processes', async (req, res) => {
  const { parent } = req.body;

  if (!parent) {
    return res.status(400).json({ message: 'Bad Request: A "parent" field is required.' });
  }

  try {
    const accessToken = req.headers.authorization?.split(' ')[1]; // Expect

    const oauth2Client = new CustomGoogleAuth(accessToken);

    const dataplexLineageClientv1 = new LineageClient({
        auth: oauth2Client,
    });

    //const parent = `projects/${projectId}/locations/us`;
    console.log(`Searching for lineage links targeting resource: ${fqn}`);

    // The searchLinks method returns an iterable. We'll collect all results.
    const [processes] = await dataplexLineageClientv1.listProcesses({
      parent: parent
    });

    res.json({processes:processes});

  } catch (error) {
    console.error('Error searching for lineage links:', error);
    res.status(500).json({ message: 'An error occurred while fetching data lineage.', details: error.message });
  }
});

app.post('/api/v1/get-process-and-job-details', async (req, res) => {
  const { process } = req.body;

  if (!process) {
    return res.status(400).json({ message: 'Bad Request: A "process" field is required.' });
  }

  try {
    const accessToken = req.headers.authorization?.split(' ')[1]; // Expect

    const oauth2Client = new CustomGoogleAuth(accessToken);

    const dataplexLineageClientv1 = new LineageClient({
        auth: oauth2Client,
    });

    // The searchLinks method returns an iterable. We'll collect all results.

    const getProcess = dataplexLineageClientv1.getProcess({
      name: process
    });
    const listProcessRuns = dataplexLineageClientv1.listRuns({
        parent:process,
        pageSize:50
    });

    const [processDetails, processRuns] = await Promise.all([
        getProcess, listProcessRuns
    ]);
    const projectId = processDetails[0].origin.name.split(':')[0];
    
    const bigquery = new BigQuery({
        authClient: oauth2Client,
        projectId: projectId,
    });
    const jobId = processDetails[0].attributes.bigquery_job_id.stringValue;

    const jobDetails = await bigquery.job(jobId).get();

    res.json({processDetails:processDetails[0], processRuns: processRuns[0], jobDetails:jobDetails});//, batchSearchLinkProcesses : batchProcessLinks});

  } catch (error) {
    console.error('Error searching for lineage links:', error);
    res.status(500).json({ message: 'An error occurred while fetching data lineage query.', details: error.message });
  }
});

app.get('/api/v1/projects', async (req, res) => {
  try {
    console.log('Listing all accessible GCP projects.');
    const accessToken = req.headers.authorization?.split(' ')[1]; // Expect

    const oauth2Client = new CustomGoogleAuth(accessToken);

    const resourceManagerClient = new ProjectsClient({
        auth: oauth2Client,
    });

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
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const location = process.env.GCP_LOCATION;

    if (!projectId || !location) {
        return res.status(500).json({ message: 'Server Configuration Error: GOOGLE_CLOUD_PROJECT_ID and GCP_LOCATION must be set in the .env file.' });
    }

    // The parent for Data Catalog resources includes the project and location.
    const parent = `projects/${projectId}/locations/${location}`;
    console.log(`Listing tag templates for parent: ${parent}`);
    const accessToken = req.headers.authorization?.split(' ')[1]; // Expect

    const oauth2Client = new CustomGoogleAuth(accessToken);

    const dataCatalogClientv1 = new DataCatalogClient({
        auth: oauth2Client,
    });


    // The listTagTemplates method returns an iterable. We'll collect all results into an array.
    const [templates] = await dataCatalogClientv1.listTagTemplates({ parent });

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
app.post('/api/v1/admin/configure', async (req, res) => {
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

app.post('/api/v1/get-aspect-detail', async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Bad Request: A "name" field is required.' });
    }

    try {
    const accessToken = req.headers.authorization?.split(' ')[1]; // Expect

    const oauth2Client = new CustomGoogleAuth(accessToken);

    const dataplexClientv1 = new CatalogServiceClient({
        auth: oauth2Client,
    });

    const [aspectType] = await dataplexClientv1.getAspectType({ name:name });


    res.json(aspectType);

  } catch (error) {
    console.error('Error listing configs:', error);
    res.status(500).json({ message: 'An error occurred while getting aspect detail.', details: error.message });
  }
});

app.get('/api/v1/app-configs', async (req, res) => {
    try {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const location = process.env.GCP_LOCATION;
    const accessToken = req.headers.authorization?.split(' ')[1]; // Expect

    const oauth2Client = new CustomGoogleAuth(accessToken);

    const dataplexClientv1 = new CatalogServiceClient({
        auth: oauth2Client,
    });

    const resourceManagerClientv1 = new ProjectsClient({
        auth: oauth2Client,
    });

    if (!projectId || !location) {
        return res.status(500).json({ message: 'Server Configuration Error: GOOGLE_CLOUD_PROJECT_ID and GCP_LOCATION must be set in the .env file.' });
    }

    const parent = `projects/${projectId}/locations/${location}`;
    const aspectQuery = `type=projects/dataplex-types/locations/global/entryTypes/aspecttype`

    // Construct the request for the Dataplex API
    const request = {
      // The name of the project and location to search within
      name: parent,
      query: aspectQuery,
      pageSize:999, // Limit the number of results returned
      pageToken:'',
    };

    
    let projects = aspects = [];
    let configData = {};
    try{
      const [aspectsList, projectList, currentProject, defaultConfigData] = await Promise.all([
          dataplexClientv1.searchEntries(request, { autoPaginate: false}),
          resourceManagerClientv1.searchProjects({pageSize:2000}, { autoPaginate: false}),
          resourceManagerClientv1.getProject({ name: `projects/${projectId}` }),
          fs.readFile(dataFilePath, 'utf8') || {}
      ]);
      aspects = aspectsList[0] || [];
      let p = projectList[0] ? projectList[0].filter(pr => pr.projectId !== projectId) : [];
      projects = [ currentProject[0], ...p];
      configData = defaultConfigData ? JSON.parse(defaultConfigData) : {};
    } catch(err){
      console.error('Error listing projects for app config:', err);
    }

    const reduceAspect = ({ name, fullyQualifiedName, entrySource, entryType }) => ({ name, fullyQualifiedName, entrySource, entryType });

    const configs = {
        aspects: aspects.map(({ dataplexEntry }) => ({ dataplexEntry:reduceAspect(dataplexEntry) })),
        projects: projects.map(({ projectId, name, displayName }) => ({ projectId, name, displayName })),
        defaultSearchProduct: configData.products || 'All',
        defaultSearchAssets: configData.assets || '',
        browseByAspectTypes: configData.aspectType || []
    };

    res.json(configs);

  } catch (error) {
    console.error('Error listing configs:', error);
    res.status(401).json({ message: 'An error occurred while generating app configs.', details: error.message });
  }
});


app.post('/api/v1/send-feedback', async (req, res) => {
  
  try {
    const { message, requesterEmail, projectId, projectAdmin } = req.body;
    
    if (!requesterEmail || typeof requesterEmail !== 'string' || requesterEmail.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: 'Requester email is required and must be a non-empty string' 
      });
    }
    
    if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: 'Project ID is required and must be a non-empty string' 
      });
    }

    if (projectAdmin && (!Array.isArray(projectAdmin) || !projectAdmin.every(email => typeof email === 'string'))) {
      return res.status(400).json({ 
        success: false, 
        error: 'Emails should array of email strings' 
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(requesterEmail)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email format' 
      });
    }
    
    console.log('Send feedback received:', {
      message: message ? 'Message provided' : 'No message',
      requesterEmail,
      projectId,
      projectAdmin: projectAdmin || [],
      timestamp: new Date().toISOString()
    }); 

    const accessToken = req.headers.authorization?.split(' ')[1]; // Expect

    // Send feedback email
    console.log('About to send feedback email...');
    const emailResult = await sendFeedbackEmail(
      accessToken,
      message || '',
      requesterEmail,
      projectId,
      projectAdmin || [] // Pass projectAdmin emails
    );
    
    console.log('Email result:', emailResult);
    
    if (emailResult.success) {
      // Log successful access request
      console.log('Access request processed successfully:', {
        requesterEmail,
        projectId,
        projectAdmin: projectAdmin || [],
        messageId: emailResult.messageId,
        timestamp: new Date().toISOString()
      });
      
      return res.status(200).json({
        success: true,
        message: 'Feedback submitted successfully',
        data: {
          requesterEmail,
          projectId,
          projectAdmin: projectAdmin || [],
          messageId: emailResult.messageId,
          submittedAt: new Date().toISOString()
        }
      });
    } else {
      console.error('Failed to send feedback email:', emailResult.error);
      const errorResponse = {
        success: false,
        error: 'Failed to feedback email',
        details: emailResult.error
      };
      console.log('Error response:', errorResponse);
      return res.status(500).json(errorResponse);
    }
    
  } catch (error) {
    console.error('Error processing access request:', error);
    console.log('Sending 500 error response from catch block...');
    const errorResponse = {
      success: false,
      error: 'Internal server error',
      message: 'Failed to process access request',
      details: error.message
    };
    console.log('Catch block error response:', errorResponse);
    return res.status(500).json(errorResponse);
  }
});

app.get('/api/v1/get-projects', async (req, res) => {
    try {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const location = process.env.GCP_LOCATION;
    const accessToken = req.headers.authorization?.split(' ')[1]; // Expect

    const oauth2Client = new CustomGoogleAuth(accessToken);

    const resourceManagerClientv1 = new ProjectsClient({
        auth: oauth2Client,
    });

    if (!projectId || !location) {
        return res.status(500).json({ message: 'Server Configuration Error: GOOGLE_CLOUD_PROJECT_ID and GCP_LOCATION must be set in the .env file.' });
    }
    
    let projects = [];
    try{
      const [ projectList ] = await resourceManagerClientv1.searchProjects();
      projects = projectList || [];
    } catch(err){
      console.error('Error listing projects for app config:', err);
    }
    res.json(projects.map(({ projectId, name, displayName }) => ({ projectId, name, displayName })));

  } catch (error) {
    console.error('Error listing projects:', error);
    res.status(401).json({ message: 'An error occurred while generating app configs.', details: error.message });
  }
});

/**
 * GET /api/data-scans
 * A protected endpoint to list all data quality scans in the configured location.
 */
app.get('/api/v1/data-scans', async (req, res) => {
    const { project } = req.query;
    try {
        const projectId = (project != '' && project != null && project != "undefined") ? project : process.env.GOOGLE_CLOUD_PROJECT_ID;
        const location = process.env.GCP_LOCATION;

        if (!projectId || !location) {
            return res.status(500).json({ message: 'Server Configuration Error: GOOGLE_CLOUD_PROJECT_ID and GCP_LOCATION must be set in the .env file.' });
        }

        const parent = `projects/${projectId}/locations/-`;
        console.log(`Listing data scans for parent: ${parent}`);

        const accessToken = req.headers.authorization?.split(' ')[1]; // Expect

        const oauth2Client = new CustomGoogleAuth(accessToken);

        const dataplexDataScanClientv1 = new DataScanServiceClient({
            auth: oauth2Client,
        });

        const [scans] = await dataplexDataScanClientv1.listDataScans({ parent });
        res.json(scans);

    } catch (error) {
        console.error('Error listing data quality scans:', error);
        res.status(500).json({ message: 'An error occurred while listing data quality scans.', details: error.message });
    }
});

/**
 * GET /api/data-quality-scan-jobs/:scanId
 * A protected endpoint to list the jobs (runs and results) for a specific data quality scan.
 */
app.get('/api/v1/data-quality-scan-jobs/:scanId', async (req, res) => {
    const { scanId } = req.params;

    if (!scanId) {
        return res.status(400).json({ message: 'Bad Request: A "scanId" URL parameter is required.' });
    }

    try {
        const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
        const location = process.env.GCP_LOCATION;

        if (!projectId || !location) {
            return res.status(500).json({ message: 'Server Configuration Error: GOOGLE_CLOUD_PROJECT_ID and GCP_LOCATION must be set in the .env file.' });
        }

        const parent = `projects/${projectId}/locations/${location}/dataScans/${scanId}`;
        console.log(`Listing data quality scan jobs for parent: ${parent}`);

        const accessToken = req.headers.authorization?.split(' ')[1]; // Expect

        const oauth2Client = new CustomGoogleAuth(accessToken);

        const dataplexDataScanClientv1 = new DataScanServiceClient({
            auth: oauth2Client,
        });

        // The listDataScanJobs method returns recent jobs. The result of each job contains the quality metrics.
        const [jobs] = await dataplexDataScanClientv1.listDataScanJobs({ parent });
        res.json(jobs);

    } catch (error) {
        console.error(`Error listing data quality scan jobs for scan ${scanId}:`, error);
        res.status(500).json({ message: 'An error occurred while listing data quality scan jobs.', details: error.message });
    }
});

/**
 * POST /api/entry-data-quality
 * A protected endpoint to fetch data quality scan results for a specific Dataplex entry.
 */
app.post('/api/v1/entry-data-quality', async (req, res) => {
    const { name, resourceName, parent } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Bad Request: An "resourceName" field is required.' });
    }

    try {
        // const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
        // const location = process.env.GCP_LOCATION;

        // if (!projectId || !location) {
        //     return res.status(500).json({ message: 'Server Configuration Error: GOOGLE_CLOUD_PROJECT_ID and GCP_LOCATION must be set.' });
        // }

        const accessToken = req.headers.authorization?.split(' ')[1]; // Expect

        const oauth2Client = new CustomGoogleAuth(accessToken);

        const dataplexDataScanClientv1 = new DataScanServiceClient({
            auth: oauth2Client,
        });

        //const parent = `projects/${projectId}/locations/${location}`;
        console.log(`Listing all data quality scans in ${parent} to find a match.`);
        const [scans] = await dataplexDataScanClientv1.listDataScans({ parent });
        //console.log(`Data quality scans`, scans);

        const matchingScan = scans.filter(scan => (scan.data.resource === name && scan.type === 'DATA_QUALITY') );
        //console.log(`Data quality scan matching resource: ${resourceName}`, matchingScan);

        // if (!matchingScan) {
        //     return res.status(200).json({ message: `No data quality scan found for resource: ${resourceName}` });
        // }
        const scanIds = matchingScan.map(scan => scan.name);
        //console.log(`Fetching jobs for ${scanIds.length} matching data quality scans.`, scanIds);
        const promises = scanIds.map(scanId => {
            const parent = scanId;
            return dataplexDataScanClientv1.listDataScanJobs({ parent });
        });

        const results = await Promise.all(promises);

        const jobsResponse = results.map(([jobs], index) => ({
            scanId: scanIds[index],
            jobs: jobs,
        }));
        // const jobIds = results.map(job => job.scanId);
        res.json({"scans":scans, "matchingScan":matchingScan, "jobs": jobsResponse});

    } catch (error) {
        console.error(`Error fetching data quality for entry ${resourceName}:`, error);
        res.status(500).json({ message: 'An error occurred while fetching data quality for the entry.', details: error.message });
    }
});

/**
 * POST /api/get-data-scan
 * A protected endpoint to fetch data quality scan results for a specific Dataplex entry.
 */
app.get('/api/v1/get-data-scan', async (req, res) => {
    const { name } = req.query;

    if (!name) {
        return res.status(400).json({ message: 'Bad Request: An "name" field is required.' });
    }

    try {

        const accessToken = req.headers.authorization?.split(' ')[1]; // Expect

        const oauth2Client = new CustomGoogleAuth(accessToken);

        const dataplexDataScanClientv1 = new DataScanServiceClient({
            auth: oauth2Client,
        });

        const getScan = dataplexDataScanClientv1.getDataScan({name: name, view:'FULL'});
        const listjobs = dataplexDataScanClientv1.listDataScanJobs({ parent:name});
        const [scan, jobs] = await Promise.all([getScan, listjobs]);
        const jobLists = jobs[0];
        const jobNames = jobLists.map(job => job.name);
        //console.log(`Fetching jobs for ${scanIds.length} matching data quality scans.`, scanIds);
        const promises = jobNames.map(jobName => {
            return dataplexDataScanClientv1.getDataScanJob({ name:jobName, view:'FULL' });
        });

        const results = await Promise.all(promises);

        const jobsResponse = results.map(([jobs], index) => (jobs));
        res.json({"scan":scan[0], "jobs": jobsResponse });

    } catch (error) {
        console.error(`Error fetching data scan for scan ${name}:`, error);
        res.status(500).json({ message: 'An error occurred while fetching data scan for scan ${name}.', details: error.message });
    }
});

/**
 * POST /api/get-data-scan
 * A protected endpoint to fetch data quality scan results for a specific Dataplex entry.
 */
app.post('/api/v1/get-jobs-scan', async (req, res) => {
    const { jobs } = req.body;

    if (!jobs) {
        return res.status(400).json({ message: 'Bad Request: An "name" field is required.' });
    }

    try {

        const accessToken = req.headers.authorization?.split(' ')[1]; // Expect

        const oauth2Client = new CustomGoogleAuth(accessToken);

        const dataplexDataScanClientv1 = new DataScanServiceClient({
            auth: oauth2Client,
        });

        const getScan = dataplexDataScanClientv1.getDataScan({name: name, view:'FULL'});
        const listjobs = dataplexDataScanClientv1.listDataScanJobs({ parent:name });
        const [scan, jobs] = await Promise.all([getScan, listjobs]);
        res.json({"scan":scan[0], "jobs": jobs[0] });

    } catch (error) {
        console.error(`Error fetching data scan for scan ${name}:`, error);
        res.status(500).json({ message: 'An error occurred while fetching data scan for scan ${name}.', details: error.message });
    }
});


/**
 * POST /api/batch-data-quality-scan-jobs
 * A protected endpoint to fetch jobs for a list of data quality scan IDs.
 */
app.post('/api/batch-data-quality-scan-jobs', async (req, res) => {
    const { scanIds } = req.body;

    if (!scanIds || !Array.isArray(scanIds)) {
        return res.status(400).json({ message: 'Bad Request: A "scanIds" field (array of strings) is required.' });
    }

    if (scanIds.length === 0) {
        return res.json([]);
    }

    try {
        const accessToken = req.headers.authorization?.split(' ')[1]; // Expect

        const oauth2Client = new CustomGoogleAuth(accessToken);

        const dataplexDataScanClientv1 = new DataScanServiceClient({
            auth: oauth2Client,
        });

        console.log(`Fetching jobs for a batch of ${scanIds.length} data quality scans.`);

        const promises = scanIds.map(scanId => {
            const parent = `projects/${projectId}/locations/${location}/dataScans/${scanId}`;
            return dataplexDataScanClientv1.listDataScanJobs({ parent });
        });

        const results = await Promise.all(promises);

        const jobsResponse = results.map(([jobs], index) => ({
            scanId: scanIds[index],
            jobs: jobs,
        }));

        res.json(jobsResponse);

    } catch (error) {
        console.error('Error fetching data quality scan jobs for batch:', error);
        res.status(500).json({ message: 'An error occurred while fetching data quality scan jobs for the batch.', details: error.message });
    }
});

app.post('/api/v1/get-dataset-entries', async (req, res) => {
    const { parent } = req.body;

    if (!parent) {
        return res.status(400).json({ message: 'Bad Request: An "parent" field is required.' });
    }

    try {
        const accessToken = req.headers.authorization?.split(' ')[1]; // Expect

        const oauth2Client = new CustomGoogleAuth(accessToken);

        const dataplexCatalogClientv1 = new CatalogServiceClient({
            auth: oauth2Client,
        });

        //const parent = `projects/${projectId}/locations/${location}/entryGroups/${entryGroupId}`;
        console.log(`Listing entries for parent: ${parent}`);
        let request = req.body.filter ? {
                parent:parent,
                filter: req.body.filter
            } : {
            parent: parent
        }

        const [entries] = await dataplexCatalogClientv1.getEntryGroup({name:parent});
        res.json(entries);

    } catch (error) {
        console.error(`Error listing entries for parent ${parent}:`, error);
        res.status(500).json({ message: 'An error occurred while listing entries.', details: error.message });
    }
});



app.post('/api/v1/access-request', async (req, res) => {
  
  try {
    const { assetName, message, requesterEmail, projectId, projectAdmin } = req.body;
    
    // Validation
    if (!assetName || typeof assetName !== 'string' || assetName.trim() === '') {
      console.log('Validation failed: Asset name is missing or invalid');
      return res.status(400).json({ 
        success: false, 
        error: 'Asset name is required and must be a non-empty string' 
      });
    }
    
    if (!requesterEmail || typeof requesterEmail !== 'string' || requesterEmail.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: 'Requester email is required and must be a non-empty string' 
      });
    }
    
    if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: 'Project ID is required and must be a non-empty string' 
      });
    }

    if (projectAdmin && (!Array.isArray(projectAdmin) || !projectAdmin.every(email => typeof email === 'string'))) {
      return res.status(400).json({ 
        success: false, 
        error: 'Project admin must be an array of email strings' 
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(requesterEmail)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email format' 
      });
    }
    
    console.log('Access request received:', {
      assetName,
      message: message ? 'Message provided' : 'No message',
      requesterEmail,
      projectId,
      projectAdmin: projectAdmin || [],
      timestamp: new Date().toISOString()
    }); 

    const accessToken = req.headers.authorization?.split(' ')[1]; // Expect

    // Send access request email
    console.log('About to send access request email...');
    const emailResult = await sendAccessRequestEmail(
      accessToken,
      assetName,
      message || '',
      requesterEmail,
      projectId,
      projectAdmin || [] // Pass projectAdmin emails
    );
    
    console.log('Email result:', emailResult);
    
    if (emailResult.success) {
      // Log successful access request
      console.log('Access request processed successfully:', {
        assetName,
        requesterEmail,
        projectId,
        projectAdmin: projectAdmin || [],
        messageId: emailResult.messageId,
        timestamp: new Date().toISOString()
      });
      
      return res.status(200).json({
        success: true,
        message: 'Access request submitted successfully',
        data: {
          assetName,
          requesterEmail,
          projectId,
          projectAdmin: projectAdmin || [],
          messageId: emailResult.messageId,
          submittedAt: new Date().toISOString()
        }
      });
    } else {
      console.error('Failed to send access request email:', emailResult.error);
      const errorResponse = {
        success: false,
        error: 'Failed to send access request email',
        details: emailResult.error
      };
      console.log('Error response:', errorResponse);
      return res.status(500).json(errorResponse);
    }
    
  } catch (error) {
    console.error('Error processing access request:', error);
    console.log('Sending 500 error response from catch block...');
    const errorResponse = {
      success: false,
      error: 'Internal server error',
      message: 'Failed to process access request',
      details: error.message
    };
    console.log('Catch block error response:', errorResponse);
    return res.status(500).json(errorResponse);
  }
});

/**
 * GET /api/access-request/health
 * Health check endpoint for access request service
 */
app.get('/api/access-request/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Access request service is healthy',
    timestamp: new Date().toISOString(),
    service: 'email-service',
    version: '1.0.0'
  });
});

// Basic health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).send('API is running!');
});
// Basic health check endpoint
app.get('/', (req, res) => {
    res.redirect('/home'); // Redirects to the /home route
});

// For any other routes, serve the React index.html
app.get('/*\w', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    console.log('API Endpoints:');
    console.log(`  POST /api/v1/check-iam-role`);
    console.log(`  POST /api/v1/search`);
    console.log(`  GET /api/health`);
    console.log(`process.env.GOOGLE_CLOUD_PROJECT_ID: ${process.env.GOOGLE_CLOUD_PROJECT_ID || 'Not set'}`);
});

