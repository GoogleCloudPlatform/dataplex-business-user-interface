import React, { useEffect, useState } from 'react'
import { Box, Tab, Tabs, Tooltip } from '@mui/material'
import { ArrowBack } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import CustomTabPanel from '../TabPanel/CustomTabPanel'
import PreviewAnnotation from '../Annotation/PreviewAnnotation'
import AnnotationFilter from '../Annotation/AnnotationFilter'
import Tag from '../Tags/Tag'
import DetailPageOverview from '../DetailPageOverview/DetailPageOverview'
import Lineage from '../Lineage'
import DataQuality from '../DataQuality/DataQuality'
import DataProfile from '../DataProfile/DataProfile'
import EntryList from '../EntryList/EntryList'
import ShimmerLoader from '../Shimmer/ShimmerLoader'
import type { AppDispatch } from '../../app/store'
import { getSampleData } from '../../features/sample-data/sampleDataSlice'
import { popFromHistory } from '../../features/entry/entrySlice'
import { fetchAllDataScans, selectAllScans, selectAllScansStatus } from '../../features/dataScan/dataScanSlice';
import { useAuth } from '../../auth/AuthProvider'
import { getName, getEntryType, generateBigQueryLink, hasValidAnnotationData, generateLookerStudioLink  } from '../../utils/resourceUtils'
// import { useFavorite } from '../../hooks/useFavorite'

/**
 * @file ViewDetails.tsx
 * @description
 * This component renders the main "View Details" page for a specific data entry.
 * It serves as a container for various sub-components displayed in a tabbed
 * interface.
 *
 * Key functionalities include:
 * 1.  **Data Fetching**: It reads the primary `entry` data from the Redux
 * `entry.items` state. If the entry is a BigQuery table, it also dispatches
 * `getSampleData` to fetch table preview data.
 * 2.  **Loading State**: It displays a `ShimmerLoader` while the `entryStatus`
 * from Redux is 'loading'.
 * 3.  **Sticky Header**: It renders a sticky header containing:
 * - A "Back" button (`goBack`) that uses an internal Redux `entry.history`
 * stack for navigation before falling back to browser history.
 * - The entry's title and descriptive `Tag` components.
 * - Action buttons, such as "Open in BigQuery" and "Explore with Looker
 * Studio" (conditional on the entry type).
 * 4.  **Tabbed Interface**: It renders a `Tabs` component that dynamically
 * displays different tabs based on the `entryType`:
 * - **Tables (BigQuery)**: Overview, Aspects, Lineage, Data Profile,
 * Data Quality.
 * - **Datasets**: Overview, Entry List, Aspects.
 * - **Others**: Overview, Aspects.
 * 5.  **Tab Content**: It uses `CustomTabPanel` to render the content for the
 * active tab, which can be `DetailPageOverview`, `PreviewAnnotation`
 * (with `AnnotationFilter`), `Lineage`, `DataProfile`, `DataQuality`, or
 * `EntryList`.
 *
 * @param {object} props - This component accepts no props. It relies
 * entirely on data from the Redux store (via `useSelector`) and context
 * (via `useAuth`).
 *
 * @returns {React.ReactElement} A React element rendering the complete
 * detail page layout, which includes the sticky header, tab navigation,
 * and the content of the currently active tab, or a `ShimmerLoader` if
Such * data is loading.
 */

