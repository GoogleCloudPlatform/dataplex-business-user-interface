const { Firestore } = require('@google-cloud/firestore');
const { DataScanServiceClient } = require('@google-cloud/dataplex');

// Lazy DataScanServiceClient initialization
let dataScanClient = null;
const getDataScanClient = () => {
    if (!dataScanClient) {
        dataScanClient = new DataScanServiceClient();
    }
    return dataScanClient;
};

// Lazy Firestore initialization
let firestore = null;
const getFirestore = () => {
    if (!firestore) {
        const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT_ID;
        firestore = new Firestore(projectId ? { projectId } : {});
        console.log('Firestore initialized for dataset relationships, project:', projectId || 'auto-detect');
    }
    return firestore;
};

const COLLECTION_NAME = 'dataset-relationships';
const CACHE_TTL_HOURS = 24; // Cache for 24 hours

/**
 * Infer relationships between tables based on column naming conventions.
 * Looks for patterns like:
 * - customer_id in order_item → likely references customer table
 * - user_key in sessions → likely references user table
 * - product_fk in order_line → likely references product table
 *
 * @param {Array} tables - Array of table objects with name and schema
 * @returns {Array} - Array of {table1, table2, relationship, confidence}
 */
const inferRelationships = (tables) => {
    const relationships = [];
    const tableNames = new Set(tables.map(t => t.name.toLowerCase()));

    // Common FK patterns: {column_suffix} → {table_name}
    const fkPatterns = [
        { suffix: '_id', confidence: 'high' },
        { suffix: '_key', confidence: 'medium' },
        { suffix: '_fk', confidence: 'high' },
        { suffix: '_ref', confidence: 'medium' },
        { suffix: 'id', confidence: 'low' }, // e.g., customerid without underscore
    ];

    for (const table of tables) {
        if (!table.schema || !Array.isArray(table.schema)) continue;

        for (const column of table.schema) {
            const colName = (column.name || '').toLowerCase();

            for (const pattern of fkPatterns) {
                if (colName.endsWith(pattern.suffix)) {
                    // Extract potential referenced table name
                    // e.g., "customer_id" → "customer"
                    let refTableName = colName.slice(0, -pattern.suffix.length);

                    // Handle plurals: "customers_id" → "customer" or "customers"
                    const refTableNamePlural = refTableName + 's';
                    const refTableNameSingular = refTableName.endsWith('s')
                        ? refTableName.slice(0, -1)
                        : refTableName;

                    // Check if referenced table exists
                    let matchedTable = null;
                    if (tableNames.has(refTableName)) {
                        matchedTable = refTableName;
                    } else if (tableNames.has(refTableNamePlural)) {
                        matchedTable = refTableNamePlural;
                    } else if (tableNames.has(refTableNameSingular)) {
                        matchedTable = refTableNameSingular;
                    }

                    if (matchedTable && matchedTable !== table.name.toLowerCase()) {
                        // Find the actual table name with correct casing
                        const actualRefTable = tables.find(t =>
                            t.name.toLowerCase() === matchedTable
                        );

                        if (actualRefTable) {
                            // Avoid duplicates
                            const exists = relationships.some(r =>
                                (r.table1 === table.name && r.table2 === actualRefTable.name) ||
                                (r.table1 === actualRefTable.name && r.table2 === table.name)
                            );

                            if (!exists) {
                                relationships.push({
                                    table1: actualRefTable.name, // Referenced table (parent)
                                    table2: table.name,          // Referencing table (child)
                                    relationship: `${column.name}`,
                                    confidence: pattern.confidence,
                                    columnType: column.type || 'unknown'
                                });
                            }
                        }
                    }
                    break; // Found a match, no need to check other patterns
                }
            }
        }
    }

    // --- Phase 2: Shared column detection ---
    // If two tables share the same column name (e.g., department_id in both
    // employee and job_history), they are likely related through that column.
    const columnToTables = {}; // column_name → [table1, table2, ...]
    for (const table of tables) {
        if (!table.schema || !Array.isArray(table.schema)) continue;
        for (const column of table.schema) {
            const colName = (column.name || '').toLowerCase();
            // Only consider columns that look like join keys (_id, _key, _fk, _ref, or just "id")
            const isJoinKey = colName.endsWith('_id') || colName.endsWith('_key') ||
                colName.endsWith('_fk') || colName.endsWith('_ref') ||
                colName === 'id';
            if (!isJoinKey) continue;

            if (!columnToTables[colName]) columnToTables[colName] = [];
            columnToTables[colName].push(table.name);
        }
    }

    // For each shared column, create relationships between the tables that share it
    for (const [colName, tablesWithCol] of Object.entries(columnToTables)) {
        if (tablesWithCol.length < 2) continue;

        for (let i = 0; i < tablesWithCol.length; i++) {
            for (let j = i + 1; j < tablesWithCol.length; j++) {
                const t1 = tablesWithCol[i];
                const t2 = tablesWithCol[j];

                // Skip if this relationship already exists from Phase 1
                const exists = relationships.some(r =>
                    (r.table1 === t1 && r.table2 === t2) ||
                    (r.table1 === t2 && r.table2 === t1)
                );

                if (!exists) {
                    relationships.push({
                        table1: t1,
                        table2: t2,
                        relationship: `Shared column: ${colName}`,
                        confidence: 'medium',
                        source: 'shared_column'
                    });
                }
            }
        }
    }

    return relationships;
};

/**
 * Fetch relationships from DataScans API by analyzing Data Quality rules
 */
