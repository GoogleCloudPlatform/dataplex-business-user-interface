import React, { useEffect, useState } from 'react';
import {
  Typography,
  Grid,
  Box
} from '@mui/material';
import TableFilter from '../Filter/TableFilter';
import type { GridColDef, GridRowsProp } from '@mui/x-data-grid';
import TableView from '../Table/TableView';
import { EmailOutlined } from '@mui/icons-material';
import { useSelector } from 'react-redux';

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
interface AccessGroupProps {
  entry: any;
  selectedDataProduct?: any;
  css: React.CSSProperties; // Optional CSS properties for the button
}

// FilterDropdown component
const AccessGroup: React.FC<AccessGroupProps> = ({ entry, css }) => {
  
//   const aspects = entry.aspects;
//   const number = entry.entryType.split('/')[1];
//   const keys = Object.keys(aspects);
  const [accessPermissionData, setAccessPermissionData] = useState<any[]>([]);
  const [filteredAssetsData, setFilteredAssetsData] = useState<any[]>([]);

  const {dataProductAssets, dataProductAssetsStatus }= useSelector((state: any) => state.dataProducts);

  const number = entry?.entryType?.split('/')[1];

  useEffect(() => {
    if(dataProductAssetsStatus === 'succeeded') {
        // schema = <Schema entry={entry} css={{width:"100%"}} />;
        // if(entry.entrySource?.system) {
        // if(entry.entrySource?.system.toLowerCase() === 'bigquery'){
            const assetData:any[] = dataProductAssets.map((asset:any) => {
                const mapPermission = Object.keys(asset.accessGroupConfigs || {}).map((accessGroupId:any) => {
                    const roles = asset.accessGroupConfigs[accessGroupId].iamRoles || [];
                    return `${accessGroupId} : ${roles.join(', ')}`;
                });


                return ({
                    Name: asset.resource.split('/').pop(),
                    Type: asset.resource.split('/').slice(-2, -1)[0],
                    System: 'Bigquery',
                    'Source-Project': asset.resource.split('projects/')[1].split('/')[0],
                    'Mapped-Permissions':mapPermission,
            })});

            setAccessPermissionData(assetData);
        // }
        // }
    }
}, [dataProductAssets]);

  let selectedDataProduct = localStorage.getItem('selectedDataProduct') ? 
  JSON.parse(localStorage.getItem('selectedDataProduct') || '{}') : null;

  let accessGroups = selectedDataProduct ? selectedDataProduct.accessGroups : (entry.aspects[`${number}.global.data-product`]?.data.accessGroups || []);
  //let usage = entry.aspects[`${number}.global.usage`]?.data.fields || {};

  // Always compute memoized helpers at top-level (avoid conditional hooks)
  const firstRow = React.useMemo(() => {
    if (Array.isArray(accessPermissionData) && accessPermissionData.length > 0 && typeof accessPermissionData[0] === 'object') {
      return accessPermissionData[0];
    }
    return undefined;
  }, [accessPermissionData]);

  const columnKeys = React.useMemo(() => (firstRow ? Object.keys(firstRow) : []), [firstRow]);

  const columns: GridColDef[] = React.useMemo(() => (
    columnKeys.map((key) => ({ 
      field: key, 
      headerName: key, 
      flex: 1, 
      headerClassName: key == 'Mapped-Permissions' ? 'table-bg table-multiline' : 'table-bg', 
      minWidth: 200,
      renderCell: (params) => {
        // You can pass the row data (or specific cell data) as props
        console.log("Params for Access Permission Table", params.row);
        return key == 'Mapped-Permissions' ? (
            <div
                style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    lineHeight: 1,
                    minWidth: '350px',
                }}
            >
            {  params.row['Mapped-Permissions'].map((mp:any) => (<>
                    <Box sx={{display:"flex", alignItems:"center", padding:"2px 0px"}}>
                        <p style={{fontWeight:"600", fontSize:"12px", margin:'5px 0px'}}>{mp.split(':')[0]} :</p>
                        <p style={{fontSize:"12px", padding:"0px 5px", margin:'5px 0px'}}>{mp.split(':')[1]}</p>
                    </Box>
                </>))}
            </div>)
            : params.row[key];
      }
    }))
  ), [columnKeys]);

  const columnNames = columnKeys;

  let accessPermissionView = <div style={{padding:"10px"}}>No data to display</div>;
  
  // Safe data processing with error handling
  if(accessPermissionData && Array.isArray(accessPermissionData) && accessPermissionData.length > 0) {
    try {
      // Validate first row exists and has properties
      if (!columnNames || typeof columnNames !== 'object') {
        throw new Error('Invalid sample data structure');
      }
      
      if (columnKeys.length === 0) {
        throw new Error('No columns found in sample data');
      }
      
      // Use filtered data if available, otherwise use original data
      const displayData = filteredAssetsData.length > 0 ? filteredAssetsData : accessPermissionData;
      
      // Safe row processing with error handling
      const displayRows: GridRowsProp = displayData.map((row: any, index: number) => {
        try {
          const rowData = { ...row };//let rowData:any = [];
        //   Object.keys(rowData).forEach((key) => {
        //     const cellValue = rowData[key];
        //     if (typeof cellValue === 'object' && cellValue !== null) {
        //         if ("value" in cellValue) {
        //             rowData[key] = cellValue.value;
        //         } 
        //         else if (Object.keys(cellValue).length === 1) {
        //             const singleKey = Object.keys(cellValue)[0];
        //             rowData[key] = cellValue[singleKey];
        //         } 
        //         else {
        //             rowData[key] = JSON.stringify(cellValue);
        //         }
        //     }
        // });
            // rowData['Name'] = row.resource.split('/').pop();
            // rowData['Type'] = row.resource.split('/').slice(-2, -1)[0];
            // rowData['System'] = 'Bigquery';
            // rowData['Source Project'] = row.resource.split('projects/')[1].split('/')[0];
            // let m = Object.keys(row.accessGroupConfigs || {}).map((accessGroupId:any) => {
            //     const roles = row.accessGroupConfigs[accessGroupId].iamRoles || [];
            //     return `${accessGroupId} : (${roles.join(', ')})`;
            // }).join(';');
            // rowData['Mapped-Permissions'] = m;
            // console.log("Row Data for Access Permission", m);
            console.log("Row Data for Access Permission", rowData);
          return ({ ...rowData, id: index + 1 });
        } catch (rowError) {
          console.warn(`Error processing row ${index}:`, rowError);
          // Return a safe fallback row
          return { 
            id: index + 1, 
            error: 'No rows to display',
            ...Object.keys(row).reduce((acc, key) => ({ ...acc, [key]: String(row[key] || '') }), {})
          };
        }
      });
        
      accessPermissionView = (
        <>
          {/* Sample Filter Bar - Only show when Sample Data tab is active */}
          <TableFilter
            data={accessPermissionData}
            columns={columnNames}
            onFilteredDataChange={setFilteredAssetsData}
          />
          <TableView 
            rows={displayRows} 
            columns={columns}
            columnHeaderHeight={37}
            rowHeight={55}
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
      accessPermissionView = (
        <div style={{padding:"10px", color: "#d32f2f"}}>
          Error loading access permisson for assets: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      );
    }
  } else {
    accessPermissionView = <div style={{paddingTop:"48px", paddingLeft: "410px", fontSize:'14px', color: "#575757"}}>No data to display</div>;
  }


  return (
    <div style={{ width: '100%', ...css }}>
        <Grid
            container
            spacing={0}
            style={{marginBottom:"5px"}}
        >
            {/* left side  */}
            <Grid size={12} sx={{ padding: "10px 5px 10px 0px" }}>
                <Box sx={{ 
                    // border: "1px solid #DADCE0", 
                    // borderRadius: "8px", 
                    marginTop: "10px", 
                    padding: "10px 16px 5px 16px",
                    overflow: "hidden",
                    backgroundColor: "#FFFFFF"
                }}>
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
                                        fontSize: "16px", 
                                        lineHeight: "1.33em",
                                        color: "#1F1F1F", 
                                        textTransform: "capitalize",
                                    }}
                                >
                                Access Groups
                            </Typography>
                            </Box>
                        
                            <Box
                                sx={{
                                    fontFamily: '"Google Sans Text", sans-serif',
                                    fontSize: "12px",
                                    color: "#575757",
                                    fontWeight: 400,
                                    lineHeight: "1.43em",
                                }}
                            >
                                <Typography sx={{fontWeight: 400, 
                                        fontSize: "13px", 
                                        lineHeight: "2rem",
                                        color: "#1F1F1F",}}>
                                Define access groups which will be used by Data product consumers to request access. Asset permissions will be assigned
                                to the access groups defined here.
                                </Typography>
                            </Box>
                            <Grid container spacing={4}>
                                { Object.keys(accessGroups).map((key:any) => (
                                                    // Grid item for each card, defining its responsive width
                                    <Grid
                                        size={4} // One-third width (3 columns) on medium screens (4 out of 12 columns)
                                        key={accessGroups[key].id}
                                        sx={{ marginTop: '5px', borderBottom: '1px solid #E0E0E0', paddingBottom: '2px' }}
                                    >
                                        <Box sx={{ 
                                                // border: '1px solid #E0E0E0', 
                                                // borderRadius: '16px',
                                                height: '100%',
                                                boxSizing: 'border-box',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between'
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', padding: '5px' }}>
                                                <Typography variant="h6" sx={{ fontFamily: 'Google Sans', fontSize: '14px', fontWeight: 500, color: '#1F1F1F', textWrap: 'break-word', lineHeight:1.3, textTransform: 'capitalize' }}>
                                                    {accessGroups[key].displayName} :
                                                </Typography>
                                                
                                                <Box sx={{display: 'flex', alignItems: 'center', padding: '5px', gap: 0.5, color: '#575757', fontSize: '14px', marginLeft:'20px' }}>
                                                    <EmailOutlined sx={{ color: '#575757', fontSize: '14px', fontWeight:500 }} />
                                                    {`${accessGroups[key]?.principal?.googleGroup || 'No group defined'}`}
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                </Box>
                <Box sx={{ 
                    // border: "1px solid #DADCE0", 
                    // borderRadius: "8px", 
                    padding: "5px 16px 5px 16px",
                    overflow: "hidden",
                    backgroundColor: "#FFFFFF"
                }}>
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
                                        fontSize: "16px", 
                                        lineHeight: "1.33em",
                                        color: "#1F1F1F", 
                                        textTransform: "capitalize",
                                    }}
                                >
                                Asset permissions
                            </Typography>
                        </Box>
                        <Box
                            sx={{
                                fontFamily: '"Google Sans", sans-serif',
                                fontSize: "12px",
                                color: "#575757",
                                fontWeight: 400,
                                lineHeight: "1.43em",
                            }}
                        >
                            <Typography sx={{fontWeight: 400, 
                                        fontSize: "13px", 
                                        lineHeight: "2rem",
                                        color: "#1F1F1F",}}>
                                View which permissions are mapped to each asset in this data product. Each asset shows the access groups and their corresponding IAM roles.
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        paddingTop: '0px',
                        paddingLeft: '16px',
                    }}>
                        {dataProductAssetsStatus === 'succeeded' && accessPermissionView}
                    </Box>
            </Grid>
        </Grid>
        

    </div>
  );
}

export default AccessGroup;