const ViewDetails = () => {
  const { user } = useAuth();
  const entry = useSelector((state: any) => state.entry.items);
  const entryStatus = useSelector((state: any) => state.entry.status);
  const entryHistory = useSelector((state: any) => state.entry.history);
  const sampleData = useSelector((state: any) => state.sampleData.items);
  const sampleDataStatus = useSelector((state: any) => state.sampleData.status);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const id_token = user?.token || '';
  const allScans = useSelector(selectAllScans);
  const allScansStatus = useSelector(selectAllScansStatus);
  const [tabValue, setTabValue] = React.useState(0);
  const [sampleTableData, setSampleTableData] = React.useState<any>();
  const [filteredEntry, setFilteredEntry] = useState<any>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [expandedAnnotations, setExpandedAnnotations] = useState<Set<string>>(new Set());
  const [dqScanName, setDqScanName] = useState<string | null>(null);
  const [dpScanName, setDpScanName] = useState<string | null>(null);

  //const [showSidePanel, setShowSidePanel] = React.useState(true);

  // Use shared favorite state
  // const { isFavorite, toggleFavorite } = useFavorite(entry?.name || '');

  const handleAnnotationCollapseAll = () => {
    setExpandedAnnotations(new Set());
  };

  const handleAnnotationExpandAll = () => {
    if (entry?.aspects) {
      const number = getEntryType(entry.name, '/');
      const annotationKeys = Object.keys(entry.aspects)
        .filter(key =>
          key !== `${number}.global.schema` &&
          key !== `${number}.global.overview` &&
          key !== `${number}.global.contacts` &&
          key !== `${number}.global.usage`
        )
        .filter(key => hasValidAnnotationData(entry.aspects![key])); // Only expand those with data
      setExpandedAnnotations(new Set(annotationKeys));
    }
  };
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    console.log(event);
    setTabValue(newValue);
  };
  

  const tabProps = (index: number)  => {
    return {
        id: `tab-${index}`,
        'aria-controls': `tabpanel-${index}`,
    };
  }

  const goBack = () => {
    // Check if we have entry history to go back to
    if (entryHistory && entryHistory.length > 0) {
      // Pop the last entry from history and set it as current
      dispatch(popFromHistory());
    } else {
      // If no history, fall back to browser navigation
      dispatch({ type: 'resources/setItems', payload: [] });
      navigate(-1);
    }
  };


//   let schema = <Schema entry={entry} css={{width:"100%"}} />;

