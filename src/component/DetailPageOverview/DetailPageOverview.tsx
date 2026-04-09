import React, { useState, useCallback } from 'react';
import {
  Typography,
  Grid,
  Tooltip,
  Box,
  Divider
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useSelector } from 'react-redux';
import Schema from '../Schema/Schema';
import SchemaFilter from '../Schema/SchemaFilter';
import FilterBar from '../Common/FilterBar';
import type { ActiveFilter, PropertyConfig } from '../Common/FilterBar';
import type { GridRowsProp } from '@mui/x-data-grid';
import Avatar from '../Avatar/Avatar';
import { InfoOutline, SchemaOutlined as SchemaIcon, DescriptionOutlined as DescriptionIcon, ContactPageOutlined as ContactPageIcon, ScheduleOutlined as ScheduleIcon, PollOutlined as BarChartIcon, LabelOutlined as LabelIcon, Check as CheckIcon, ContentCopy } from '@mui/icons-material';
import { useNotification } from '../../contexts/NotificationContext';
import { normalizeSystemName } from '../../utils/resourceUtils';
import { useColumnResize } from '../../hooks/useColumnResize';
import ResizeHandle from '../Schema/ResizeHandle';

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
 * `getEntryType`). It also includes a recursive `FieldRenderer` to
 * display various data types (string, number, list, struct) appropriately.
 * It leverages the `useNotification` hook to provide feedback when identifiers
 * are copied to the clipboard.
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
interface DetailPageOverviewProps {
  entry: any;
  sampleTableData?: any; // Optional prop for sample data
  css: React.CSSProperties; // Optional CSS properties for the button
  accessDenied?: boolean; // True when user doesn't have permission to view this resource
  noTopSpacing?: boolean; // When true, removes top padding/margins (used by ViewDetails which has its own top spacing)
}

const OverflowTooltip: React.FC<{ text: string; children: React.ReactElement<{ onMouseEnter?: React.MouseEventHandler<HTMLElement>; onMouseLeave?: React.MouseEventHandler<HTMLElement> }> }> = ({ text, children }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    setShowTooltip(el.scrollWidth > el.clientWidth);
  };
  const handleMouseLeave = () => {
    setShowTooltip(false);
  };
  return (
    <Tooltip title={showTooltip ? text : ''} slotProps={{ popper: { modifiers: [{ name: 'offset', options: { offset: [0, -8] } }] } }}>
      {React.cloneElement(children, { onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave })}
    </Tooltip>
  );
};

