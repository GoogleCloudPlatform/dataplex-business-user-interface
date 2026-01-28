import React from 'react';
import {
  Typography,
  Grid,
  Box
} from '@mui/material';

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
interface ContractProps {
  entry: any;
  css: React.CSSProperties; // Optional CSS properties for the button
}

// FilterDropdown component
const Contract: React.FC<ContractProps> = ({ entry, css }) => {

  const number = entry?.entryType?.split('/')[1];

//   let schema = <Schema entry={filteredSchemaEntry || entry} sx={{width:"100%", borderTopRightRadius:"0px", borderTopLeftRadius:"0px"}} />;
//   const schemaData = entry.aspects[`${number}.global.schema`]?.data?.fields?.fields?.listValue?.values || [];
  let contracts = {
    "refresh-cadence" : entry.aspects[`${number}.global.refresh-cadence`]?.data || []
  };
  //let usage = entry.aspects[`${number}.global.usage`]?.data.fields || {};


  return (
    <div style={{ width: '100%', ...css }}>
        <Grid
            container
            spacing={0}
            style={{marginBottom:"5px"}}
        >
            {/* left side  */}
            <Grid size={12} sx={{ padding: "10px 5px 10px 0px" }}>
                {/* Documentation Accordion */}
                <Box sx={{ 
                    //border: "1px solid #DADCE0", 
                    //borderRadius: "8px", 
                    marginTop: "10px", 
                    padding: "16px",
                    overflow: "hidden",
                    backgroundColor: "#FFFFFF"
                }}>
                        <Box sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "12px"

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
                              Contracts
                          </Typography>
                        </Box>
                        <Box sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
                        }}>
                                <Typography 
                                    component="span"
                                    variant="heading2Medium"
                            sx={{
                                        fontWeight: 400, 
                                        fontSize: "14px", 
                                        lineHeight: "1.33em",
                                        color: "#1F1F1F",
                                    }}
                                >
                                Contract guarantees define the service level agreements and data quality commitments for this data product. These guarantees help consumers understand what to expect when using this data.
                            </Typography>
                            </Box>
                        <Grid container spacing={4}>
                    { Object.keys(contracts).map((key:string) => (
                    // Grid item for each card, defining its responsive width
                    <Grid
                        size={3} // One-third width (3 columns) on medium screens (4 out of 12 columns)
                        key={key}
                        sx={{ marginTop: '16px' }}
                    >
                        <Box sx={{ 
                                border: '1px solid #E0E0E0', 
                                borderRadius: '16px',
                                height: '100%',
                                boxSizing: 'border-box',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between'
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #E0E0E0', padding: '15px 20px' }}>
                                <Typography variant="h6" sx={{ fontFamily: 'Google Sans', fontSize: '16px', fontWeight: 500, color: '#1F1F1F', textWrap: 'break-word', lineHeight:1.3, textTransform: 'capitalize' }}>
                                    {key}
                                </Typography>
                            </Box>
                            <Box sx={{display: 'flex', alignItems: 'center', padding: '15px', gap: 1 }}>
                                
                                <table>
                                <tbody>
                                    {Object.entries(contracts['refresh-cadence']).map(([key1, value]) => (
                                    <tr key={key1} style={{padding:"15px", fontSize:"12px"}}>
                                        <td style={{fontWeight:"400", textTransform:'capitalize', color:'#575757',fontSize:"14px"}}>{key1}</td>
                                        <td style={{paddingLeft:"20px"}}>{`${value}`}</td>
                                    </tr>
                                    ))}
                                </tbody>
                                </table>
                            </Box>
                        </Box>
                    </Grid>
                    ))}
                </Grid>
                            
                </Box>
            </Grid>
        </Grid>
        

    </div>
  );
}

export default Contract;