let annotationTab = <PreviewAnnotation 
  entry={filteredEntry || entry} 
  css={{width:"100%", borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px', marginRight: '8px'}} 
  isTopComponent={true} 
  expandedItems={expandedAnnotations}
  setExpandedItems={setExpandedAnnotations}

/>;  let overviewTab = <DetailPageOverview entry={entry} css={{width:"100%"}} sampleTableData={sampleTableData}/>;
  
//   useEffect(() => {
//     if(getEntryType(entry.name, '/') == 'Tables') {
//         // schema = <Schema entry={entry} css={{width:"100%"}} />;
//         dispatch(getSampleData({fqn: entry.fullyQualifiedName, id_token: id_token}));
//     }
//   }, []);

  useEffect(() => {
    // Only fetch if we have a token and haven't fetched yet
    if (id_token){ // && allScansStatus === 'idle') {
      dispatch(fetchAllDataScans({ id_token: id_token, projectId: entry?.entrySource?.resource.split('/')[1] || '' }));
    }
  }, []);//[dispatch, id_token, allScansStatus]);

useEffect(() => {
    if (
      entryStatus === 'succeeded' &&
      allScansStatus === 'succeeded' &&
      entry?.entrySource?.resource &&
      allScans
    ) {
      // console.log("All data scans from API:", allScans);

      const resourceName = entry.entrySource.resource;

      // Find the Data Quality scan
      const dqScan = allScans.find(
        (scan: any) =>
          scan.data.resource.includes(resourceName) && scan.type === 'DATA_QUALITY'
      );
      setDqScanName(dqScan ? dqScan.name : null);

      // Find the Data Profile scan
      const dpScan = allScans.find(
        (scan: any) =>
          scan.data.resource.includes(resourceName) && scan.type === 'DATA_PROFILE'
      );
      setDpScanName(dpScan ? dpScan.name : null);
      
      // console.log(`For resource [${resourceName}], found DQ scan: ${dqScan ? dqScan.name : 'None'}`);
      // console.log(`For resource [${resourceName}], found DP scan: ${dpScan ? dpScan.name : 'None'}`);

    }
  }, [entry, entryStatus, allScans, allScansStatus, entry?.entrySource?.resource]);


  useEffect(() => {
    if(sampleDataStatus === 'succeeded') {
        // schema = <Schema entry={entry} css={{width:"100%"}} />;
        if(entry.entrySource?.system) {
          if(entry.entrySource?.system.toLowerCase() === 'bigquery'){
            setSampleTableData(sampleData);
            //console.log("Sample Data:", sampleData);
          }
        }
    }
  }, [sampleData]);

  useEffect(() => {
  if(entryStatus === 'loading') {
      setLoading(true);
  }
  if(entryStatus === 'succeeded') {
      // schema = <Schema entry={entry} css={{width:"100%"}} />;
      setLoading(false);
      if(getEntryType(entry.name, '/') == 'Tables' && entry.entrySource?.system != undefined && entry.entrySource?.system != "undefined" && entry.entrySource?.system.toLowerCase() === 'bigquery') {
        dispatch(getSampleData({fqn: entry.fullyQualifiedName, id_token: id_token}));
      }
      // console.log("loader:", loading);
  }
}, [entryStatus]);

  // Handle case where entry is already loaded from persistence
  useEffect(() => {
    if (entry && entryStatus === 'succeeded' && !loading) {
      // Entry is already loaded, no need to show loading state
      setLoading(false);
    }
  }, [entry, entryStatus, loading]);

  // Reset tab value when entry changes to prevent tab index issues
  useEffect(() => {
    if (entry) {
      setTabValue(0);
    }
  }, [entry?.name]);
  // Lineage tab with full Lineage component
  const lineageTab = <Lineage entry={entry}/>;

  return (
    <div style={{display: "flex", flexDirection: "column", padding: "0px 1rem", background:"#F8FAFD", minHeight: "100vh" }}>
      <div style={{display: "flex", flexDirection: "column", borderRadius:"20px",background: "#ffffff",minHeight: "95vh", marginBottom: "2rem"}}>
        {loading ? (<div style={{margin:"0px 20px"}}>
                      <div style={{
                            display: "flex",
                            flexDirection: "column",
                            padding: "24px 0px 16px 0px",
                            minHeight:"500px",
                        }}>
                          <ShimmerLoader count={6} type="card" />
                        </div>
                      </div>) : (<div style={{padding:"0px 0rem"}}>
                        {/* Sticky Header Container */}
                        <div style={{
                            position: 'sticky',
                            top: '64px',
                            backgroundColor: '#ffffff',
                            zIndex: 1000,
                            borderRadius: '20px 20px 0 0'
                        }}>

            {/* Primary Title Bar */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "24px 0px 4px 0px"
            }}>
                {/* Left Side - Back Arrow, Title, and Tags */}
                <div style={{
                    display: "flex",
                    alignItems: "center"
                }}>
                    <button 
                        onClick={goBack} 
                        style={{
                            background: "none", 
                            border: "none", 
                            color: "#0B57D0", 
                            cursor: "pointer", 
                            padding: "4px",
                            display: "flex",
                            alignItems: "center",
                            marginRight: "1rem"
                        }}
                    >
                        <ArrowBack style={{fontSize: "24px"}} />
                    </button>
                    <Tooltip 
                      title={
                        entry.entrySource.displayName.length > 0 
                        ? entry.entrySource.displayName 
                        : getName(entry.name || '', '/')
                      }
                      arrow placement='top'
                    >
                    <label style={{ 
                        fontFamily: '"Google Sans", sans-serif',
                        color: "#1F1F1F", 
                        fontSize: "1.125rem", 
                        fontWeight: "500",
                        // textTransform: "capitalize",
                        marginRight: "0.5rem",
                        maxWidth: '400px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}>
                        {entry.entrySource.displayName.length > 0 ? entry.entrySource.displayName : getName(entry.name || '', '/')}
                    </label>
                    </Tooltip>
                    <Tag 
                        text={entry.entrySource.system ? (entry.entrySource?.system.toLowerCase() === 'bigquery' ? 'BigQuery' : entry.entrySource?.system.replace("_", " ").replace("-", " ").toLowerCase()) : 'Custom'} 
                        css={{
                            fontFamily: '"Google Sans Text", sans-serif',
                            backgroundColor: '#C2E7FF',
                            color: '#004A77',
                            borderRadius: '8px',
                            padding: '4px 8px',
                            height: '1.25rem',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            border: 'none',
                            textTransform: 'capitalize',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: '0.5rem',
                            display: 'flex'
                        }}
                    />
                    <Tag 
                        text={getEntryType(entry.name, '/')} 
                        css={{
                            fontFamily: '"Google Sans Text", sans-serif',
                            backgroundColor: '#C2E7FF',
                            color: '#004A77',
                            borderRadius: '8px',
                            padding: '4px 8px',
                            height: '1.25rem',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            border: 'none',
                            alignItems: 'center',
                            justifyContent: 'center',
                            display: 'flex'
                        }}
                    />
                </div>
                
                {/* Right Side - Star and Action Buttons */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    marginRight: "2rem"
                }}>
                  {/* <svg 
                    width="1.25rem" 
                    height="1.25rem" 
                    viewBox="0 0 18 18" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                        cursor: "pointer",
                        flexShrink: 0 // Prevent icon from shrinking
                    }}
                    onClick={() => {
                      const newStatus = toggleFavorite();
                      console.log(newStatus ? 'Added to favorites' : 'Removed from favorites');
                    }}                >
                    {isFavorite ? (
                        // Filled star when favorited
                        <path 
                            d="M9 1.5L11.1075 6.465L16.5 6.93L12.4125 10.4775L13.635 15.75L9 12.9525L4.365 15.75L5.595 10.4775L1.5 6.93L6.8925 6.4725L9 1.5Z" 
                            fill="#F4B400"
                        />
                    ) : (
                        // Outlined star when not favorited
                        <path 
                            fillRule="evenodd" 
                            clipRule="evenodd" 
                            d="M11.1075 6.465L16.5 6.93L12.4125 10.4775L13.635 15.75L9 12.9525L4.365 15.75L5.595 10.4775L1.5 6.93L6.8925 6.4725L9 1.5L11.1075 6.465ZM6.18 13.2525L9 11.55L11.8275 13.26L11.0775 10.05L13.5675 7.89L10.2825 7.605L9 4.575L7.725 7.5975L4.44 7.8825L6.93 10.0425L6.18 13.2525Z" 
                            fill="#575757"
                            opacity="0.4"
                        />
                    )}
                  </svg> */}
                  
                  {
                    entry.entrySource?.system.toLowerCase() === 'bigquery' ? (<>
                        <button 
                              onClick={() => window.open(generateBigQueryLink(entry), '_blank')}
                              style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              color: "#0B57D0",
                              fontFamily: '"Google Sans Text", sans-serif',
                              fontSize: "0.75rem",
                              fontWeight: "700"
                          }}>
                              <img 
                                  src="/assets/images/Product-Icons.png" 
                                  alt="Open in BQ" 
                                  style={{width: "16px", height: "16px", position:'relative', top: '-2px'}} 
                              />
                              Open in BigQuery
                        </button>
                        <button 
                              onClick={() => window.open(generateLookerStudioLink(entry), '_blank')}
                              style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              color: "#0B57D0",
                              fontFamily: '"Google Sans Text", sans-serif',
                              fontSize: "0.75rem",
                              fontWeight: "700"
                          }}>
                              <img 
                                  src="/assets/images/looker.png" 
                                  alt="Open in Looker" 
                                  style={{width: "12px", position:'relative', top: '-3px'}} 
                              />
                              Explore with Looker Studio
                        </button>
                      </>
                    ):(<></>)
                  }
                </div>
              </div>
              {/* Navigation Tab Bar */}
              <div style={{ paddingTop: "0px", marginTop: "0px" }}>
                <Box
                  sx={{
                    width: "100%",
                    borderBottom: 1,
                    borderBottomColor: "#E0E0E0",
                  }}
                >
                  <Box
                    sx={{
                      paddingLeft: "1.75rem",
                      position: "relative",
                      "& .MuiTabs-root": {
                        minHeight: "48px",
                      },
                      "& .MuiTab-root": {
                        fontFamily: '"Google Sans Text", sans-serif',
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        color: "#575757",
                        textTransform: "none",
                        minHeight: "48px",
                        padding: "12px 20px 16px",
                        "&.Mui-selected": {
                          color: "#0B57D0",
                          fontWeight: "600",
                        },
                      },
                      "& .MuiTabs-indicator": {
                        backgroundColor: "transparent",
                        "&::after": {
                          content: '""',
                          position: "absolute",
                          left: "20px",
                          right: "20px",
                          bottom: "-2px",
                          height: "5px",
                          backgroundColor: "white",
                          borderTop: "4px solid #0B57D0",
                          borderRadius: "2.5px 2.5px 0 0",
                        },
                      },
                    }}>
                        <Tabs value={tabValue} 
                          onChange={handleTabChange} 
                          aria-label="basic tabs"
                          TabIndicatorProps={{
                            children: <span className="indicator" />,
                          }}
                        >
                            {getEntryType(entry.name, '/') === 'Tables' && entry.entrySource?.system.toLowerCase() === 'bigquery'? [
                              <Tab key="overview" label="Overview" {...tabProps(0)} />,
                              <Tab key="annotations" label="Aspects" {...tabProps(1)} />,
                              <Tab key="lineage" label="Lineage" {...tabProps(2)} />,
                              <Tab key="dataProfile" label="Data Profile" {...tabProps(3)} />,
                              <Tab key="dataQuality" label="Data Quality" {...tabProps(4)} />
                            ] : getEntryType(entry.name, '/') === 'Datasets' ? [
                              <Tab key="overview" label="Overview" {...tabProps(0)} />,
                              <Tab key="entryList" label="Entry List" {...tabProps(1)} />,
                              <Tab key="annotations" label="Aspects" {...tabProps(2)} />
                            ] : [
                              <Tab key="overview" label="Overview" {...tabProps(0)} />,
                              <Tab key="annotations" label="Aspects" {...tabProps(1)} />,
                              // <Tab key="lineage" label="Lineage" {...tabProps(2)} />,
                              // <Tab key="dataProfile" label="Data Profile" {...tabProps(3)} />,
                              // <Tab key="dataQuality" label="Data Quality" {...tabProps(4)} />
                            ]}
                        </Tabs>
                    </Box>
                </Box>
            </div>
          </div>
                        
           {/* Tab Content - Non-sticky */}
            <div style={{paddingTop:"0px", marginTop:"0px", marginLeft: "2.5rem", marginRight: "2rem"}}>
                    <CustomTabPanel value={tabValue} index={0}>
                        {overviewTab}
                    </CustomTabPanel>
                    {getEntryType(entry.name, '/') === 'Tables' && entry.entrySource?.system.toLowerCase() === 'bigquery' ? (
                      <>
                        <CustomTabPanel value={tabValue} index={1}>
                            <AnnotationFilter
                              entry={entry}
                              onFilteredEntryChange={setFilteredEntry}
                              sx={{width: "100%", marginTop: '1.25rem' }}
                              onCollapseAll={handleAnnotationCollapseAll}
                              onExpandAll={handleAnnotationExpandAll}
                            />
                            {annotationTab}
                        </CustomTabPanel>
                       <CustomTabPanel value={tabValue} index={2}>
                            {lineageTab}
                        </CustomTabPanel>
                        <CustomTabPanel value={tabValue} index={3}>
                            <DataProfile scanName={dpScanName} />
                        </CustomTabPanel>
                        <CustomTabPanel value={tabValue} index={4}>
                            <DataQuality scanName={dqScanName} />
                        </CustomTabPanel>
                      </>
                    ) : getEntryType(entry.name, '/') === 'Datasets' ? (
                      <>
                        <CustomTabPanel value={tabValue} index={1}>
                            <EntryList entry={entry}/>
                        </CustomTabPanel>
                        <CustomTabPanel value={tabValue} index={2}>
                            <AnnotationFilter
                              entry={entry}
                              onFilteredEntryChange={setFilteredEntry}
                              sx={{ marginTop: '1.25rem' }}
                              onCollapseAll={handleAnnotationCollapseAll}
                              onExpandAll={handleAnnotationExpandAll}
                            />
                            {annotationTab}
                        </CustomTabPanel>
                      </>
                    ) : (
                      <>
                        <CustomTabPanel value={tabValue} index={1}>
                            <AnnotationFilter
                              entry={entry}
                              onFilteredEntryChange={setFilteredEntry}
                              sx={{ marginTop: '1.25rem' }}
                              onCollapseAll={handleAnnotationCollapseAll}
                              onExpandAll={handleAnnotationExpandAll}
                            />
                            {annotationTab}
                        </CustomTabPanel>
                        {/* <CustomTabPanel value={tabValue} index={2}>
                            {lineageTab}
                        </CustomTabPanel>
                        <CustomTabPanel value={tabValue} index={3}>
                            <DataProfile entry={entry}/>
                        </CustomTabPanel>
                        <CustomTabPanel value={tabValue} index={4}>
                            <DataQuality entry={entry}/>
                        </CustomTabPanel> */}
                      </>
                    )}
          </div>
        </div>)
        }
      </div>
    </div>
  )
}

export default ViewDetails;