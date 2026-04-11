const { GoogleAuth } = require('google-auth-library');
const axios = require('axios');

// Simple in-memory cache for data agents (key: table identifier, value: agent resource name)
const dataAgentCache = new Map();

/**
 * Generate a unique identifier for a set of tables
 */
const generateTableIdentifier = (tableReferences) => {
    const sorted = tableReferences
        .map(t => `${t.projectId}.${t.datasetId}.${t.tableId}`)
        .sort()
        .join('|');
    return Buffer.from(sorted).toString('base64').substring(0, 32).replace(/[^a-zA-Z0-9]/g, '');
};

/**
 * Create or get a data agent for the given table references.
 * Returns the agent resource name or null if creation fails (will fall back to inline context).
 *
 * @param {Array} tableReferences - BigQuery table references
 * @param {string} systemInstruction - System instruction for the agent
 * @param {Object} options - Optional overrides for projectId, location, and accessToken
 */
const getOrCreateDataAgent = async (tableReferences, systemInstruction, { projectId, location, accessToken: providedToken } = {}) => {
    try {
        const tableId = generateTableIdentifier(tableReferences);

        // Check cache first
        if (dataAgentCache.has(tableId)) {
            console.log(`[DataAgent] Cache hit for ${tableId}`);
            return dataAgentCache.get(tableId);
        }

        const project = projectId || process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
        const loc = location || process.env.GCP_LOCATION || 'europe-west1';
        const agentId = `agent_${tableId.substring(0, 40)}`;

        // Use provided token or get a new one
        let token = providedToken;
        if (!token) {
            const auth = new GoogleAuth({
                scopes: 'https://www.googleapis.com/auth/cloud-platform'
            });
            const client = await auth.getClient();
            token = (await client.getAccessToken()).token;
        }

        const bigqueryDataSource = {
            bq: {
                tableReferences: tableReferences
            }
        };

        const agentPayload = {
            name: `projects/${project}/locations/${loc}/dataAgents/${agentId}`,
            description: `Data agent for ${tableReferences.length} table(s)`,
            data_analytics_agent: {
                published_context: {
                    datasourceReferences: bigqueryDataSource,
                    systemInstruction: systemInstruction
                }
            }
        };

        const agentUrl = `https://geminidataanalytics.googleapis.com/v1beta/projects/${project}/locations/${loc}/dataAgents`;

        console.log(`[DataAgent] Creating/Retrieving agent ${agentId} in ${loc}...`);

        try {
            const response = await axios.post(agentUrl, agentPayload, {
                params: { data_agent_id: agentId },
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200 || response.status === 201) {
                const agentName = response.data.name || agentPayload.name;
                dataAgentCache.set(tableId, agentName);
                console.log(`[DataAgent] Created: ${agentName}`);
                return agentName;
            }
        } catch (error) {
            // If agent already exists, try to get it
            if (error.response?.status === 409 || error.response?.status === 400) {
                try {
                    const getAgentUrl = `https://geminidataanalytics.googleapis.com/v1beta/projects/${project}/locations/${loc}/dataAgents/${agentId}`;
                    const getResponse = await axios.get(getAgentUrl, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (getResponse.status === 200) {
                        const agentName = getResponse.data.name;
                        dataAgentCache.set(tableId, agentName);
                        console.log(`[DataAgent] Retrieved existing: ${agentName}`);
                        return agentName;
                    }
                } catch (getError) {
                    console.warn(`[DataAgent] Failed to retrieve existing agent: ${getError.message}`);
                }
            } else {
                console.warn(`[DataAgent] Failed to create agent: ${error.response?.status} ${error.message}`);
            }
        }
    } catch (error) {
        console.log('[DataAgent] Agent creation failed, will use inline context:', error.message);
    }

    return null;
};

module.exports = {
    getOrCreateDataAgent,
    generateTableIdentifier
};
