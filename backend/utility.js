const {MetadataServiceClient} = require('@google-cloud/dataplex').v1;


async function getEntityMetadata(oauth2Client, name) {
  const metaDataClientv1 = new MetadataServiceClient({
    auth: oauth2Client,
  });
  //const name = `projects/${projectId}/locations/${location}/lakes/${lakeId}/zones/${zoneId}/entities/${entityId}`;
  const [entity] = await metaDataClientv1.getEntity({name});
  //console.log('Entity metadata:', entity);
  return entity;
}


async function querySampleFromBigQuery(bigquery, fqn, limit = 10) {

  // const bigquery = new BigQuery({auth: oauth2Client});
  // const query = `SELECT * FROM \`${fqn}\` LIMIT ${limit}`;
  // const options = {query, location: 'US'}; // adjust location
  // const [job] = await bigquery.createQueryJob(options);
  // console.log(`Started query job ${job.id}`);
  // const [rows] = await job.getQueryResults();

  let fqnArr = fqn.split('.');
  const table = bigquery.dataset(fqnArr[1]).table(fqnArr[2]);
  const [rows] = await table.getRows({ maxResults: limit });
  //console.table(rows);
  return rows;
}

module.exports = {
  querySampleFromBigQuery,
  getEntityMetadata
};