const fetchDataScanRelationships = async (projectId, location, tables) => {
    const relationships = [];
    try {
        const client = getDataScanClient();
        const parent = `projects/${projectId}/locations/${location || '-'}`;
        console.log(`[RELATIONSHIPS] Fetching DataScans from ${parent}...`);

        const [scans] = await client.listDataScans({ parent });

        if (!scans || scans.length === 0) {
            console.log('[RELATIONSHIPS] No DataScans found.');
            return relationships;
        }

        for (const scan of scans) {
            if (!scan.dataQualitySpec || !scan.dataQualitySpec.rules) continue;

            let targetTable = null;
            if (scan.data && scan.data.resource) {
                const parts = scan.data.resource.split('/');
                targetTable = parts[parts.length - 1];
            }

            if (!targetTable) continue;

            for (const rule of scan.dataQualitySpec.rules) {
                let sqlExpression = null;
                if (rule.rowConditionExpectation && rule.rowConditionExpectation.sqlExpression) {
                    sqlExpression = rule.rowConditionExpectation.sqlExpression;
                } else if (rule.tableConditionExpectation && rule.tableConditionExpectation.sqlExpression) {
                    sqlExpression = rule.tableConditionExpectation.sqlExpression;
                }

                if (sqlExpression) {
                    const lowerSql = sqlExpression.toLowerCase();
                    for (const otherTable of tables) {
                        const otherName = otherTable.name.toLowerCase();
                        if (otherName !== targetTable.toLowerCase() && lowerSql.includes(otherName)) {
                            let matchColumn = 'unknown (DataScan)';
                            const idRegex = new RegExp(`(\\w+_id)\\s*(?:=|in)`, 'i');
                            const match = sqlExpression.match(idRegex);
                            if (match && match[1]) matchColumn = match[1];

                            const exists = relationships.some(r =>
                                (r.table1 === targetTable && r.table2 === otherTable.name) ||
                                (r.table1 === otherTable.name && r.table2 === targetTable)
                            );

                            if (!exists) {
                                relationships.push({
                                    table1: targetTable,
                                    table2: otherTable.name,
                                    relationship: matchColumn,
                                    confidence: 'high',
                                    source: 'DataScan',
                                    description: `Inferred from Data Quality rule '${rule.description || rule.name || 'validation'}'`
                                });
                            }
                        }
                    }
                }
            }
        }
        return relationships;
    } catch (error) {
        console.warn('[RELATIONSHIPS] Error fetching DataScans:', error.message);
        return [];
    }
};

/**
 * Get cached relationships from Firestore
 */
const getCachedRelationships = async (projectId, datasetId) => {
    try {
        const db = getFirestore();
        const cacheKey = `${projectId}.${datasetId}`;
        const docRef = db.collection(COLLECTION_NAME).doc(cacheKey);
        const doc = await docRef.get();

        if (!doc.exists) {
            return null;
        }

        const data = doc.data();
        const cachedAt = data.cachedAt?.toDate ? data.cachedAt.toDate() : new Date(data.cachedAt);
        const now = new Date();
        const hoursSinceCached = (now - cachedAt) / (1000 * 60 * 60);

        if (hoursSinceCached > CACHE_TTL_HOURS) {
            console.log(`[RELATIONSHIPS] Cache expired for ${cacheKey} (${hoursSinceCached.toFixed(1)}h old)`);
            return null;
        }

        console.log(`[RELATIONSHIPS] Cache hit for ${cacheKey} (${hoursSinceCached.toFixed(1)}h old)`);
        return data.relationships;
    } catch (error) {
        console.warn('[RELATIONSHIPS] Cache read error:', error.message);
        return null;
    }
};

/**
 * Store relationships in Firestore cache
 */
const cacheRelationships = async (projectId, datasetId, relationships, tables) => {
    try {
        const db = getFirestore();
        const cacheKey = `${projectId}.${datasetId}`;
        const docRef = db.collection(COLLECTION_NAME).doc(cacheKey);

        await docRef.set({
            projectId,
            datasetId,
            relationships,
            tableCount: tables.length,
            tableNames: tables.map(t => t.name),
            cachedAt: new Date().toISOString(),
            inferredAt: new Date().toISOString()
        });

        console.log(`[RELATIONSHIPS] Cached ${relationships.length} relationships for ${cacheKey}`);
    } catch (error) {
        console.warn('[RELATIONSHIPS] Cache write error:', error.message);
    }
};

/**
 * Invalidate cache for a dataset (call when schema changes)
 */
const invalidateCache = async (projectId, datasetId) => {
    try {
        const db = getFirestore();
        const cacheKey = `${projectId}.${datasetId}`;
        await db.collection(COLLECTION_NAME).doc(cacheKey).delete();
        console.log(`[RELATIONSHIPS] Cache invalidated for ${cacheKey}`);
    } catch (error) {
        console.warn('[RELATIONSHIPS] Cache invalidate error:', error.message);
    }
};

/**
 * Add a manual relationship (user-defined)
 */
const addManualRelationship = async (projectId, datasetId, relationship) => {
    try {
        const db = getFirestore();
        const cacheKey = `${projectId}.${datasetId}`;
        const docRef = db.collection(COLLECTION_NAME).doc(cacheKey);
        const doc = await docRef.get();

        let relationships = [];
        if (doc.exists) {
            relationships = doc.data().relationships || [];
        }

        // Add manual relationship with flag
        relationships.push({
            ...relationship,
            confidence: 'manual',
            addedAt: new Date().toISOString()
        });

        await docRef.set({
            projectId,
            datasetId,
            relationships,
            cachedAt: new Date().toISOString()
        }, { merge: true });

        return relationships;
    } catch (error) {
        console.error('[RELATIONSHIPS] Add manual relationship error:', error.message);
        throw error;
    }
};

module.exports = {
    inferRelationships,
    fetchDataScanRelationships,
    getCachedRelationships,
    cacheRelationships,
    invalidateCache,
    addManualRelationship,
    CACHE_TTL_HOURS
};
