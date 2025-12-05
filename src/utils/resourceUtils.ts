export const getName = (namePath: string = '', separator: string = '') => {
  const segments: string[] = namePath.split(separator);
  return (segments[segments.length - 1]);
};

export const getEntryType = (namePath: string = '', separator: string = '') => {
  const segments: string[] = namePath.split(separator);
  let eType = segments[segments.length - 2];
  return (`${eType[0].toUpperCase()}${eType.slice(1)}`);
};

export const getFormatedDate = (date: any) => {
  if (!date) return '-';
  const myDate = new Date(date * 1000);
  const formatedDate = new Intl.DateTimeFormat('en-US', { 
    month: "short", 
    day: "numeric", 
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit", 
    hour12: true 
  }).format(myDate);
  return formatedDate;
};

export const getFormattedDateTimeParts = (timestamp: any) => {
  if (!timestamp) {
    return { date: '-', time: '' };
  }
  
  const myDate = new Date(timestamp * 1000);

  const date = new Intl.DateTimeFormat('en-US', { 
    month: "short", 
    day: "numeric", 
    year: "numeric",
  }).format(myDate);

  const time = new Intl.DateTimeFormat('en-US', { 
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit", 
    hour12: true 
  }).format(myDate);

  return { date, time }; 
};

export const getFormattedDateTimePartsByDateTime = (dateTime: any) => {
  if (!dateTime) {
    return { date: '-', time: '' };
  }
  
  let timeValue = dateTime;
  if (typeof dateTime === 'object' && dateTime !== null && 'seconds' in dateTime) {
    timeValue = Number(dateTime.seconds) * 1000;
  }

  const myDate = new Date(timeValue);

  if (isNaN(myDate.getTime())) {
    return { date: '-', time: '' };
  }

  const date = new Intl.DateTimeFormat('en-US', { 
    month: "short", 
    day: "numeric", 
    year: "numeric",
  }).format(myDate);

  const time = new Intl.DateTimeFormat('en-US', { 
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit", 
    hour12: true 
  }).format(myDate);

  return { date, time }; 
};


export const generateBigQueryLink = (entry:any) => {
  if (!entry?.name || !entry?.fullyQualifiedName) return '';

  const type = getEntryType(entry.name, '/');
  const fqnParts = entry.fullyQualifiedName.split(':').pop().split('.');
  
  if (fqnParts.length < 2) return '';

  const project = fqnParts[0];
  const dataset = fqnParts[1];
  const table = fqnParts.length > 2 ? `&t=${fqnParts[2]}` : '';
  const pageType = type.slice(0, -1).toLowerCase();

  return `https://console.cloud.google.com/bigquery?page=${pageType}&p=${project}&d=${dataset}${table}&project=${project}`;
}

export const generateLookerStudioLink = (entry: any) => {
  if (!entry?.fullyQualifiedName) return '';
  const fqnParts = entry.fullyQualifiedName.split(':').pop().split('.');
  if (fqnParts.length < 3) return '';

  const project = fqnParts[0];
  const dataset = fqnParts[1];
  const table = fqnParts[2];
  const baseUrl = 'https://lookerstudio.google.com/u/0/reporting/create';
  const queryParams = new URLSearchParams({
    'c.mode': 'edit',
    'c.source': 'BQ_UI',
    'ds.type': 'TABLE',
    'ds.connector': 'BIG_QUERY',
    'ds.billingProjectId': project,
    'ds.projectId': project,
    'ds.datasetId': dataset,
    'ds.tableId': table,
    'ds.sqlType': 'STANDARD_SQL',
  });

  return `${baseUrl}?${queryParams.toString()}`;
};

export const hasValidAnnotationData = (aspectData: any): boolean => {
  if (!aspectData || !aspectData.data || !aspectData.data.fields) return false;

  const fields = aspectData.data.fields;
  const fieldKeys = Object.keys(fields);

  const validFields = fieldKeys.filter(key => {
    const item = fields[key];
    return (item.kind === 'stringValue' && item.stringValue) || 
           (item.kind === "listValue" && item.listValue && item.listValue.values && item.listValue.values.length > 0);
  });

  return validFields.length > 0;
};

export const typeAliases = [
  "Bucket","Cluster","Code asset","Connection","Dashboard",
  "Dashboard element","element","Data Exchange","Exchange","Data source connection","Data source",
  "Data stream","stream","Database","Database schema","schema","Dataset","Explore",
  "Feature group","group","Feature online store","store","Feature view","Fileset",
  "Folder","Function","Glossary","Glossary Category","Glossary Term",
  "Listing","Look","Model","Repository","Resource","Routine","Service",
  "Table","View","Other"
];
