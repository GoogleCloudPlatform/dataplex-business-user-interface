import React, { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Grid,
  Tooltip,
  Box
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Schema from '../Schema/Schema';
import SchemaFilter from '../Schema/SchemaFilter';
import TableFilter from '../Filter/TableFilter';
import type { GridColDef, GridRowsProp } from '@mui/x-data-grid';
import TableView from '../Table/TableView';
import Avatar from '../Avatar/Avatar';
import ContentCopy from '../../assets/svg/content_copy.svg';
import { useNotification } from '../../contexts/NotificationContext';
import { InfoOutline } from '@mui/icons-material';

/**
 * @file DetailPageOverview.tsx
 * @summary Renders the "Overview" tab content for the data entry detail page.
 *
 * @description
 * This component displays a detailed overview of a specific data entry.
 * It's structured using a `Grid` layout with a main left panel (9 columns)
 * and a right sidebar (3 columns).
 *
 * **Left Panel:**
 * - **Details Accordion**: Shows key metadata like description, system, status,
 * location, and copyable identifiers (Resource, FQN).
 * - **Table Info Accordion** (Conditional): Rendered only if the entry is a
 * table (`getEntryType(entry.name, '/') == 'Tables'`). Contains tabs for:
 * - **Schema**: Displays the table schema using the `Schema` component,
 * with filtering provided by `SchemaFilter`.
 * - **Sample Data**: Displays sample rows (if `sampleTableData` is provided)
 * using `TableView`, with filtering provided by `TableFilter`. Handles
 * data structure validation and potential errors during rendering.
 * - **Documentation Accordion**: Renders documentation content (potentially HTML)
 * from the entry's overview aspect.
 *
 * **Right Sidebar:**
 * - **Contacts Accordion**: Lists associated contacts with roles, using the
 * `Avatar` component.
 * - **Info Accordion**: Displays creation and last modification timestamps.
 * - **Usage Metrics Accordion**: Shows metrics like Execution Time, Total Queries,
 * and Refresh Time, extracted from the entry's usage aspect.
 * - **Labels Accordion**: Displays key-value labels associated with the entry
 * as styled chips (grid layout).
 *
 * The component uses several helper components (`Schema`, `TableView`, `Avatar`,
 * `SchemaFilter`, `TableFilter`) and utility functions (`getFormattedDateTimeParts`,
 * `getEntryType`, `hasData`). It also includes a recursive `FieldRenderer` to
 * display various data types (string, number, list, struct) appropriately.
 * It leverages the `useNotification` hook to provide feedback when identifiers
 * are copied to the clipboard.
 * Accordions are conditionally expanded by default based on whether they contain
 * data (`hasData` helper).
 *
 * @param {object} props - The props for the DetailPageOverview component.
 * @param {any} props.entry - The main data entry object containing all details,
 * aspects (schema, contacts, usage, overview), and metadata.
 * @param {any} [props.sampleTableData] - Optional. An array of sample row data,
 * typically used when the entry is a table.
 * @param {React.CSSProperties} props.css - Optional CSS properties to apply
 * to the root `div` container.
 *
 * @returns {JSX.Element} The rendered React component for the Overview tab.
 */

const StringRenderer = ({ value }:any) => {
  // Check if the string contains HTML tags
  const isHtml = /<\/?[a-z][\s\S]*>/i.test(value);
  if (isHtml) {
    // If it's HTML, render it directly. CAUTION: This can be a security risk (XSS) if the HTML is from an untrusted source.
    return <div dangerouslySetInnerHTML={{ __html: value }} />;
  }
  return <span style={{fontSize:"14px", textTransform:"capitalize", padding:"0px 5px"}}>{value}</span>;
};

const NumberRenderer = ({ value }:any) => {
  return <span style={{fontSize:"14px"}}>{value}</span>;
};

const BooleanRenderer = ({ value }:any) => {
  return value ? 
    <span style={{fontSize:"14px"}}>TRUE</span> : 
    <span style={{fontSize:"14px"}}>FALSE</span>;
};

const ListRenderer = ({ values }:any) => {
  return (<>
      {values.map((item:any) => (
            <FieldRenderer field={item} />
      ))}
  </>);
};

const StructRenderer = ({ fields }: any) => {
  return (
    <Box style={{paddingTop:"10px"}}>
      {Object.entries(fields).map(([key, value]) => (
        <div key={key}>
            <span style={{fontWeight:"600", fontSize:"12px", textTransform:"capitalize"}}>{key.replace(/_/g, ' ')}:</span>
            <FieldRenderer field={value} />
        </div>   
      ))}
      <br/>
    </Box>
  );
};

// --- The Main Field Renderer (Component) ---

const FieldRenderer = ({ field } : any) => {
  if (!field || !field.kind) {
    return <span style={{fontSize:"14px"}}>-</span>; 
  }

  switch (field.kind) {
    case 'stringValue':
      return <StringRenderer value={field.stringValue} />;
    case 'numberValue':
      return <NumberRenderer value={field.numberValue} />;
    case 'boolValue':
      return <BooleanRenderer value={field.boolValue} />;
    case 'listValue':
      return <ListRenderer values={field.listValue.values} />;
    case 'structValue':
      return <StructRenderer fields={field.structValue.fields} />;
    default:
      return <span  style={{fontWeight:"500", fontSize:"14px"}}>Unknown kind: {field.kind}</span>;
  }
};

// //interface for the filter dropdown Props
interface DataProductOverviewNewProps {
  entry: any;
  entryType?: string|null; // Optional prop for type
  sampleTableData?: any; // Optional prop for sample data
  css: React.CSSProperties; // Optional CSS properties for the button
}

// FilterDropdown component
const DataProductOverviewNew: React.FC<DataProductOverviewNewProps> = ({ entry, entryType, sampleTableData, css, }) => {
  
  const { showNotification } = useNotification();
  const [sampleDataEnabled, setSampleDataEnabled] = React.useState(false);
  const [filteredSchemaEntry, setFilteredSchemaEntry] = useState<any>(null);
  const [filteredSampleData, setFilteredSampleData] = useState<any[]>([]);

  // Helper function to check if accordion has data
  const hasData = (data: any) => {
    if (!data) return false;
    if (Array.isArray(data)) return data.length > 0;
    if (typeof data === 'object') return Object.keys(data).length > 0;
    if (typeof data === 'string') return data.trim() !== '' && data !== 'No Documentation Available';
    return Boolean(data);
  };

const getFormattedDateTimeParts = (timestamp: any) => {
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

const { date: createDate, time: createTime } = (entryType && entryType=='data-product') ? {date : entry?.createTime.split('T')[0], time:entry?.createTime.split('T')[1]?.slice(0, 8)} : getFormattedDateTimeParts(entry?.createTime?.seconds);
const { date: updateDate, time: updateTime } = (entryType && entryType=='data-product') ? {date : entry?.updateTime.split('T')[0], time:entry?.updateTime.split('T')[1]?.slice(0, 8)} : getFormattedDateTimeParts(entry?.updateTime?.seconds);


  const getEntryType = (namePath: string = '' , separator: string = '' ) => {
    const segments: string[] = namePath.split(separator);
    let eType = segments[segments.length - 2];
    return (`${eType[0].toUpperCase()}${eType.slice(1)}`);
  };

  const number = entry.entryType.split('/')[1];

  let schema = <Schema entry={filteredSchemaEntry || entry} sx={{width:"100%", borderTopRightRadius:"0px", borderTopLeftRadius:"0px"}} />;
  let schemaData = entry.aspects[`${number}.global.schema`]?.data?.fields?.fields?.listValue?.values || [];
  let contacts = entry.aspects[`${number}.global.contacts`]?.data?.fields?.identities?.listValue?.values || [];
  let usage = entry.aspects[`${number}.global.usage`]?.data?.fields || {};
  let documentation = entry.aspects[`${number}.global.overview`]?.data?.fields?.content?.stringValue || 'No Documentation Available';

  if(entryType && entryType == 'data-product') {
    contacts = entry.aspects[`${number}.global.contacts`]?.data?.identities || [];
    console.log("contact DATA - ", contacts);
    documentation = entry.aspects[`${number}.global.overview`]?.data?.content || 'No Documentation Available';
  }

  // Always compute memoized helpers at top-level (avoid conditional hooks)
  const firstRow = React.useMemo(() => {
    if (Array.isArray(sampleTableData) && sampleTableData.length > 0 && typeof sampleTableData[0] === 'object') {
      return sampleTableData[0];
    }
    return undefined;
  }, [sampleTableData]);

  const columnKeys = React.useMemo(() => (firstRow ? Object.keys(firstRow) : []), [firstRow]);

  const columns: GridColDef[] = React.useMemo(() => (
    columnKeys.map((key) => ({ 
      field: key, 
      headerName: key, 
      flex: 1, 
      headerClassName: 'table-bg', 
      minWidth: 200 
    }))
  ), [columnKeys]);

  const columnNames = columnKeys;

  let sampleDataView = <div style={{padding:"10px"}}>Sample Data is not available.</div>;
  
  // Safe data processing with error handling
  if(sampleTableData && Array.isArray(sampleTableData) && sampleTableData.length > 0) {
    try {
      // Validate first row exists and has properties
      if (!firstRow || typeof firstRow !== 'object') {
        throw new Error('Invalid sample data structure');
      }
      
      if (columnKeys.length === 0) {
        throw new Error('No columns found in sample data');
      }
      
      // Use filtered data if available, otherwise use original data
      const displayData = filteredSampleData.length > 0 ? filteredSampleData : sampleTableData;
      
      // Safe row processing with error handling
      const displayRows: GridRowsProp = displayData.map((row: any, index: number) => {
        try {
          const rowData = { ...row };
          Object.keys(rowData).forEach((key) => {
            const cellValue = rowData[key];
            if (typeof cellValue === 'object' && cellValue !== null) {
                if ("value" in cellValue) {
                    rowData[key] = cellValue.value;
                } 
                else if (Object.keys(cellValue).length === 1) {
                    const singleKey = Object.keys(cellValue)[0];
                    rowData[key] = cellValue[singleKey];
                } 
                else {
                    rowData[key] = JSON.stringify(cellValue);
                }
            }
        });
          return ({ ...rowData, id: index + 1 });
        } catch (rowError) {
          console.warn(`Error processing row ${index}:`, rowError);
          // Return a safe fallback row
          return { 
            id: index + 1, 
            error: 'Row processing failed',
            ...Object.keys(row).reduce((acc, key) => ({ ...acc, [key]: String(row[key] || '') }), {})
          };
        }
      });
        
      sampleDataView = (
        <>
          {/* Sample Filter Bar - Only show when Sample Data tab is active */}
          <TableFilter
            data={sampleTableData}
            columns={columnNames}
            onFilteredDataChange={setFilteredSampleData}
          />
          <TableView 
            rows={displayRows} 
            columns={columns}
            columnHeaderHeight={37}
            rowHeight={36}
            sx={{
              '& .MuiDataGrid-columnHeader .MuiDataGrid-columnSeparator': {
                opacity: 0,
                '&:hover': {
                  opacity: 10,
                }
              },
              borderTopRightRadius: '0px',
              borderTopLeftRadius: '0px'
            }} 
          />
        </>
      );
    } catch (error) {
      console.error('Error processing sample data:', error);
      sampleDataView = (
        <div style={{padding:"10px", color: "#d32f2f"}}>
          Error loading sample data: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      );
    }
  } else {
    sampleDataView = <div style={{paddingTop:"48px", paddingLeft: "410px", fontSize:'14px', color: "#575757"}}>No Data available for this table</div>;
  }

  return (
    <div style={{ width: '100%', ...css }}>
        <Grid
            container
            spacing={0}
            style={{marginBottom:"5px"}}
        >
            {/* left side  */}
            <Grid size={9} sx={{ padding: "10px 5px 10px 0px" }}>
                {/* Details Accordion */}
                <Box sx={{ 
                    border: "1px solid #DADCE0", 
                    borderRadius: "8px", 
                    marginTop: "10px", 
                    overflow: "hidden",
                    backgroundColor: "#FFFFFF"
                }}>
                    <Accordion 
                        defaultExpanded 
                        key="detail-accordion" 
                        sx={{
                            background: "none", 
                            boxShadow: "none", 
                            margin: "0px", 
                            borderRadius: "8px",
                            minHeight: "64px",
                            '&:before': { display: 'none' }
                        }}
                    >
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                            aria-controls="detail-content"
                            id="detail-header"
                        sx={{
                                background: "#F8FAFD",
                                minHeight: "64px",
                                '& .MuiAccordionSummary-content': {
                                    margin: 0
                                }
                        }}
                    >
                            <Box sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
                        }}>
                                <Typography 
                                    component="span"
                                    variant="heading2Medium"
                            sx={{
                                        fontWeight: 500, 
                                        fontSize: "1.125rem", 
                                        lineHeight: "1.33em",
                                        color: "#1F1F1F", 
                                        textTransform: "capitalize",
                                    }}
                                >
                                Details
                            </Typography>
                            <Tooltip title="Details provides context for the data asset including description and unique identifiers." arrow placement="right">
                                <InfoOutline
                                    sx={{
                                        fontWeight: 800,
                                        width: "18px",
                                        height: "18px",
                                        opacity: 0.9
                                    }}
                                />
                            </Tooltip>
                            </Box>
                    </AccordionSummary>
                        <AccordionDetails sx={{ 
                            padding: "0px 20px",
                            overflowY: 'scroll',
                            '&::-webkit-scrollbar': {
                                width: '8px',
                            },
                            '&::-webkit-scrollbar-track': {
                                backgroundColor: 'transparent',
                                borderRadius: '10px',
                            },
                            '&::-webkit-scrollbar-thumb': {
                                backgroundColor: '#a1a1a1ff',
                                borderRadius: '10px',
                            },
                            '&::-webkit-scrollbar-thumb:hover': {
                                background: '#7c7c7d',
                            }, 
                            }}>
                            <Box sx={{ display: "flex", flexDirection: "column" }}>
                                {/* Description Section */}
                                <Box sx={{ 
                                    borderBottom: "1px solid #DADCE0", 
                                    padding: "0.875rem 0rem",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "4px"
                                }}>
                                    <Typography sx={{
                                        fontFamily: '"Google Sans Text", sans-serif',
                                        fontWeight: 500,
                                        fontSize: "11px",
                                        lineHeight: "1.45em",
                                        letterSpacing: "0.91%",
                                        color: "#575757"
                                    }}>
                                        Description
                                    </Typography>
                                    <Typography sx={{
                                        fontFamily: '"Google Sans Text", sans-serif',
                                        fontWeight: 400,
                                        fontSize: "14px",
                                        lineHeight: "1.43em",
                                        color: "#1F1F1F"
                                    }}>
                                        {entry.entrySource.description || 'No Description Available'}
                                    </Typography>
                                </Box>
                                
                                {/* Stats Grid */}
                                <Box sx={{ display: "flex", flexDirection: "row" }}>
                                    {/* System */}
                                    <Box sx={{ 
                                        flex: 1,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "4px",
                                        padding: "14px 0px"
                                    }}>
                                        <Typography sx={{
                                            fontFamily: '"Google Sans Text", sans-serif',
                                            fontWeight: 500,
                                            fontSize: "11px",
                                            lineHeight: "1.45em",
                                            letterSpacing: "0.91%",
                                            color: "#575757"
                                        }}>
                                            System
                                        </Typography>
                                        <Typography sx={{
                                            fontFamily: '"Google Sans Text", sans-serif',
                                            fontWeight: 400,
                                            fontSize: "14px",
                                            lineHeight: "1.43em",
                                            color: "#1F1F1F"
                                        }}>
                                            {entry.entrySource.system}
                                        </Typography>
                                    </Box>
                                    
                                    {/* Status */}
                                    <Box sx={{ 
                                        flex: 1,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "4px",
                                        padding: "14px 0px"
                                    }}>
                                        <Typography sx={{
                                            fontFamily: '"Google Sans Text", sans-serif',
                                            fontWeight: 500,
                                            fontSize: "11px",
                                            lineHeight: "1.45em",
                                            letterSpacing: "0.91%",
                                            color: "#575757"
                                        }}>
                                            Status
                                        </Typography>
                                        <Box sx={{ 
                                            display: "flex", 
                                            alignItems: "center", 
                                            gap: "4px" 
                                        }}>
                                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <rect width="14" height="14" rx="7" fill="#128937"/>
                                                <path d="M5.76783 10C5.69499 10 5.62418 9.98543 5.55539 9.9563C5.4866 9.92716 5.42387 9.88346 5.36722 9.82519L3.16995 7.56512C3.05665 7.44858 3 7.30706 3 7.14057C3 6.97409 3.05665 6.83257 3.16995 6.71603C3.28326 6.59949 3.41882 6.54122 3.57663 6.54122C3.73445 6.54122 3.87405 6.59949 3.99545 6.71603L5.76783 8.53907L10.0167 4.18126C10.13 4.06472 10.2656 4.00436 10.4234 4.0002C10.5812 3.99604 10.7167 4.05639 10.83 4.18126C10.9433 4.2978 11 4.43931 11 4.6058C11 4.77229 10.9433 4.9138 10.83 5.03034L6.16844 9.82519C6.11179 9.88346 6.04906 9.92716 5.98027 9.9563C5.91148 9.98543 5.84067 10 5.76783 10Z" fill="white"/>
                                            </svg>
                                            <Typography sx={{
                                                fontFamily: '"Google Sans Text", sans-serif',
                                                fontWeight: 400,
                                                fontSize: "14px",
                                                lineHeight: "1.43em",
                                                color: "#1F1F1F"
                                            }}>
                                                Active
                                            </Typography>
                                        </Box>
                                    </Box>
                                    
                                    {/* Location */}
                                    <Box sx={{ 
                                        flex: 1,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "4px",
                                        padding: "14px 0px"
                                    }}>
                                        <Typography sx={{
                                            fontFamily: '"Google Sans Text", sans-serif',
                                            fontWeight: 500,
                                            fontSize: "11px",
                                            lineHeight: "1.45em",
                                            letterSpacing: "0.91%",
                                            color: "#575757"
                                        }}>
                                            Location
                                        </Typography>
                                        <Typography sx={{
                                            fontFamily: '"Google Sans Text", sans-serif',
                                            fontWeight: 400,
                                            fontSize: "14px",
                                            lineHeight: "1.43em",
                                            color: "#1F1F1F"
                                        }}>
                                            {entry.entrySource.location}
                                        </Typography>
                                    </Box>
                                    
                                    {/* Identifiers */}
                                    <Box sx={{ 
                                        flex: 1,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "4px",
                                        padding: "14px 20px 14px 0px"
                                    }}>
                                        <Typography sx={{
                                            fontFamily: '"Google Sans Text", sans-serif',
                                            fontWeight: 500,
                                            fontSize: "11px",
                                            lineHeight: "1.45em",
                                            letterSpacing: "0.91%",
                                            color: "#575757"
                                        }}>
                                            Identifiers
                                        </Typography>
                                        <Box sx={{ display: "flex", gap: "16px" }}>
                                        <Tooltip title={`Copy Resource to clipboard - ${entry.entrySource.resource}`} arrow>
                                                <Box 
                                                    sx={{ 
                                                        display: "flex", 
                                                        alignItems: "center", 
                                                        gap: "4px",
                                                        cursor: "pointer"
                                                    }}
                                                    onClick={() => {
                                                        showNotification(
                                                            'Copied to clipboard.',
                                                            'success',
                                                            3000,
                                                            undefined
                                                        );
                                                        navigator.clipboard.writeText(entry.entrySource.resource);
                                                    }}
                                                >
                                                    <Typography sx={{
                                                        fontFamily: '"Google Sans Text", sans-serif',
                                                        fontWeight: 700,
                                                        fontSize: "14px",
                                                        lineHeight: "1.43em",
                                                        color: "#0B57D0"
                                                    }}>
                                                        Resource
                                                    </Typography>
                                                    <Box
                                                    component="img"
                                                    src={ContentCopy}
                                                    sx={{
                                                        color: "#0B57D0",
                                                        fontSize: "14px",
                                                        width: "1em",
                                                        height: "1em",
                                                    }}
                                                    />
                                                </Box>
                                        </Tooltip>
                                        <Tooltip title={`Copy FQN to clipboard - ${entry.fullyQualifiedName}`} arrow>
                                                <Box 
                                                    sx={{ 
                                                        display: "flex", 
                                                        alignItems: "center", 
                                                        gap: "4px",
                                                        cursor: "pointer"
                                                    }}
                                                    onClick={() => {
                                                        showNotification(
                                                            'Copied to clipboard.',
                                                            'success',
                                                            3000,
                                                            undefined
                                                        );
                                                        navigator.clipboard.writeText(entry.fullyQualifiedName);
                                                    }}
                                                >
                                                    <Typography sx={{
                                                        fontFamily: '"Google Sans Text", sans-serif',
                                                        fontWeight: 700,
                                                        fontSize: "14px",
                                                        lineHeight: "1.43em",
                                                        color: "#0B57D0"
                                                    }}>
                                                        FQN
                                                    </Typography>
                                                    <Box
                                                    component="img"
                                                    src={ContentCopy}
                                                    sx={{
                                                        color: "#0B57D0",
                                                        fontSize: "14px",
                                                        width: "1em",
                                                        height: "1em",
                                                    }}
                                                    />
                                                </Box>
                                        </Tooltip>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                    </AccordionDetails>
                    </Accordion>
                </Box>
                {/* Table Info Accordion */}
                {getEntryType(entry.name, '/') == 'Tables' ? (
                    <Box sx={{ 
                        border: "1px solid #DADCE0", 
                        borderRadius: "8px", 
                        marginTop: "10px", 
                        overflow: "hidden",
                        backgroundColor: "#FFFFFF"
                    }}>
                        <Accordion 
                            defaultExpanded 
                            key="table-info-accordion" 
                            sx={{ 
                                background: "none", 
                                boxShadow: "none", 
                                margin: "0px", 
                                borderRadius: "8px",
                                minHeight: "64px",
                                '&:before': { display: 'none' }
                            }}
                        >
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                aria-controls="table-info-content"
                                id="table-info-header"
                                    sx={{
                                    background: "#F8FAFD",
                                    minHeight: "64px",
                                    '& .MuiAccordionSummary-content': {
                                        margin: 0
                                    }
                                    }}
                                >
                                <Box sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px"
                                    }}>
                                    <Typography 
                                        component="span"
                                        variant="heading2Medium"
                                        sx={{
                                            fontWeight: 500, 
                                            fontSize: "18px", 
                                            lineHeight: "1.33em",
                                            color: "#1F1F1F", 
                                            textTransform: "capitalize",
                                        }}
                                    >
                                            Table Info 
                                        </Typography>
                                    <Tooltip title="Table info shows schema and sample data for the table" arrow placement="right">
                                        <InfoOutline
                                            sx={{
                                                fontWeight: 800,
                                                width: "18px",
                                                height: "18px",
                                                opacity: 0.9
                                            }}
                                        />
                                    </Tooltip>
                                </Box>
                                </AccordionSummary>
                            <AccordionDetails sx={{ 
                                minHeight: "200px", 
                                maxHeight: "500px", 
                                overflowY: "scroll",
                                padding: "0px 0px 20px 0px",
                                '&::-webkit-scrollbar': {
                                    width: '8px',
                                },
                                '&::-webkit-scrollbar-track': {
                                    backgroundColor: 'transparent',
                                    borderRadius: '10px',
                                },
                                '&::-webkit-scrollbar-thumb': {
                                    backgroundColor: '#a1a1a1ff',
                                    borderRadius: '10px',
                                },
                                '&::-webkit-scrollbar-thumb:hover': {
                                    background: '#7c7c7d',
                                },
                                }}>
                                <Box sx={{ padding: "0px 0px 0px 20px"}}>
                                    {/* Filter Pills */}
                                    <Box sx={{ padding: "16px 0px 8px 0px" }}>
                                        <Box sx={{ display: "flex", gap: "8px" }}>
                                            <Box 
                                                sx={{
                                                    fontSize: "12px",
                                                    background: sampleDataEnabled ? "#FFFFFF" : "#E7F0FE",
                                                    color: sampleDataEnabled ? "#1F1F1F" : "#0E4DCA",
                                                    padding: "8px 13px",
                                                    borderRadius: "59px",
                                                    border: sampleDataEnabled ? "1px solid #DADCE0" : "1px solid #E7F0FE",
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "8px",
                                                    fontFamily: '"Google Sans Text", sans-serif',
                                                    fontWeight: 400,
                                                    lineHeight: "1.33em",
                                                    letterSpacing: "0.83%"
                                                }}
                                                onClick={() => setSampleDataEnabled(false)}
                                            >
                                                Schema
                                            </Box>
                                            <Box 
                                                sx={{
                                                    fontSize: "12px",
                                                    background: sampleDataEnabled ? "#E7F0FE" : "#FFFFFF", 
                                                    color: sampleDataEnabled ? "#0E4DCA" : "#1F1F1F",
                                                    padding: "8px 13px",
                                                    borderRadius: "59px",
                                                    border: sampleDataEnabled ? "1px solid #E7F0FE" : "1px solid #DADCE0",
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "8px",
                                                    fontFamily: '"Google Sans Text", sans-serif',
                                                    fontWeight: 400,
                                                    lineHeight: "1.33em",
                                                    letterSpacing: "0.83%"
                                                }}
                                                onClick={() => setSampleDataEnabled(true)}
                                            >
                                                Sample Data
                                            </Box>
                                        </Box>
                                    </Box>
                                        
                                    <Box sx={{ padding: "0px 20px 0px 0px" }}>                                          
                                        {/* Schema Filter Bar - Only show when Schema tab is active */}
                                        {!sampleDataEnabled && schemaData.length > 0 &&(
                                            <SchemaFilter
                                              entry={entry}
                                              onFilteredEntryChange={setFilteredSchemaEntry}
                                              sx={{ marginTop: '6px' }}
                                            />
                                        )}
                                    </Box>   
                                    <Box sx={{ padding: "0px 20px 0px 0px" }}>
                                            {sampleDataEnabled ? (sampleDataView) : (schema)}
                                    </Box>
                                </Box>
                                </AccordionDetails>
                            </Accordion>
                    </Box>
                ) : null}
                {/* Documentation Accordion */}
                <Box sx={{ 
                    border: "1px solid #DADCE0", 
                    borderRadius: "8px", 
                    marginTop: "10px", 
                    overflow: "hidden",
                    backgroundColor: "#FFFFFF"
                }}>
                    <Accordion 
                        defaultExpanded={hasData(documentation)} 
                        key="documentation-accordion" 
                        sx={{
                            background: "none", 
                            boxShadow: "none", 
                            margin: "0px", 
                            borderRadius: "8px",
                            minHeight: "64px",
                            '&:before': { display: 'none' }
                        }}
                    >
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                            aria-controls="documentation-content"
                            id="documentation-header"
                        sx={{
                                background: "#F8FAFD",
                                minHeight: "64px",
                                '& .MuiAccordionSummary-content': {
                                    margin: 0
                                }
                        }}
                    >
                            <Box sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
                        }}>
                                <Typography 
                                    component="span"
                                    variant="heading2Medium"
                            sx={{
                                        fontWeight: 500, 
                                        fontSize: "18px", 
                                        lineHeight: "1.33em",
                                        color: "#1F1F1F", 
                                        textTransform: "capitalize",
                                    }}
                                >
                                Documentation
                            </Typography>
                            </Box>
                    </AccordionSummary>
                        <AccordionDetails sx={{
                            minHeight: "200px",
                            maxHeight: "calc(100vh - 380px)",
                            overflowY: "scroll",
                            padding: "0px 20px 16px",
                            '&::-webkit-scrollbar': {
                                width: '8px',
                            },
                            '&::-webkit-scrollbar-track': {
                                backgroundColor: 'transparent',
                                borderRadius: '10px',
                            },
                            '&::-webkit-scrollbar-thumb': {
                                backgroundColor: '#a1a1a1ff',
                                borderRadius: '10px',
                            },
                            '&::-webkit-scrollbar-thumb:hover': {
                                background: '#7c7c7d',
                            },
                        }}>
                            <Box 
                                sx={{
                                    fontFamily: '"Google Sans Text", sans-serif',
                                    fontSize: "14px",
                                    color: "#575757",
                                    fontWeight: 400,
                                    lineHeight: "1.43em",
                                    ...(documentation === 'No Documentation Available' && {
                                        textAlign: 'center',
                                        paddingTop: '72px'
                                    })
                                }}
                                dangerouslySetInnerHTML={{ __html: documentation }} 
                            />
                    </AccordionDetails>
                    </Accordion>
                </Box>
            </Grid>

            {/* Right Sidebar */}
            <Grid size={3} sx={{ padding: "10px 0px 10px 5px" }}>
                {/* Contacts Accordion */}
                <Box sx={{ 
                    border: "1px solid #DADCE0", 
                    borderRadius: "8px", 
                    marginTop: "10px", 
                    overflow: "hidden",
                    backgroundColor: "#FFFFFF"
                }}>
                    <Accordion 
                        defaultExpanded={hasData(contacts)} 
                        key="contacts-accordion" 
                        sx={{ 
                            background: "none", 
                            boxShadow: "none", 
                            margin: "0px", 
                            borderRadius: "8px",
                            minHeight: "64px",
                            '&:before': { display: 'none' }
                        }}
                    >
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                            aria-controls="contacts-content"
                            id="contacts-header"
                        sx={{
                                background: "#F8FAFD",
                                minHeight: "64px",
                                '& .MuiAccordionSummary-content': {
                                    margin: 0
                                }
                        }}
                    >
                            <Box sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
                        }}>
                                <Typography 
                                    component="span"
                                    variant="heading2Medium"
                            sx={{
                                        fontWeight: 500, 
                                        fontSize: "18px", 
                                        lineHeight: "1.33em",
                                        color: "#1F1F1F", 
                                        textTransform: "capitalize",
                                    }}
                                >
                                Contacts
                            </Typography>
                            </Box>
                    </AccordionSummary>
                        <AccordionDetails sx={{ 
                            padding: "0px 20px",
                            overflowY: 'scroll',
                            '&::-webkit-scrollbar': {
                                width: '8px',
                            },
                            '&::-webkit-scrollbar-track': {
                                backgroundColor: 'transparent',
                                borderRadius: '10px',
                            },
                            '&::-webkit-scrollbar-thumb': {
                                backgroundColor: '#a1a1a1ff',
                                borderRadius: '10px',
                            },
                            '&::-webkit-scrollbar-thumb:hover': {
                                background: '#7c7c7d',
                            }, 
                            }}>
                            <Box sx={{ display: "flex", flexDirection: "column" }}>
                            {contacts.length > 0 ? (
                                contacts.map((contact: any, index: number) => (
                                        <Box 
                                            key={`contact-${index}`}
                                            sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                                borderBottom: index < contacts.length - 1 ? '1px solid #DADCE0' : 'none',
                                                padding: '14px 0px',
                                            }}
                                        >
                                            <Avatar text={entryType && entryType == 'data-product' ? contact.name : contact.structValue.fields.name.stringValue} />
                                            <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                                <Typography sx={{
                                                    fontFamily: '"Google Sans Text", sans-serif',
                                                    fontWeight: 500,
                                                    fontSize: "11px",
                                                    lineHeight: "1.45em",
                                                    letterSpacing: "0.91%",
                                                    color: "#575757"
                                                }}>
                                                    {entryType && entryType == 'data-product' ? contact.role : contact.structValue.fields.role.stringValue}
                                                </Typography>
                                                <Typography sx={{
                                                    fontFamily: '"Google Sans Text", sans-serif',
                                                    fontWeight: 400,
                                                    fontSize: "14px",
                                                    lineHeight: "1.43em",
                                                    color: "#1F1F1F"
                                                }}>
                                                    {entryType && entryType == 'data-product' ? contact.name : (contact.structValue.fields.name.stringValue.split('<').length > 1 ? contact.structValue.fields.name.stringValue.split('<')[1].slice(0, -1) 
                                                    : contact.structValue.fields.name.stringValue.length > 0 ? contact.structValue.fields.name.stringValue : "--")}
                                                </Typography>
                                            </Box>
                                        </Box>
                                ))
                            ) : (
                                    <Box sx={{ padding: "8px 0px" }}>
                                        <Typography sx={{
                                            fontFamily: '"Google Sans Text", sans-serif',
                                            fontWeight: 400,
                                            fontSize: "14px",
                                            lineHeight: "1.43em",
                                            color: "#575757"
                                        }}>
                                            No Contacts Available
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                    </AccordionDetails>
                    </Accordion>
                </Box>

                {/* Info Accordion */}
                <Box sx={{ 
                    border: "1px solid #DADCE0", 
                    borderRadius: "8px", 
                    marginTop: "10px", 
                    overflow: "hidden",
                    backgroundColor: "#FFFFFF"
                }}>
                    <Accordion 
                        defaultExpanded 
                        key="info-accordion" 
                        sx={{ 
                            background: "none", 
                            boxShadow: "none", 
                            margin: "0px", 
                            borderRadius: "8px",
                            minHeight: "64px",
                            '&:before': { display: 'none' }
                        }}
                    >
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                            aria-controls="info-content"
                            id="info-header"
                        sx={{
                                background: "#F8FAFD",
                                minHeight: "64px",
                                '& .MuiAccordionSummary-content': {
                                    margin: 0
                                }
                        }}
                    >
                            <Box sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
                        }}>
                                <Typography 
                                    component="span"
                                    variant="heading2Medium"
                            sx={{
                                        fontWeight: 500, 
                                        fontSize: "18px", 
                                        lineHeight: "1.33em",
                                        color: "#1F1F1F", 
                                        textTransform: "capitalize",
                                    }}
                                >
                                Info
                            </Typography>
                                <Tooltip title="Info shows historical timestamps of the asset" arrow>
                                    <InfoOutline
                                        sx={{
                                            fontWeight: 800,
                                            width: "18px",
                                            height: "18px",
                                            opacity: 0.9
                                        }}
                                    />
                                </Tooltip>
                            </Box>
                    </AccordionSummary>
                        <AccordionDetails sx={{ padding: "0px 20px" }}>
                            <Box sx={{ display: "flex", flexDirection: "column" }}>
                                {/* First Row */}
                                <Box sx={{ display: "flex", justifyContent: "stretch", alignItems: "stretch" }}>
                                    <Box sx={{ 
                                        flex: 1,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "4px",
                                        padding: "14px 0px",
                                        borderBottom: "1px solid #DADCE0", 
                                    }}>
                                        <Typography sx={{
                                            fontFamily: '"Google Sans Text", sans-serif',
                                            fontWeight: 500,
                                            fontSize: "11px",
                                            lineHeight: "1.45em",
                                            letterSpacing: "0.91%",
                                            color: "#575757"
                                        }}>
                                            Creation Time
                                        </Typography>
                                        <Typography sx={{
                                            fontFamily: '"Google Sans Text", sans-serif',
                                            fontWeight: 400,
                                            fontSize: "14px",
                                            lineHeight: "1.43em",
                                            color: "#1F1F1F"
                                        }}>
                                            {createDate}
                                            <br />
                                            {createTime}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ 
                                        flex: 1,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "4px",
                                        padding: "14px 0px",
                                        borderBottom: "1px solid #DADCE0", 
                                    }}>
                                        <Typography sx={{
                                            fontFamily: '"Google Sans Text", sans-serif',
                                            fontWeight: 500,
                                            fontSize: "11px",
                                            lineHeight: "1.45em",
                                            letterSpacing: "0.91%",
                                            color: "#575757"
                                        }}>
                                            Last Modified Time
                                        </Typography>
                                        <Typography sx={{
                                            fontFamily: '"Google Sans Text", sans-serif',
                                            fontWeight: 400,
                                            fontSize: "14px",
                                            lineHeight: "1.43em",
                                            color: "#1F1F1F"
                                        }}>
                                            {updateDate}
                                            <br />
                                            {updateTime}
                                        </Typography>
                                    </Box>
                                </Box>
                                
                                {/* Second Row */}
                                {entryType && entryType != 'data-product' &&  (
                                <Box sx={{ display: "flex", justifyContent: "stretch", alignItems: "stretch" }}>
                                    <Box sx={{ 
                                        flex: 1,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "4px",
                                        padding: "14px 0px"
                                    }}>
                                        <Typography sx={{
                                            fontFamily: '"Google Sans Text", sans-serif',
                                            fontWeight: 500,
                                            fontSize: "11px",
                                            lineHeight: "1.45em",
                                            letterSpacing: "0.91%",
                                            color: "#575757"
                                        }}>
                                            Last Run Time
                                        </Typography>
                                        <Typography sx={{
                                            fontFamily: '"Google Sans Text", sans-serif',
                                            fontWeight: 400,
                                            fontSize: "14px",
                                            lineHeight: "1.43em",
                                            color: "#1F1F1F"
                                        }}>
                                            -
                                        </Typography>
                                    </Box>
                                </Box>
                                )}
                            </Box>
                    </AccordionDetails>
                    </Accordion>
                </Box>

                {/* Usage Metrics Accordion */}
                {entryType && entryType != 'data-product' &&  (
                <Box sx={{ 
                    border: "1px solid #DADCE0", 
                    borderRadius: "8px", 
                    marginTop: "10px", 
                    overflow: "hidden",
                    backgroundColor: "#FFFFFF"
                }}>
                    <Accordion 
                        defaultExpanded={true} 
                        key="usage-metrics-accordion" 
                        sx={{ 
                            background: "none", 
                            boxShadow: "none", 
                            margin: "0px", 
                            borderRadius: "8px",
                            minHeight: "64px",
                            '&:before': { display: 'none' }
                        }}
                    >
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                            aria-controls="usage-metrics-content"
                            id="usage-metrics-header"
                        sx={{
                                background: "#F8FAFD",
                                minHeight: "64px",
                                '& .MuiAccordionSummary-content': {
                                    margin: 0
                                }
                        }}
                    >
                            <Box sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
                        }}>
                                <Typography 
                                    component="span"
                                    variant="heading2Medium"
                            sx={{
                                        fontWeight: 500, 
                                        fontSize: "18px", 
                                        lineHeight: "1.33em",
                                        color: "#1F1F1F", 
                                        textTransform: "capitalize",
                                    }}
                                >
                                Usage Metrics
                            </Typography>
                                <Tooltip title="Usage metrics show the historical usage of the asset" arrow>
                                    <InfoOutline
                                        sx={{
                                            fontWeight: 800,
                                            width: "18px",
                                            height: "18px",
                                            opacity: 0.9
                                        }}
                                    />
                                </Tooltip>
                            </Box>
                    </AccordionSummary>
                        <AccordionDetails sx={{ padding: "0px 20px" }}>
                            <Box sx={{ display: "flex", flexDirection: "column" }}>
                                {/* First Row */}
                                <Box sx={{ display: "flex", justifyContent: "stretch", alignItems: "stretch" }}>
                                    <Box sx={{ 
                                        flex: 1,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "4px",
                                        padding: "14px 0px",
                                        borderBottom: "1px solid #DADCE0", 
                                    }}>
                                        <Typography sx={{
                                            fontFamily: '"Google Sans Text", sans-serif',
                                            fontWeight: 500,
                                            fontSize: "11px",
                                            lineHeight: "1.45em",
                                            letterSpacing: "0.91%",
                                            color: "#575757"
                                        }}>
                                            Execution Time
                                        </Typography>
                                        <Typography sx={{
                                            fontFamily: '"Google Sans Text", sans-serif',
                                            fontWeight: 400,
                                            fontSize: "14px",
                                            lineHeight: "1.43em",
                                            color: "#1F1F1F"
                                        }}>
                                            {(() => {
                                                if (Object.keys(usage).length === 0) return '-';
                                                const executionTimeValue = usage.metrics?.listValue?.values?.find((value:any) => 
                                                    value.structValue.fields.name.stringValue === 'execution_time'
                                                );
                                                const latestValue = executionTimeValue?.structValue.fields.timeSeries.listValue.values[
                                                    executionTimeValue.structValue.fields.timeSeries.listValue.values.length - 1
                                                ]?.structValue.fields.value.numberValue;
                                                return latestValue || '-';
                                            })()}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ 
                                        flex: 1,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "4px",
                                        padding: "14px 0px",
                                        borderBottom: "1px solid #DADCE0", 
                                    }}>
                                        <Typography sx={{
                                            fontFamily: '"Google Sans Text", sans-serif',
                                            fontWeight: 500,
                                            fontSize: "11px",
                                            lineHeight: "1.45em",
                                            letterSpacing: "0.91%",
                                            color: "#575757"
                                        }}>
                                            Total Queries
                                        </Typography>
                                        <Typography sx={{
                                            fontFamily: '"Google Sans Text", sans-serif',
                                            fontWeight: 400,
                                            fontSize: "14px",
                                            lineHeight: "1.43em",
                                            color: "#1F1F1F"
                                        }}>
                                            {(() => {
                                                if (Object.keys(usage).length === 0) return '-';
                                                const totalQueriesValue = usage.metrics?.listValue?.values?.find((value:any) => 
                                                    value.structValue.fields.name.stringValue === 'total_queries'
                                                );
                                                const latestValue = totalQueriesValue?.structValue.fields.timeSeries.listValue.values[
                                                    totalQueriesValue.structValue.fields.timeSeries.listValue.values.length - 1
                                                ]?.structValue.fields.value.numberValue;
                                                return latestValue || '-';
                                            })()}
                                        </Typography>
                                    </Box>
                                </Box>
                                
                                {/* Second Row */}
                                <Box sx={{ display: "flex", justifyContent: "stretch", alignItems: "stretch" }}>
                                    <Box sx={{ 
                                        flex: 1,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "4px",
                                        padding: "14px 0px"
                                    }}>
                                        <Typography sx={{
                                            fontFamily: '"Google Sans Text", sans-serif',
                                            fontWeight: 500,
                                            fontSize: "11px",
                                            lineHeight: "1.45em",
                                            letterSpacing: "0.91%",
                                            color: "#575757"
                                        }}>
                                            Refresh Time
                                        </Typography>
                                        <Typography sx={{
                                            fontFamily: '"Google Sans Text", sans-serif',
                                            fontWeight: 400,
                                            fontSize: "14px",
                                            lineHeight: "1.43em",
                                            color: "#1F1F1F"
                                        }}>
                                            {(() => {
                                                if (Object.keys(usage).length === 0) return '-';
                                                if (!usage.refreshTime || !usage.refreshTime.stringValue) return '-';
                                                return new Intl.DateTimeFormat('en-US', { month: "short" , day: "numeric", year: "numeric" }).format(new Date(usage.refreshTime.stringValue));
                                            })()}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </AccordionDetails>
                    </Accordion>
                </Box>
                )}

                {/* Labels Accordion */}
                {entryType && entryType != 'data-product' &&  (
                <Box sx={{ 
                    border: "1px solid #DADCE0", 
                    borderRadius: "8px", 
                    marginTop: "10px", 
                    overflow: "hidden",
                    backgroundColor: "#FFFFFF"
                }}>
                    <Accordion 
                        defaultExpanded={hasData(entry.entrySource?.labels ? entry.entrySource.labels : {})} 
                        key="labels-accordion" 
                        sx={{ 
                            background: "none", 
                            boxShadow: "none", 
                            margin: "0px", 
                            borderRadius: "8px",
                            minHeight: "64px",
                            '&:before': { display: 'none' }
                        }}
                    >
                    <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            aria-controls="labels-content"
                            id="labels-header"
                        sx={{
                                background: "#F8FAFD",
                                minHeight: "64px",
                                '& .MuiAccordionSummary-content': {
                                    margin: 0
                                }
                        }}
                    >
                            <Box sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
                        }}>
                                <Typography 
                                    component="span"
                                    variant="heading2Medium"
                            sx={{
                                        fontWeight: 500, 
                                        fontSize: "18px", 
                                        lineHeight: "1.33em",
                                        color: "#1F1F1F", 
                                        textTransform: "capitalize",
                                    }}
                                >
                                Labels
                            </Typography>
                                <Tooltip title="Labels are key:value pairs that organize the cloud resources together." arrow>
                                    <InfoOutline
                                        sx={{
                                            fontWeight: 800,
                                            width: "18px",
                                            height: "18px",
                                            opacity: 0.9
                                        }}
                                    />
                                </Tooltip>
                            </Box>
                    </AccordionSummary>
                        <AccordionDetails sx={{ padding: "15px 10px 15px 10px" }}>
                            {Object.keys(entry.entrySource?.labels ? entry.entrySource.labels : {}).length > 0 ? (
                            <Box sx={{
                                display: "grid",
                                gridTemplateColumns: "repeat(2, 1fr)",
                                overflowX: 'auto',
                                gap: "4px",
                                width: "100%"
                            }}>
                                {Object.keys(entry.entrySource?.labels ? entry.entrySource.labels : {}).map((key, index) => (
                                    <Tooltip key={index} title={`${key}: ${entry.entrySource?.labels? entry.entrySource.labels[key] : ''}`} arrow>
                                        <Box sx={{
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            gap: "8px",
                                            padding: "8px",
                                            width: "160px",
                                            height: "auto",
                                            borderRadius: "8px",
                                            background: "#E7F0FE",
                                            cursor: "pointer",
                                            boxSizing: "border-box"
                                        }}>
                                            <Typography sx={{
                                                fontFamily: '"Google Sans", sans-serif',
                                                fontWeight: 400,
                                                fontSize: "12px",
                                                lineHeight: "1.25em",
                                                letterSpacing: "1%",
                                                color: "#004A77",
                                                textAlign: "left",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                                maxWidth: "100%"
                                            }}>
                                                {`${key}: ${entry.entrySource?.labels? entry.entrySource.labels[key] : ''}`}
                                            </Typography>
                                        </Box>
                                    </Tooltip>
                                ))}
                            </Box>
                            ) : (
                                <Typography sx={{
                                    fontFamily: '"Google Sans Text", sans-serif',
                                    fontWeight: 400,
                                    fontSize: "14px",
                                    lineHeight: "1.43em",
                                    color: "#575757",
                                    padding: '0px 10px' // Added padding to align with other content
                                }}>
                                    No Labels available
                                </Typography>
                            )}
                    </AccordionDetails>
                    </Accordion>
                </Box>
                )}
            </Grid>
        </Grid>
        

    </div>
  );
}

export default DataProductOverviewNew;