import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { Box, Tab, Tabs, Tooltip, Skeleton } from '@mui/material'
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
import { popFromHistory, pushToHistory, fetchEntry } from '../../features/entry/entrySlice'
import { fetchAllDataScans, selectAllScans, selectAllScansStatus } from '../../features/dataScan/dataScanSlice';
import { useAuth } from '../../auth/AuthProvider'
import { getName, getEntryType, generateBigQueryLink, hasValidAnnotationData, generateLookerStudioLink  } from '../../utils/resourceUtils'
import { findItem } from '../../utils/glossaryUtils';
import {
  fetchViewDetailsTermRelationships,
  fetchViewDetailsEntryDetails,
  fetchViewDetailsChildren
} from '../../features/glossaries/glossariesSlice';
import GlossariesCategoriesTerms from '../Glossaries/GlossariesCategoriesTerms';
import GlossariesCategoriesTermsSkeleton from '../Glossaries/GlossariesCategoriesTermsSkeleton';
import GlossariesLinkedAssets from '../Glossaries/GlossariesLinkedAssets';
import GlossariesSynonyms from '../Glossaries/GlossariesSynonyms';
import GlossariesSynonymsSkeleton from '../Glossaries/GlossariesSynonymsSkeleton';
import ResourcePreview from '../Common/ResourcePreview';
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

// Helper function to determine glossary entry type
const getGlossaryType = (entry: any): 'glossary' | 'category' | 'term' | null => {
  if (!entry?.entryType) return null;

  const entryTypeStr = entry.entryType.toLowerCase();

  if (entryTypeStr.includes('glossary') && !entryTypeStr.includes('category') && !entryTypeStr.includes('term')) {
    return 'glossary';
  }
  if (entryTypeStr.includes('category')) {
    return 'category';
  }
  if (entryTypeStr.includes('term')) {
    return 'term';
  }

  return null;
};