// FilterDropdown component
const DetailPageOverview: React.FC<DetailPageOverviewProps> = ({ entry, sampleTableData, css, accessDenied, noTopSpacing = false }) => {

//   const aspects = entry.aspects;
//   const number = entry.entryType.split('/')[1];
//   const keys = Object.keys(aspects);
  const [sampleDataEnabled, setSampleDataEnabled] = React.useState(false);
  const [filteredSchemaEntry, setFilteredSchemaEntry] = useState<any>(null);
  const [sampleFilterText, setSampleFilterText] = useState('');
  const [sampleActiveFilters, setSampleActiveFilters] = useState<ActiveFilter[]>([]);
  const { showNotification } = useNotification();

  const resolveValue = useCallback((val: any): string => {
    if (val == null) return '';
    if (typeof val === 'object' && val.value !== undefined) return String(val.value);
    if (typeof val === 'object') return '';
    return String(val);
  }, []);

  const getSamplePropertyValues = useCallback((property: string): string[] => {
    if (!Array.isArray(sampleTableData) || sampleTableData.length === 0) return [];
    const values = new Set<string>();
    sampleTableData.forEach((row: any) => {
      if (row && typeof row === 'object' && row[property] != null) {
        const resolved = resolveValue(row[property]);
        if (resolved) values.add(resolved);
      }
    });
    return Array.from(values).sort();
  }, [sampleTableData, resolveValue]);

  // Helper function to check if accordion has data

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

const { date: createDate, time: createTime } = getFormattedDateTimeParts(entry?.createTime?.seconds);
const { date: updateDate, time: updateTime } = getFormattedDateTimeParts(entry?.updateTime?.seconds);

// Format without seconds for glossary/annotation timestamps accordion
const formatTimeNoSeconds = (timestamp: number | undefined | null) => {
  if (!timestamp) return { date: '-', time: '' };
  const d = new Date(timestamp * 1000);
  const date = new Intl.DateTimeFormat('en-US', { month: "short", day: "numeric", year: "numeric" }).format(d);
  const time = new Intl.DateTimeFormat('en-US', { hour: "numeric", minute: "2-digit", hour12: true }).format(d);
  return { date, time };
};
const { date: createDateShort, time: createTimeShort } = formatTimeNoSeconds(entry?.createTime?.seconds);
const { date: updateDateShort, time: updateTimeShort } = formatTimeNoSeconds(entry?.updateTime?.seconds);


  const getEntryType = (namePath: string = '' , separator: string = '' ) => {
    const segments: string[] = namePath.split(separator);
    let eType = segments[segments.length - 2];
    return (`${eType[0].toUpperCase()}${eType.slice(1)}`);
  };

  const number = entry?.entryType?.split('/')[1] || '';
  const entryTypeStr = entry?.entryType?.toLowerCase() ?? '';
  const isGlossaryOrAnnotation =
    entryTypeStr.startsWith('glossary/') || entryTypeStr.startsWith('annotation/');

  let schema = <Schema entry={filteredSchemaEntry || entry} sx={{width:"100%", borderTopRightRadius:"0px", borderTopLeftRadius:"0px"}} />;
  const schemaData = entry?.aspects?.[`${number}.global.schema`]?.data?.fields?.fields?.listValue?.values || [];
  let contacts = entry?.aspects?.[`${number}.global.contacts`]?.data?.fields?.identities?.listValue?.values || [];
  let usage = entry?.aspects?.[`${number}.global.usage`]?.data?.fields || {};
  let documentation = entry?.aspects?.[`${number}.global.overview`]?.data?.fields?.content?.stringValue || 'No Documentation Available';

  // Always compute memoized helpers at top-level (avoid conditional hooks)
  const firstRow = React.useMemo(() => {
    if (Array.isArray(sampleTableData) && sampleTableData.length > 0 && typeof sampleTableData[0] === 'object') {
      return sampleTableData[0];
    }
    return undefined;
  }, [sampleTableData]);

  const columnKeys = React.useMemo(() => (firstRow ? Object.keys(firstRow) : []), [firstRow]);

  const columnProperties: PropertyConfig[] = columnKeys.map(key => ({ name: key, mode: 'both' as const }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mode = useSelector((state: any) => state.user.mode) as string;
  const isDark = mode === 'dark';

  const sampleColumnConfigs = React.useMemo(
    () => columnKeys.map((key) => ({ key, initialWidth: 160, minWidth: 100 })),
    [columnKeys]
  );

  const { columnWidths: sampleColumnWidths, activeIndex: sampleActiveIndex, handleMouseDown: sampleHandleMouseDown } = useColumnResize({
    columns: sampleColumnConfigs,
    mode: 'flex',
  });

  const sampleTableMinWidth = React.useMemo(
    () => sampleColumnWidths.reduce((sum, w) => sum + w, 0) + 40,
    [sampleColumnWidths]
  );

  // If access denied, show permission denied UI (after all hooks are called)
  if (accessDenied) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 40px",
          gap: "16px",
          minHeight: "300px",
          backgroundColor: "#FAFAFA",
          borderRadius: "8px",
          margin: "16px",
        }}
      >
        <LockOutlinedIcon sx={{ fontSize: 56, color: "#5F6368" }} />
        <Typography
          variant="h6"
          sx={{
            color: "#3C4043",
            fontFamily: "'Google Sans', sans-serif",
            fontWeight: 500,
          }}
        >
          Access Denied
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "#5F6368",
            fontFamily: "'Google Sans', sans-serif",
            textAlign: "center",
            maxWidth: "400px",
          }}
        >
          You don&apos;t have permission to view this resource. Contact your administrator if you need access.
        </Typography>
      </Box>
    );
  }

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
      
      const hasActiveFilters = sampleActiveFilters.length > 0;
      const filteredSampleData = (() => {
        if (!hasActiveFilters) return sampleTableData;
        return sampleTableData.filter((row: any) => {
          if (!row || typeof row !== 'object') return false;
          return sampleActiveFilters.every(filter =>
            filter.values.some(val => {
              const lower = val.toLowerCase();
              if (!filter.property) {
                // Global search: match across all columns
                return columnKeys.some(col =>
                  resolveValue(row[col]).toLowerCase().includes(lower)
                );
              }
              return resolveValue(row[filter.property]).toLowerCase().includes(lower);
            })
          );
        });
      })();
      const displayData = hasActiveFilters ? filteredSampleData : sampleTableData;
      
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
          <Box sx={{ marginTop: '20px', marginBottom: '8px' }}>
            <FilterBar
              filterText={sampleFilterText}
              onFilterTextChange={setSampleFilterText}
              propertyNames={columnProperties}
              getPropertyValues={getSamplePropertyValues}
              activeFilters={sampleActiveFilters}
              onActiveFiltersChange={setSampleActiveFilters}
              defaultProperty=""
              placeholder="Enter property name or value"
              marginLeft="20px"
            />
          </Box>
          {displayRows.length === 0 && hasActiveFilters ? (
            <div style={{ padding: '48px', textAlign: 'center', fontSize: '14px', fontFamily: 'Google Sans, sans-serif', color: isDark ? '#9aa0a6' : '#575757' }}>
              No data matches the applied filters
            </div>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', overflowX: 'auto' }}>
              {/* Header Row */}
              <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', padding: '0px 20px', width: columnKeys.length > 5 ? `max(100%, ${sampleTableMinWidth}px)` : '100%' }}>
                {columnKeys.map((key, i) => (
                  <div key={key} style={{
                    fontFamily: '"Google Sans", sans-serif',
                    fontWeight: 500,
                    fontSize: '11px',
                    lineHeight: '16px',
                    letterSpacing: '0.1px',
                    color: isDark ? '#dedfe0' : '#575757',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 0px',
                    flex: `1 1 ${sampleColumnWidths[i]}px`,
                    minWidth: '100px',
                    paddingLeft: i > 0 ? '20px' : '0px',
                    position: 'relative',
                  }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>{key}</span>
                    {i < columnKeys.length - 1 && (
                      <ResizeHandle
                        onMouseDown={(e) => sampleHandleMouseDown(i, e)}
                        isActive={sampleActiveIndex === i}
                        darkMode={isDark}
                      />
                    )}
                  </div>
                ))}
              </Box>
              {/* Body Rows */}
              <Box sx={{ display: 'flex', flexDirection: 'column', padding: '0px 20px', width: columnKeys.length > 5 ? `max(100%, ${sampleTableMinWidth}px)` : '100%' }}>
                {/* Header separator - inside body container so it matches row separator width */}
                <Box sx={{ borderBottom: `1px solid ${isDark ? '#3c4043' : '#DADCE0'}`, marginLeft: '-8px' }} />
                {displayRows.map((row, index) => (
                  <Box
                    key={row.id}
                    sx={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      height: '41px',
                      position: 'relative',
                      zIndex: 0,
                      '&:hover::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: '-8px',
                        right: '0px',
                        backgroundColor: isDark ? '#3c4043' : '#F8F9FA',
                        zIndex: -1,
                      },
                      ...(index < displayRows.length - 1 && {
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          bottom: 0,
                          left: '-8px',
                          right: '0px',
                          height: '1px',
                          backgroundColor: isDark ? '#3c4043' : '#DADCE0',
                        },
                      }),
                    }}
                  >
                    {columnKeys.map((key, i) => (
                      <div key={key} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        flex: `1 1 ${sampleColumnWidths[i]}px`,
                        minWidth: '100px',
                        padding: i > 0 ? '10px 20px' : '10px 20px 10px 0px',
                      }}>
                        <Typography sx={{
                          fontFamily: '"Product Sans", sans-serif',
                          fontWeight: 400,
                          fontSize: '12px',
                          lineHeight: '16px',
                          letterSpacing: '0.1px',
                          color: '#575757',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          width: '100%',
                        }}>
                          {String(row[key] ?? '-')}
                        </Typography>
                      </div>
                    ))}
                  </Box>
                ))}
              </Box>
            </Box>
          )}
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
            <Grid size={9} sx={{ padding: noTopSpacing ? "0px 0px 10px 0px" : "10px 0px 10px 0px", minWidth: 0, overflow: 'hidden' }}>
                {/* Table Info */}
                {getEntryType(entry.name, '/') == 'Tables' ? (
                    <Box sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        padding: "0px",
                        flex: "none",
                        alignSelf: "stretch",
                        flexGrow: 0,
                        border: "1px solid #DADCE0",
                        borderRadius: "12px",
                        marginTop: noTopSpacing ? "0px" : "10px",
                        overflow: "hidden",
                        backgroundColor: "#FFFFFF",
                        width: "100%",
                        minWidth: 0,
                    }}>
                        {/* Header row with toggle */}
                        <Box sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "16px 20px",
                            width: "100%",
                            boxSizing: "border-box",
                            justifyContent: "space-between",
                        }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <Box sx={{ width: "32px", height: "32px", background: "#E7F0FE", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <SchemaIcon sx={{ fontSize: "20px", color: "#0B57D0" }} />
                                </Box>
                                <Typography
                                    component="span"
                                    variant="heading2Medium"
                                    sx={{
                                        fontWeight: 400,
                                        fontSize: "18px",
                                        lineHeight: "24px",
                                        color: "#1F1F1F",
                                    }}
                                >
                                    Table Info
                                </Typography>
                            </Box>
                            {/* Segmented Button Toggle */}
                            <Box sx={{ display: "flex" }}>
                                <Box
                                    sx={{
                                        fontSize: "14px",
                                        background: !sampleDataEnabled ? "#C2E7FF" : "transparent",
                                        color: !sampleDataEnabled ? "#004A77" : "#1F1F1F",
                                        padding: "6px 12px",
                                        borderRadius: "100px 0px 0px 100px",
                                        border: "1px solid #575757",
                                        borderRight: "none",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "8px",
                                        fontFamily: '"Google Sans", sans-serif',
                                        fontWeight: 500,
                                        lineHeight: "20px",
                                        height: "32px",
                                        boxSizing: "border-box"
                                    }}
                                    onClick={() => setSampleDataEnabled(false)}
                                >
                                    {!sampleDataEnabled && <CheckIcon sx={{ fontSize: "18px", color: "#004A77" }} />}
                                    Schema
                                </Box>
                                <Box
                                    sx={{
                                        fontSize: "14px",
                                        background: sampleDataEnabled ? "#C2E7FF" : "transparent",
                                        color: sampleDataEnabled ? "#004A77" : "#1F1F1F",
                                        padding: "6px 12px",
                                        borderRadius: "0px 100px 100px 0px",
                                        border: "1px solid #575757",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "8px",
                                        fontFamily: '"Google Sans", sans-serif',
                                        fontWeight: 500,
                                        lineHeight: "20px",
                                        height: "32px",
                                        boxSizing: "border-box"
                                    }}
                                    onClick={() => setSampleDataEnabled(true)}
                                >
                                    {sampleDataEnabled && <CheckIcon sx={{ fontSize: "18px", color: "#004A77" }} />}
                                    Sample Data
                                </Box>
                            </Box>
                        </Box>
                        <Divider sx={{ width: "100%", borderColor: "#DADCE0" }} />
                        {/* Content */}
                        <Box sx={{
                            minHeight: "200px",
                            maxHeight: "258px",
                            overflowY: "scroll",
                            overflowX: "auto",
                            padding: "0px 0px 0px 0px",
                            width: "100%",
                            minWidth: 0,
                            boxSizing: "border-box",
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
                            <Box sx={{ padding: "0px 0px 0px 0px"}}>
                                <Box sx={{ padding: "0px 0px 0px 0px" }}>
                                    {/* Schema Filter Bar - Only show when Schema tab is active */}
                                    {!sampleDataEnabled && schemaData.length > 0 &&(
                                        <SchemaFilter
                                          entry={entry}
                                          onFilteredEntryChange={setFilteredSchemaEntry}
                                          sx={{ marginTop: '20px', marginBottom: '8px' }}
                                        />
                                    )}
                                </Box>
                                <Box sx={{ padding: "0px 0px 0px 0px" }}>
                                        {sampleDataEnabled ? (sampleDataView) : (schema)}
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                ) : null}
                {/* Documentation */}
                <Box sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    padding: "0px",
                    flex: "none",
                    alignSelf: "stretch",
                    flexGrow: 0,
                    border: "1px solid #DADCE0",
                    borderRadius: "12px",
                    marginTop: getEntryType(entry.name, '/') === 'Tables' ? "10px" : (noTopSpacing ? "0px" : "10px"),
                    overflow: "hidden",
                    backgroundColor: "#FFFFFF",
                }}>
                    {/* Header row */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px 20px" }}>
                        <Box sx={{ width: "32px", height: "32px", background: "#E7F0FE", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <DescriptionIcon sx={{ fontSize: "20px", color: "#0B57D0" }} />
                        </Box>
                        <Typography
                            component="span"
                            variant="heading2Medium"
                            sx={{
                                fontWeight: 400,
                                fontSize: "18px",
                                lineHeight: "24px",
                                color: "#1F1F1F",
                            }}
                        >
                            Documentation
                        </Typography>
                    </Box>
                    <Divider sx={{ width: "100%", borderColor: "#DADCE0" }} />
                    {/* Content */}
                    <Box sx={{
                        minHeight: "200px",
                        maxHeight: "calc(100vh - 380px)",
                        overflowY: "scroll",
                        padding: "0px 20px 16px",
                        width: "100%",
                        boxSizing: "border-box",
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
                        {documentation === 'No Documentation Available' ? (
                            <Box sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                                minHeight: '200px',
                                gap: '8px',
                                padding: '40px 20px',
                                boxSizing: 'border-box',
                            }}>
                                <Typography sx={{
                                    fontFamily: '"Google Sans", sans-serif',
                                    fontWeight: 700,
                                    fontSize: '16px',
                                    color: '#1F1F1F',
                                    textAlign: 'center',
                                }}>
                                    No documentation yet
                                </Typography>
                                <Typography sx={{
                                    fontFamily: '"Google Sans Text", sans-serif',
                                    fontWeight: 400,
                                    fontSize: '14px',
                                    lineHeight: '1.43em',
                                    color: '#575757',
                                    textAlign: 'center',
                                    maxWidth: '460px',
                                }}>
                                    The owner of this asset hasn&apos;t added documentation. It should describe what this asset covers, which assets belong here, and any guidance for analysts.
                                </Typography>
                            </Box>
                        ) : (
                            <Box
                                sx={{
                                    fontFamily: '"Google Sans Text", sans-serif',
                                    fontSize: '14px',
                                    color: '#575757',
                                    fontWeight: 400,
                                    lineHeight: '1.43em',
                                    '& img': {
                                        maxWidth: '100%',
                                        height: 'auto',
                                    },
                                    '& > :first-child': {
                                        marginTop: 0,
                                    },
                                    paddingTop: '16px',
                                }}
                                dangerouslySetInnerHTML={{ __html: documentation }}
                            />
                        )}
                    </Box>
                </Box>
            </Grid>

            {/* Right Sidebar */}
            <Grid size={3} sx={{ padding: noTopSpacing ? "0px 0px 10px 10px" : "10px 0px 10px 10px" }}>
                {/* Contacts */}
                <Box sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    padding: "0px",
                    flex: "none",
                    alignSelf: "stretch",
                    flexGrow: 0,
                    border: "1px solid #DADCE0",
                    borderRadius: "12px",
                    marginTop: noTopSpacing ? "0px" : "10px",
                    overflow: "hidden",
                    backgroundColor: "#FFFFFF",
                }}>
                    {/* Header row */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px 20px" }}>
                        <Box sx={{ width: "32px", height: "32px", background: "#E7F0FE", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <ContactPageIcon sx={{ fontSize: "20px", color: "#0B57D0" }} />
                        </Box>
                        <Typography
                            component="span"
                            variant="heading2Medium"
                            sx={{
                                fontWeight: 400,
                                fontSize: "18px",
                                lineHeight: "24px",
                                color: "#1F1F1F",
                            }}
                        >
                            Contacts
                        </Typography>
                    </Box>
                    <Divider sx={{ width: "100%", borderColor: "#DADCE0" }} />
                    {/* Content */}
                    <Box sx={{
                        padding: "0px 20px",
                        overflowY: 'scroll',
                        width: "100%",
                        boxSizing: "border-box",
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
                                        <Avatar text={contact.structValue.fields.name.stringValue} />
                                        <Box sx={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: 0 }}>
                                            <OverflowTooltip text={contact.structValue.fields.role.stringValue}>
                                                <Typography sx={{
                                                    fontFamily: '"Google Sans Regular", sans-serif',
                                                    fontWeight: 500,
                                                    fontSize: "14px",
                                                    lineHeight: "1.45em",
                                                    letterSpacing: "0.91%",
                                                    color: "#575757",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                }}>
                                                    {contact.structValue.fields.role.stringValue}
                                                </Typography>
                                            </OverflowTooltip>
                                            <OverflowTooltip text={contact.structValue.fields.name.stringValue.split('<').length > 1 ? contact.structValue.fields.name.stringValue.split('<')[1].slice(0, -1)
                                                : contact.structValue.fields.name.stringValue.length > 0 ? contact.structValue.fields.name.stringValue : "--"}>
                                                <Typography sx={{
                                                    fontFamily: '"Google Sans Text", sans-serif',
                                                    fontWeight: 400,
                                                    fontSize: "14px",
                                                    lineHeight: "1.43em",
                                                    color: "#1F1F1F",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                }}>
                                                    {contact.structValue.fields.name.stringValue.split('<').length > 1 ? contact.structValue.fields.name.stringValue.split('<')[1].slice(0, -1)
                                                    : contact.structValue.fields.name.stringValue.length > 0 ? contact.structValue.fields.name.stringValue : "--"}
                                                </Typography>
                                            </OverflowTooltip>
                                        </Box>
                                    </Box>
                                ))
                            ) : (
                                <Box sx={{ padding: "24px 0px", textAlign: "center", width: "100%" }}>
                                    <Typography sx={{
                                        fontFamily: '"Google Sans Text", sans-serif',
                                        fontWeight: 400,
                                        fontSize: "14px",
                                        lineHeight: "1.43em",
                                        color: "#575757"
                                    }}>
                                        No contacts assigned to this asset.
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>
                </Box>

                {/* Usage Metrics: hidden for glossary and annotation entry types */}
                {!isGlossaryOrAnnotation && (<Box sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    padding: "0px",
                    flex: "none",
                    alignSelf: "stretch",
                    flexGrow: 0,
                    border: "1px solid #DADCE0",
                    borderRadius: "12px",
                    marginTop: "10px",
                    overflow: "hidden",
                    backgroundColor: "#FFFFFF",
                }}>
                    {/* Header row */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px 20px" }}>
                        <Box sx={{ width: "32px", height: "32px", background: "#E7F0FE", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <BarChartIcon sx={{ fontSize: "20px", color: "#0B57D0" }} />
                        </Box>
                        <Typography
                            component="span"
                            variant="heading2Medium"
                            sx={{
                                fontWeight: 400,
                                fontSize: "18px",
                                lineHeight: "24px",
                                color: "#1F1F1F",
                            }}
                        >
                            Usage Metrics
                        </Typography>
                        <Tooltip title="Usage metrics shows the historical usage of the asset" arrow>
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
                    <Divider sx={{ width: "100%", borderColor: "#DADCE0" }} />
                    {/* Content */}
                    <Box sx={{ padding: "16px 20px", width: "100%", boxSizing: "border-box" }}>
                        {Object.keys(usage).length === 0 ? (
                            <Box sx={{ padding: "24px 0px", textAlign: "center", width: "100%" }}>
                                <Typography sx={{
                                    fontFamily: '"Google Sans Text", sans-serif',
                                    fontWeight: 400,
                                    fontSize: '14px',
                                    lineHeight: '1.43em',
                                    color: '#575757',
                                }}>
                                    No usage metrics available for this asset.
                                </Typography>
                            </Box>
                        ) : (
                            <Box sx={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
                                {/* Avg Exec Time */}
                                <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "2px" }}>
                                    <Typography sx={{ fontFamily: '"Google Sans Regular", sans-serif', fontWeight: 500, fontSize: "14px", lineHeight: "1.45em", letterSpacing: "0.91%", color: "#575757" }}>
                                        Avg Exec Time
                                    </Typography>
                                    {(() => {
                                        const executionTimeValue = usage.metrics?.listValue?.values?.find((value:any) =>
                                            value.structValue.fields.name.stringValue === 'execution_time'
                                        );
                                        const latestMs = executionTimeValue?.structValue.fields.timeSeries.listValue.values[
                                            executionTimeValue.structValue.fields.timeSeries.listValue.values.length - 1
                                        ]?.structValue.fields.value.numberValue;
                                        if (!latestMs) return <>
                                            <Typography sx={{ fontFamily: '"Google Sans", sans-serif', fontWeight: 500, fontSize: "2rem", lineHeight: "1.2", color: "#1F1F1F" }}>-</Typography>
                                            <Typography sx={{ fontFamily: '"Google Sans Text", sans-serif', fontWeight: 400, fontSize: "12px", color: "#575757" }}>seconds</Typography>
                                        </>;
                                        const roundedSeconds = Math.round(latestMs / 1000);
                                        return (
                                            <Tooltip title={`${latestMs} ms`} arrow>
                                                <Box>
                                                    <Typography sx={{ fontFamily: '"Google Sans", sans-serif', fontWeight: 500, fontSize: "2rem", lineHeight: "1.2", color: "#1F1F1F", cursor: "default" }}>
                                                        {roundedSeconds}
                                                    </Typography>
                                                    <Typography sx={{ fontFamily: '"Google Sans Text", sans-serif', fontWeight: 400, fontSize: "12px", color: "#575757" }}>
                                                        seconds
                                                    </Typography>
                                                </Box>
                                            </Tooltip>
                                        );
                                    })()}
                                </Box>
                                {/* Total Queries */}
                                <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "2px" }}>
                                    <Typography sx={{ fontFamily: '"Google Sans Regular", sans-serif', fontWeight: 500, fontSize: "14px", lineHeight: "1.45em", letterSpacing: "0.91%", color: "#575757" }}>
                                        Total Queries
                                    </Typography>
                                    <Typography sx={{ fontFamily: '"Google Sans", sans-serif', fontWeight: 500, fontSize: "2rem", lineHeight: "1.2", color: "#1F1F1F" }}>
                                        {(() => {
                                            const totalQueriesValue = usage.metrics?.listValue?.values?.find((value:any) =>
                                                value.structValue.fields.name.stringValue === 'total_queries'
                                            );
                                            const latestValue = totalQueriesValue?.structValue.fields.timeSeries.listValue.values[
                                                totalQueriesValue.structValue.fields.timeSeries.listValue.values.length - 1
                                            ]?.structValue.fields.value.numberValue;
                                            return latestValue || '-';
                                        })()}
                                    </Typography>
                                    <Typography sx={{ fontFamily: '"Google Sans Text", sans-serif', fontWeight: 400, fontSize: "12px", color: "#575757" }}>
                                        all time
                                    </Typography>
                                </Box>
                            </Box>
                        )}
                    </Box>
                </Box>)}

                {/* Timestamps */}
                <Box sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    padding: "0px",
                    flex: "none",
                    alignSelf: "stretch",
                    flexGrow: 0,
                    border: "1px solid #DADCE0",
                    borderRadius: "12px",
                    marginTop: "10px",
                    overflow: "hidden",
                    backgroundColor: "#FFFFFF",
                }}>
                    {/* Header row */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px 20px" }}>
                        <Box sx={{ width: "32px", height: "32px", background: "#E7F0FE", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <ScheduleIcon sx={{ fontSize: "20px", color: "#0B57D0" }} />
                        </Box>
                        <Typography
                            component="span"
                            variant="heading2Medium"
                            sx={{
                                fontWeight: 400,
                                fontSize: "18px",
                                lineHeight: "24px",
                                color: "#1F1F1F",
                            }}
                        >
                            Timestamps
                        </Typography>
                    </Box>
                    <Divider sx={{ width: "100%", borderColor: "#DADCE0" }} />
                    {/* Content */}
                    <Box sx={{ padding: "0px 20px", width: "100%", boxSizing: "border-box" }}>
                        <Box sx={{ display: "flex", flexDirection: "column" }}>
                            {/* Created */}
                            <Box sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "14px 0px",
                                borderBottom: "1px solid #DADCE0",
                            }}>
                                <Typography sx={{ fontFamily: '"Google Sans Regular", sans-serif', fontWeight: 500, fontSize: "14px", lineHeight: "1.45em", letterSpacing: "0.91%", color: "#575757" }}>
                                    Created
                                </Typography>
                                <Typography sx={{ fontFamily: '"Google Sans Text", sans-serif', fontWeight: 400, fontSize: "14px", lineHeight: "1.43em", color: "#1F1F1F", textAlign: "right" }}>
                                    {isGlossaryOrAnnotation
                                      ? <>{createDateShort}{createTimeShort ? ` \u00b7 ${createTimeShort}` : ''}</>
                                      : <>{createDate}{createTime ? ` \u00b7 ${createTime}` : ''}</>}
                                </Typography>
                            </Box>
                            {/* Last modified */}
                            <Box sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "14px 0px",
                            }}>
                                <Typography sx={{ fontFamily: '"Google Sans Regular", sans-serif', fontWeight: 500, fontSize: "14px", lineHeight: "1.45em", letterSpacing: "0.91%", color: "#575757" }}>
                                    Last modified
                                </Typography>
                                <Typography sx={{ fontFamily: '"Google Sans Text", sans-serif', fontWeight: 400, fontSize: "14px", lineHeight: "1.43em", color: "#1F1F1F", textAlign: "right" }}>
                                    {isGlossaryOrAnnotation
                                      ? <>{updateDateShort}{updateTimeShort ? ` \u00b7 ${updateTimeShort}` : ''}</>
                                      : <>{updateDate}{updateTime ? ` \u00b7 ${updateTime}` : ''}</>}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Box>

                {/* Additional Info */}
                <Box sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    padding: "0px",
                    flex: "none",
                    alignSelf: "stretch",
                    flexGrow: 0,
                    border: "1px solid #DADCE0",
                    borderRadius: "12px",
                    marginTop: "10px",
                    overflow: "hidden",
                    backgroundColor: "#FFFFFF",
                }}>
                    {/* Header row */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px 20px" }}>
                        <Box sx={{ width: "32px", height: "32px", background: "#E7F0FE", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <InfoOutline sx={{ fontSize: "20px", color: "#0E4DCA" }} />
                        </Box>
                        <Typography
                            component="span"
                            variant="heading2Medium"
                            sx={{
                                fontWeight: 400,
                                fontSize: "18px",
                                lineHeight: "24px",
                                color: "#1F1F1F",
                            }}
                        >
                            Additional Info
                        </Typography>
                    </Box>
                    <Divider sx={{ width: "100%", borderColor: "#DADCE0" }} />
                    {/* Content */}
                    <Box sx={{ padding: "0px 20px", width: "100%", boxSizing: "border-box" }}>
                        <Box sx={{ display: "flex", flexDirection: "column" }}>
                            {/* System */}
                            <Box sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "14px 0px",
                                borderBottom: "1px solid #DADCE0",
                                gap: "8px",
                            }}>
                                <Typography sx={{ fontFamily: '"Google Sans Regular", sans-serif', fontWeight: 500, fontSize: "14px", lineHeight: "1.45em", letterSpacing: "0.91%", color: "#575757", flexShrink: 0 }}>
                                    System
                                </Typography>
                                <Typography sx={{ fontFamily: '"Google Sans Text", sans-serif', fontWeight: 500, fontSize: "13px", lineHeight: "1.43em", color: "#1F1F1F", textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
                                    {normalizeSystemName(entry.entrySource?.system)}
                                </Typography>
                            </Box>
                            {/* Location */}
                            <Box sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "14px 0px",
                                borderBottom: "1px solid #DADCE0",
                                gap: "8px",
                            }}>
                                <Typography sx={{ fontFamily: '"Google Sans Regular", sans-serif', fontWeight: 500, fontSize: "14px", lineHeight: "1.45em", letterSpacing: "0.91%", color: "#575757", flexShrink: 0 }}>
                                    Location
                                </Typography>
                                <Typography sx={{ fontFamily: '"Google Sans Text", sans-serif', fontWeight: 500, fontSize: "13px", lineHeight: "1.43em", color: "#1F1F1F", textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
                                    {entry.entrySource?.location || '-'}
                                </Typography>
                            </Box>
                            {/* Identifiers */}
                            <Box sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                padding: "14px 0px",
                                gap: "8px",
                            }}>
                                <Typography sx={{ fontFamily: '"Google Sans Regular", sans-serif', fontWeight: 500, fontSize: "14px", lineHeight: "1.45em", letterSpacing: "0.91%", color: "#575757", flexShrink: 0 }}>
                                    Identifiers
                                </Typography>
                                <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "16px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                                    <Tooltip title={entry.entrySource?.resource || ''} arrow>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}
                                            onClick={() => { navigator.clipboard.writeText(entry.entrySource?.resource || ''); showNotification('Copied to clipboard.', 'success', 3000, undefined); }}>
                                            <Typography sx={{ fontFamily: '"Google Sans Text", sans-serif', fontWeight: 500, fontSize: "13px", color: "#1F1F1F" }}>Resource</Typography>
                                            <ContentCopy sx={{ fontSize: "16px", color: "#0B57D0" }} />
                                        </Box>
                                    </Tooltip>
                                    <Tooltip title={entry.fullyQualifiedName || ''} arrow>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}
                                            onClick={() => { navigator.clipboard.writeText(entry.fullyQualifiedName || ''); showNotification('Copied to clipboard.', 'success', 3000, undefined); }}>
                                            <Typography sx={{ fontFamily: '"Google Sans Text", sans-serif', fontWeight: 500, fontSize: "13px", color: "#1F1F1F" }}>FQN</Typography>
                                            <ContentCopy sx={{ fontSize: "16px", color: "#0B57D0" }} />
                                        </Box>
                                    </Tooltip>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </Box>

                {/* Labels */}
                <Box sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    padding: "0px",
                    flex: "none",
                    alignSelf: "stretch",
                    flexGrow: 0,
                    border: "1px solid #DADCE0",
                    borderRadius: "12px",
                    marginTop: "10px",
                    overflow: "hidden",
                    backgroundColor: "#FFFFFF",
                }}>
                    {/* Header row */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px 20px" }}>
                        <Box sx={{ width: "32px", height: "32px", background: "#E7F0FE", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <LabelIcon sx={{ fontSize: "20px", color: "#0B57D0" }} />
                        </Box>
                        <Typography
                            component="span"
                            variant="heading2Medium"
                            sx={{
                                fontWeight: 400,
                                fontSize: "18px",
                                lineHeight: "24px",
                                color: "#1F1F1F",
                            }}
                        >
                            Labels
                        </Typography>
                    </Box>
                    <Divider sx={{ width: "100%", borderColor: "#DADCE0" }} />
                    {/* Content */}
                    <Box sx={{ padding: "15px 10px 15px 10px", width: "100%", boxSizing: "border-box" }}>
                        {entry.entrySource?.labels && Object.keys(entry.entrySource.labels).length > 0 ? (
                            <Box sx={{
                                display: "grid",
                                gridTemplateColumns: "repeat(2, 1fr)",
                                gap: "8px",
                                width: "100%"
                            }}>
                                {Object.keys(entry.entrySource.labels).map((key, index) => (
                                    <Tooltip key={index} title={`${key}: ${entry.entrySource.labels[key]}`} arrow>
                                        <Box sx={{
                                            display: "flex",
                                            flexDirection: "row",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            padding: "0px 8px",
                                            minWidth: 0,
                                            height: "20px",
                                            borderRadius: "8px",
                                            background: "#C2E7FF",
                                            cursor: "pointer",
                                            boxSizing: "border-box"
                                        }}>
                                            <Typography sx={{
                                                fontFamily: '"Google Sans Medium", "Google Sans", sans-serif',
                                                fontWeight: 500,
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
                                                {`${key}: ${entry.entrySource.labels[key]}`}
                                            </Typography>
                                        </Box>
                                    </Tooltip>
                                ))}
                            </Box>
                        ) : (
                            <Box sx={{ padding: "24px 0px", textAlign: "center", width: "100%" }}>
                                <Typography sx={{
                                    fontFamily: '"Google Sans Text", sans-serif',
                                    fontWeight: 400,
                                    fontSize: "14px",
                                    lineHeight: "1.43em",
                                    color: "#575757",
                                }}>
                                    No Labels available for this asset.
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>
            </Grid>
        </Grid>
        

    </div>
  );
}

export default DetailPageOverview;