const ViewDetails = () => {
  const { user } = useAuth();
  const entry = useSelector((state: any) => state.entry.items);
  const entryStatus = useSelector((state: any) => state.entry.status);
  const entryHistory = useSelector((state: any) => state.entry.history);
  const sampleData = useSelector((state: any) => state.sampleData.items);
  const sampleDataStatus = useSelector((state: any) => state.sampleData.status);
  const glossaryItems = useSelector((state: any) => state.glossaries.viewDetailsItems);
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

  const [glossaryType, setGlossaryType] = useState<'glossary' | 'category' | 'term' | null>(null);
  const [contentSearchTerm, setContentSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [sortBy, setSortBy] = useState<'name' | 'lastModified'>('name');
  const [relationFilter, setRelationFilter] = useState<'all' | 'synonym' | 'related'>('all');
  const [fetchedEntryId, setFetchedEntryId] = useState<string | null>(null);
  const [assetPreviewData, setAssetPreviewData] = useState<any | null>(null);
  const [isAssetPreviewOpen, setIsAssetPreviewOpen] = useState(false);
  const [lockedEntry, setLockedEntry] = useState<any>(null);

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
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);

    // Auto-close asset preview on tab switch
    if (isAssetPreviewOpen) {
      setIsAssetPreviewOpen(false);
      setAssetPreviewData(null);
    }
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

  // Glossary-specific helper functions
  const handleSortDirectionToggle = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const handleResourceClick = (id: string) => {
    dispatch(pushToHistory());

    // Convert resource ID to entry name format for fetchEntry
    // Resource ID format: projects/{project}/locations/{location}/glossaries/{glossary}/[categories/{category}/]terms/{term}
    // Entry name format: projects/{project}/locations/{location}/entryGroups/@dataplex/entries/{resource}
    let entryName = id;

    // Check if this is already in entry name format or needs conversion
    if (!id.includes('/entryGroups/')) {
      // Extract project and location from the resource ID
      const parts = id.split('/');
      const projectIndex = parts.indexOf('projects');
      const locationIndex = parts.indexOf('locations');

      if (projectIndex !== -1 && locationIndex !== -1) {
        const project = parts[projectIndex + 1];
        const location = parts[locationIndex + 1];

        // Build entry name format
        entryName = `projects/${project}/locations/${location}/entryGroups/@dataplex/entries/${id}`;
      }
    }

    dispatch(fetchEntry({ entryName: entryName, id_token: id_token }));
  };

  // Helper function to sort items
  const sortItems = useCallback((items: any[]) => {
    return [...items].sort((a, b) => {
      if (sortBy === 'name') {
        const nameA = a.displayName.toLowerCase();
        const nameB = b.displayName.toLowerCase();
        return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      } else {
        const dateA = a.lastModified || 0;
        const dateB = b.lastModified || 0;
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
    });
  }, [sortBy, sortOrder]);

  // Glossary data computation with useMemo
  const currentGlossaryItem = useMemo(() => {
    if (!glossaryType || !entry) return null;
    // Use entry.entrySource.resource as the ID to find in the glossariesSlice tree
    const resourceId = entry.entrySource?.resource || entry.name;
    return findItem(glossaryItems, resourceId);
  }, [glossaryType, entry, glossaryItems]);

  const categories = useMemo(() => {
    return currentGlossaryItem?.children?.filter((c: any) => c.type === 'category') || [];
  }, [currentGlossaryItem]);

  const terms = useMemo(() => {
    const getAllTerms = (node: any): any[] => {
      let allTerms: any[] = [];
      if (node?.children) {
        node.children.forEach((child: any) => {
          if (child.type === 'term') allTerms.push(child);
          allTerms = [...allTerms, ...getAllTerms(child)];
        });
      }
      return allTerms;
    };
    return currentGlossaryItem ? getAllTerms(currentGlossaryItem) : [];
  }, [currentGlossaryItem]);

  const relations = useMemo(() => {
    return currentGlossaryItem?.relations || [];
  }, [currentGlossaryItem]);

  const filteredCategories = useMemo(() => {
    const filtered = categories.filter((c: any) =>
      c.displayName.toLowerCase().includes(contentSearchTerm.toLowerCase())
    );
    return sortItems(filtered);
  }, [categories, contentSearchTerm, sortBy, sortOrder]);

  const filteredTerms = useMemo(() => {
    const filtered = terms.filter((t: any) =>
      t.displayName.toLowerCase().includes(contentSearchTerm.toLowerCase())
    );
    return sortItems(filtered);
  }, [terms, contentSearchTerm, sortBy, sortOrder]);

  // Check if glossary data is still loading
  const isGlossaryDataLoading = useMemo(() => {
    if (!glossaryType) return false;

    // If we don't have the item in the tree yet, it's loading
    if (!currentGlossaryItem) return true;

    // For glossary/category, check if children have been loaded
    if ((glossaryType === 'glossary' || glossaryType === 'category') && !currentGlossaryItem.children) {
      return true;
    }

    // For terms, check if relations have been loaded
    if (glossaryType === 'term' && !currentGlossaryItem.relations) {
      return true;
    }

    return false;
  }, [glossaryType, currentGlossaryItem]);

  // Lock the current entry when preview opens to prevent ViewDetails from updating
  useEffect(() => {
    if (isAssetPreviewOpen && !lockedEntry) {
      // Lock the current entry when preview opens
      setLockedEntry(entry);
    } else if (!isAssetPreviewOpen && lockedEntry) {
      // Unlock when preview closes
      setLockedEntry(null);
    }
  }, [isAssetPreviewOpen, entry, lockedEntry]);

  // Use locked entry for display when preview is open, otherwise use current entry
  const displayEntry = lockedEntry || entry;


//   let schema = <Schema entry={entry} css={{width:"100%"}} />;

let annotationTab = <PreviewAnnotation
  entry={filteredEntry || displayEntry}
  css={{width:"100%", borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px', marginRight: '8px'}}
  isTopComponent={true}
  expandedItems={expandedAnnotations}
  setExpandedItems={setExpandedAnnotations}

/>;  let overviewTab = <DetailPageOverview entry={displayEntry} css={{width:"100%"}} sampleTableData={sampleTableData}/>;
  
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
    // Don't update scans if preview is open
    if (isAssetPreviewOpen) return;

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
  }, [entry, entryStatus, allScans, allScansStatus, entry?.entrySource?.resource, isAssetPreviewOpen]);


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
  // Don't update loading state if preview is open (to prevent navigation appearance)
  if (isAssetPreviewOpen) return;

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
}, [entryStatus, isAssetPreviewOpen]);

  // Handle case where entry is already loaded from persistence
  useEffect(() => {
    // Don't update if preview is open
    if (isAssetPreviewOpen) return;

    if (entry && entryStatus === 'succeeded' && !loading) {
      // Entry is already loaded, no need to show loading state
      setLoading(false);
    }
  }, [entry, entryStatus, loading, isAssetPreviewOpen]);

  // Detect glossary type and fetch glossary-specific data
  useEffect(() => {
    // Don't fetch data if preview is open (to prevent navigation appearance)
    if (isAssetPreviewOpen) return;

    if (entry && entryStatus === 'succeeded') {
      const type = getGlossaryType(entry);
      setGlossaryType(type);

      if (type && user?.token) {
        const resourceId = entry.entrySource?.resource || entry.name;

        // Only fetch if we haven't fetched this entry yet
        if (fetchedEntryId !== resourceId) {
          setFetchedEntryId(resourceId);

          // Fetch entry details (description, longDescription, contacts, labels, aspects)
          dispatch(fetchViewDetailsEntryDetails({
            entryName: entry.name,
            id_token: user.token
          }));

          // For glossary/category, fetch children (categories and terms)
          if (type === 'glossary' || type === 'category') {
            dispatch(fetchViewDetailsChildren({
              parentId: resourceId,
              id_token: user.token
            }));
          }

          // For terms, fetch relationships (linked assets, synonyms, related terms)
          if (type === 'term') {
            dispatch(fetchViewDetailsTermRelationships({
              termId: resourceId,
              id_token: user.token
            }));
          }
        }
      }
    }
  }, [entry, entryStatus, user?.token, dispatch, fetchedEntryId, isAssetPreviewOpen]);

  // Reset tab value and glossary-specific state when entry changes
  useEffect(() => {
    // Don't reset if preview is open (to prevent navigation appearance)
    if (isAssetPreviewOpen) return;

    if (entry) {
      setTabValue(0);
      setContentSearchTerm('');
      setRelationFilter('all');
      setFetchedEntryId(null);
      setAssetPreviewData(null);
      setIsAssetPreviewOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry?.name]);
  // Lineage tab with full Lineage component
  const lineageTab = <Lineage entry={displayEntry}/>;

  return (
    <div style={{display: "flex", flexDirection: "column", padding: "0px 0", background:"#F8FAFD", height: "100vh", overflow: "hidden" }}>
      <div style={{display: "flex", flexDirection: "row", gap: "1rem", flex: 1, minHeight: 0, overflow: "hidden"}}>
      <div style={{display: "flex", flexDirection: "column", borderRadius:"20px",background: "#ffffff", flex: 1, minHeight: 0, marginBottom: "2rem", overflow: "hidden"}}>
        {loading ? (
          <Box sx={{ padding: "0px 20px" }}>
            {/* Header Skeleton: Back button + Title + Tags */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '24px 0px 16px 0px'
            }}>
              <Skeleton variant="circular" width={32} height={32} />
              <Skeleton variant="text" width={250} height={28} />
              <Skeleton variant="rounded" width={70} height={24} sx={{ borderRadius: '8px' }} />
              <Skeleton variant="rounded" width={60} height={24} sx={{ borderRadius: '8px' }} />
            </Box>

            {/* Tabs Skeleton */}
            <Box sx={{
              display: 'flex',
              gap: '24px',
              paddingLeft: '28px',
              paddingBottom: '12px',
              borderBottom: '1px solid #E0E0E0'
            }}>
              <Skeleton variant="text" width={80} height={20} />
              <Skeleton variant="text" width={70} height={20} />
              <Skeleton variant="text" width={65} height={20} />
              <Skeleton variant="text" width={90} height={20} />
            </Box>

            {/* Body Skeleton */}
            <Box sx={{ margin: '24px 40px', minHeight: '400px' }}>
              <Skeleton variant="rounded" width="100%" height={400} sx={{ borderRadius: '8px' }} />
            </Box>
          </Box>
        ) : (<div style={{padding:"0px 0rem", display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden"}}>
                        {/* Fixed Header Container - does not scroll */}
                        <div style={{
                            flexShrink: 0,
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
                        displayEntry.entrySource.displayName.length > 0
                        ? displayEntry.entrySource.displayName
                        : getName(displayEntry.name || '', '/')
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
                        {displayEntry.entrySource.displayName.length > 0 ? displayEntry.entrySource.displayName : getName(displayEntry.name || '', '/')}
                    </label>
                    </Tooltip>
                    <Tag
                        text={displayEntry.entrySource.system ? (displayEntry.entrySource?.system.toLowerCase() === 'bigquery' ? 'BigQuery' : displayEntry.entrySource?.system.replace("_", " ").replace("-", " ").toLowerCase()) : 'Custom'} 
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
                        text={getEntryType(displayEntry.name, '/')} 
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
                    displayEntry.entrySource?.system.toLowerCase() === 'bigquery' ? (<>
                        <button
                              onClick={() => window.open(generateBigQueryLink(displayEntry), '_blank')}
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
                              onClick={() => window.open(generateLookerStudioLink(displayEntry), '_blank')}
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
                            {getEntryType(displayEntry.name, '/') === 'Tables' && displayEntry.entrySource?.system.toLowerCase() === 'bigquery'? [
                              <Tab key="overview" label="Overview" {...tabProps(0)} />,
                              <Tab key="annotations" label="Aspects" {...tabProps(1)} />,
                              <Tab key="lineage" label="Lineage" {...tabProps(2)} />,
                              <Tab key="dataProfile" label="Data Profile" {...tabProps(3)} />,
                              <Tab key="dataQuality" label="Data Quality" {...tabProps(4)} />
                            ] : getEntryType(displayEntry.name, '/') === 'Datasets' ? [
                              <Tab key="overview" label="Overview" {...tabProps(0)} />,
                              <Tab key="entryList" label="Entry List" {...tabProps(1)} />,
                              <Tab key="annotations" label="Aspects" {...tabProps(2)} />
                            ] : glossaryType === 'glossary' || glossaryType === 'category' ? [
                              <Tab key="overview" label="Overview" {...tabProps(0)} />,
                              <Tab key="categories" label="Categories" {...tabProps(1)} />,
                              <Tab key="terms" label="Terms" {...tabProps(2)} />,
                              <Tab key="annotations" label="Aspects" {...tabProps(3)} />
                            ] : glossaryType === 'term' ? [
                              <Tab key="overview" label="Overview" {...tabProps(0)} />,
                              <Tab key="linkedAssets" label="Linked Assets" {...tabProps(1)} />,
                              <Tab key="synonyms" label="Synonyms & Related Terms" {...tabProps(2)} />,
                              <Tab key="annotations" label="Aspects" {...tabProps(3)} />
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
                        
           {/* Tab Content - Non-sticky, Scrollable */}
            <div style={{paddingTop:"0px", marginTop:"0px", marginLeft: "2.5rem", marginRight: "2rem", flex: 1, overflowY: "auto", minHeight: 0, paddingBottom: "2rem"}}>
                    <CustomTabPanel value={tabValue} index={0}>
                        {overviewTab}
                    </CustomTabPanel>
                    {getEntryType(entry.name, '/') === 'Tables' && entry.entrySource?.system.toLowerCase() === 'bigquery' ? (
                      <>
                        <CustomTabPanel value={tabValue} index={1}>
                            <AnnotationFilter
                              entry={displayEntry}
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
                            <EntryList entry={displayEntry}/>
                        </CustomTabPanel>
                        <CustomTabPanel value={tabValue} index={2}>
                            <AnnotationFilter
                              entry={displayEntry}
                              onFilteredEntryChange={setFilteredEntry}
                              sx={{ marginTop: '1.25rem' }}
                              onCollapseAll={handleAnnotationCollapseAll}
                              onExpandAll={handleAnnotationExpandAll}
                            />
                            {annotationTab}
                        </CustomTabPanel>
                      </>
                    ) : glossaryType === 'glossary' || glossaryType === 'category' ? (
                      <>
                        <CustomTabPanel value={tabValue} index={1}>
                          {isGlossaryDataLoading ? (
                            <Box sx={{ marginTop: '1.25rem', height: 'calc(100% - 1.25rem)' }}>
                              <GlossariesCategoriesTermsSkeleton />
                            </Box>
                          ) : (
                            <Box sx={{ marginTop: '1.25rem', height: 'calc(100% - 1.25rem)' }}>
                              <GlossariesCategoriesTerms
                                mode="categories"
                                items={filteredCategories}
                                searchTerm={contentSearchTerm}
                                onSearchTermChange={setContentSearchTerm}
                                sortBy={sortBy}
                                sortOrder={sortOrder}
                                onSortByChange={setSortBy}
                                onSortOrderToggle={handleSortDirectionToggle}
                                onItemClick={handleResourceClick}
                              />
                            </Box>
                          )}
                        </CustomTabPanel>
                        <CustomTabPanel value={tabValue} index={2}>
                          {isGlossaryDataLoading ? (
                            <Box sx={{ marginTop: '1.25rem', height: 'calc(100% - 1.25rem)' }}>
                              <GlossariesCategoriesTermsSkeleton />
                            </Box>
                          ) : (
                            <Box sx={{ marginTop: '1.25rem', height: 'calc(100% - 1.25rem)' }}>
                              <GlossariesCategoriesTerms
                                mode="terms"
                                items={filteredTerms}
                                searchTerm={contentSearchTerm}
                                onSearchTermChange={setContentSearchTerm}
                                sortBy={sortBy}
                                sortOrder={sortOrder}
                                onSortByChange={setSortBy}
                                onSortOrderToggle={handleSortDirectionToggle}
                                onItemClick={handleResourceClick}
                              />
                            </Box>
                          )}
                        </CustomTabPanel>
                        <CustomTabPanel value={tabValue} index={3}>
                            <AnnotationFilter
                              entry={displayEntry}
                              onFilteredEntryChange={setFilteredEntry}
                              sx={{ marginTop: '1.25rem' }}
                              onCollapseAll={handleAnnotationCollapseAll}
                              onExpandAll={handleAnnotationExpandAll}
                            />
                            {annotationTab}
                        </CustomTabPanel>
                      </>
                    ) : glossaryType === 'term' ? (
                      <>
                        <CustomTabPanel value={tabValue} index={1}>
                          {isGlossaryDataLoading ? (
                            <Box sx={{ p: '20px', height: 'calc(100% - 40px)' }}>
                              <ShimmerLoader count={6} type="card" />
                            </Box>
                          ) : (
                            <Box sx={{ marginTop: '1.25rem', height: 'calc(100% - 1.25rem)' }}>
                              <GlossariesLinkedAssets
                                linkedAssets={currentGlossaryItem?.linkedAssets || []}
                                searchTerm={contentSearchTerm}
                                onSearchTermChange={setContentSearchTerm}
                                idToken={id_token}
                                onAssetPreviewChange={(data) => {
                                  setAssetPreviewData(data);
                                  setIsAssetPreviewOpen(!!data);
                                }}
                              />
                            </Box>
                          )}
                        </CustomTabPanel>
                        <CustomTabPanel value={tabValue} index={2}>
                          {isGlossaryDataLoading ? (
                            <Box sx={{ marginTop: '1.25rem', height: 'calc(100% - 1.25rem)' }}>
                              <GlossariesSynonymsSkeleton />
                            </Box>
                          ) : (
                            <Box sx={{ marginTop: '1.25rem', height: 'calc(100% - 1.25rem)' }}>
                              <GlossariesSynonyms
                                relations={relations}
                                searchTerm={contentSearchTerm}
                                onSearchTermChange={setContentSearchTerm}
                                relationFilter={relationFilter}
                                onRelationFilterChange={setRelationFilter}
                                sortBy={sortBy}
                                sortOrder={sortOrder}
                                onSortByChange={setSortBy}
                                onSortOrderToggle={handleSortDirectionToggle}
                                onItemClick={handleResourceClick}
                              />
                            </Box>
                          )}
                        </CustomTabPanel>
                        <CustomTabPanel value={tabValue} index={3}>
                            <AnnotationFilter
                              entry={displayEntry}
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
                              entry={displayEntry}
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
      {/* Asset Preview Panel - Sticky Sidebar */}
      <Box
        sx={{
          width: isAssetPreviewOpen ? "clamp(300px, 22vw, 360px)" : "0px",
          minWidth: isAssetPreviewOpen ? "clamp(300px, 22vw, 360px)" : "0px",
          height: "calc(100vh - 2rem)",
          marginBottom: "2rem",
          borderRadius: "20px",
          backgroundColor: "#fff",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: isAssetPreviewOpen ? "0px 4px 12px rgba(0,0,0,0.1)" : "none",
          transition: "width 0.3s ease-in-out, min-width 0.3s ease-in-out, opacity 0.3s ease-in-out",
          opacity: isAssetPreviewOpen ? 1 : 0,
        }}
      >
        <ResourcePreview
          previewData={assetPreviewData}
          onPreviewDataChange={(data) => {
            if (data) {
              setAssetPreviewData(data);
              setIsAssetPreviewOpen(true);
            } else {
              setIsAssetPreviewOpen(false);
            }
          }}
          onViewDetails={(previewEntry) => {
            // Close the preview panel
            setIsAssetPreviewOpen(false);
            setAssetPreviewData(null);
            // Navigate to the asset using handleResourceClick
            if (previewEntry?.name) {
              handleResourceClick(previewEntry.name);
            }
          }}
          id_token={id_token}
          isGlossary={true}
          previewMode="isolated"
        />
      </Box>
      </div>
    </div>
  )
}

export default ViewDetails;