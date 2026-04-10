import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { Box, IconButton, Tab, Tabs, Tooltip, Skeleton } from '@mui/material'
import { ArrowBack, KeyboardArrowUp, KeyboardArrowDown } from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import CustomTabPanel from '../TabPanel/CustomTabPanel'
import PreviewAnnotation from '../Annotation/PreviewAnnotation'
import AnnotationFilter from '../Annotation/AnnotationFilter'
import Tag from '../Tags/Tag'
import DetailPageOverview from '../DetailPageOverview/DetailPageOverview'
import DetailPageOverviewSkeleton from '../DetailPageOverview/DetailPageOverviewSkeleton'
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
import { getName, getEntryType, generateBigQueryLink, hasValidAnnotationData, generateLookerStudioLink, getAssetIcon  } from '../../utils/resourceUtils'
import { getGlossaryMuiIcon, isGlossaryAssetType, assetNameToGlossaryType } from '../../constants/glossaryIcons'
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
import TableInsights from '../TableInsights/TableInsights'
import { useNoAccess } from '../../contexts/NoAccessContext';
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
  const entryError = useSelector((state: any) => state.entry.error);
  const entryHistory = useSelector((state: any) => state.entry.history);
  const { triggerNoAccess } = useNoAccess();
  const sampleData = useSelector((state: any) => state.sampleData.items);
  const sampleDataStatus = useSelector((state: any) => state.sampleData.status);
  const glossaryItems = useSelector((state: any) => state.glossaries.viewDetailsItems);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const id_token = user?.token || '';
  const allScans = useSelector(selectAllScans);
  const allScansStatus = useSelector(selectAllScansStatus);
  const initialTabName = (location.state as any)?.tabName as string | undefined;
  const tabNameApplied = React.useRef(false);
  const [tabValue, setTabValue] = React.useState(0);
  const [sampleTableData, setSampleTableData] = React.useState<any>();
  const [filteredEntry, setFilteredEntry] = useState<any>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [expandedAnnotations, setExpandedAnnotations] = useState<Set<string>>(new Set());
  const [dqScanName, setDqScanName] = useState<string | null>(null);
  const [dpScanName, setDpScanName] = useState<string | null>(null);
  const [tableInsightsScanName, setTableInsightsScanName] = useState<string | null>(null);

  const [glossaryType, setGlossaryType] = useState<'glossary' | 'category' | 'term' | null>(null);
  const [contentSearchTerm, setContentSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [sortBy, setSortBy] = useState<'name' | 'lastModified'>('name');
  const [relationFilter, setRelationFilter] = useState<'all' | 'synonym' | 'related'>('all');
  const [fetchedEntryId, setFetchedEntryId] = useState<string | null>(null);
  const [assetPreviewData, setAssetPreviewData] = useState<any | null>(null);
  const [isAssetPreviewOpen, setIsAssetPreviewOpen] = useState(false);
  const [lockedEntry, setLockedEntry] = useState<any>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      setIsScrolled(scrollContainerRef.current.scrollTop > 0);
    }
  }, []);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

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
  const bigQueryLink = generateBigQueryLink(displayEntry);
  const lookerLink = generateLookerStudioLink(displayEntry);

  const headerDescription = displayEntry?.entrySource?.description || '';

let annotationTab = <PreviewAnnotation
  entry={filteredEntry || displayEntry}
  css={{width:"100%", marginRight: '8px'}}
  isTopComponent={true}
  expandedItems={expandedAnnotations}
  setExpandedItems={setExpandedAnnotations}

/>;  let overviewTab = <DetailPageOverview entry={displayEntry} css={{width:"100%"}} sampleTableData={sampleTableData} noTopSpacing={true}/>;
  
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

      const tableInsightsScan = allScans.find(
        (scan: any) =>
          (scan.data.resource === resourceName || scan.data.resource === `//bigquery.googleapis.com/${resourceName}`)&& (scan.type === 'DATA_DOCUMENTATION' || scan.type === 4)
      );
      console.log("Table Insights Scans found:", tableInsightsScan);
      setTableInsightsScanName(tableInsightsScan?.name || null);
      console.log(`tableInsightsScanName for resource [${resourceName}]:`, tableInsightsScanName);

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

  // Show no-access modal when entry fetch returns PERMISSION_DENIED
  useEffect(() => {
    if (entryStatus === 'failed' && entryError?.type === 'PERMISSION_DENIED') {
      triggerNoAccess({ message: entryError.message });
    }
  }, [entryStatus, entryError, triggerNoAccess]);

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

  // Resolve a tab name (e.g. 'aspects', 'lineage') to a numeric index based on entry type
  const resolveTabName = (tabName: string): number => {
    const type = getEntryType(entry.name, '/');
    const isBigQueryTable = type === 'Tables' && entry.entrySource?.system?.toLowerCase() === 'bigquery';
    const gType = getGlossaryType(entry);

    if (isBigQueryTable) {
      const map: Record<string, number> = { overview: 0, aspects: 1, lineage: 2, dataProfile: 3, dataQuality: 4, insights: 5 };
      return map[tabName] ?? 0;
    }
    if (type === 'Datasets') {
      const map: Record<string, number> = { overview: 0, entryList: 1, aspects: 2 };
      return map[tabName] ?? 0;
    }
    if (gType === 'glossary' || gType === 'category') {
      const map: Record<string, number> = { overview: 0, categories: 1, terms: 2, aspects: 3 };
      return map[tabName] ?? 0;
    }
    if (gType === 'term') {
      const map: Record<string, number> = { overview: 0, linkedAssets: 1, synonyms: 2, aspects: 3 };
      return map[tabName] ?? 0;
    }
    // Default
    const map: Record<string, number> = { overview: 0, aspects: 1 };
    return map[tabName] ?? 0;
  };

  // Apply tabName from route state when the new entry finishes loading
  useEffect(() => {
    if (!tabNameApplied.current && initialTabName && entryStatus === 'succeeded' && entry) {
      setTabValue(resolveTabName(initialTabName));
      tabNameApplied.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryStatus, initialTabName, entry]);

  // Lineage tab with full Lineage component
  const lineageTab = <Lineage entry={displayEntry}/>;

  return (
    <div ref={scrollContainerRef} onScroll={handleScroll} style={{display: "flex", flexDirection: "column", padding: "0px 0", background:"#FFFFFF", height: "100%", overflowY: "auto" }}>
      {loading ? (
        <div style={{display: "flex", flexDirection: "row", gap: "1rem"}}>
          <div style={{display: "flex", flexDirection: "column", flex: 1, minWidth: 0}}>
            <Box sx={{ padding: "0px 20px", display: "flex", flexDirection: "column" }}>
              {/* Row 1: Title Bar Skeleton */}
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                padding: '20px 0px 0px 0px'
              }}>
                <Skeleton variant="circular" width={32} height={32} sx={{ flexShrink: 0 }} />
                <Skeleton variant="rounded" width={48} height={48} sx={{ borderRadius: '10px', flexShrink: 0 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <Skeleton variant="text" width={300} height={36} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Skeleton variant="rounded" width={70} height={22} sx={{ borderRadius: '8px' }} />
                      <Skeleton variant="rounded" width={60} height={22} sx={{ borderRadius: '8px' }} />
                      <Skeleton variant="rounded" width={55} height={20} sx={{ borderRadius: '8px' }} />
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Row 2: Description Skeleton */}
              <Box sx={{ padding: '12px 0px 0px 0px' }}>
                <Skeleton variant="text" width="80%" height={20} />
                <Skeleton variant="text" width="50%" height={20} />
              </Box>

              {/* Row 3: Tab Bar Skeleton */}
              <Box sx={{
                display: 'flex',
                gap: '24px',
                paddingBottom: '12px',
                borderBottom: '1px solid #E0E0E0'
              }}>
                <Skeleton variant="text" width={80} height={20} />
                <Skeleton variant="text" width={70} height={20} />
                <Skeleton variant="text" width={65} height={20} />
                <Skeleton variant="text" width={90} height={20} />
              </Box>

              {/* Row 5: Body - DetailPageOverview Skeleton */}
              <Box sx={{ paddingTop: '0px', paddingBottom: '2rem' }}>
                <DetailPageOverviewSkeleton />
              </Box>
            </Box>
          </div>
        </div>
      ) : (<>
                        {/* Fixed Header Container - sticky, direct child of scroll container */}
                        <div style={{
                            backgroundColor: '#ffffff',
                            zIndex: 1001,
                            position: "sticky",
                            top: 0,
                            paddingBottom: "12px",
                            boxShadow: isScrolled ? "0px 2px 4px rgba(0, 0, 0, 0.12)" : "none",
                            transition: "box-shadow 0.2s ease",
                        }}>

            {/* Primary Title Bar */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px 20px 0px 20px"
            }}>
                {/* Left Side - Back Arrow, Icon, Title, and Tags */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "20px"
                }}>
                    <IconButton
                        onClick={goBack}
                        sx={{
                            p: '4px',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            color: '#0B57D0',
                            transition: 'background-color 0.2s',
                            '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                        }}
                    >
                        <ArrowBack style={{fontSize: "24px"}} />
                    </IconButton>
                    {/* Entry Type Icon Block */}
                    <Box sx={{
                        width: "48px",
                        height: "48px",
                        background: "#EDF2FC",
                        border: "1px solid #E7F0FE",
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                    }}>
                        {(() => {
                            const rawType = displayEntry?.entryType?.split('-').length > 1
                                ? displayEntry.entryType.split('-').pop()!
                                : displayEntry?.name?.split('/').at(-2) ?? '';
                            const iconType = rawType.charAt(0).toUpperCase() + rawType.slice(1);
                            if (isGlossaryAssetType(iconType)) {
                                return getGlossaryMuiIcon(assetNameToGlossaryType(iconType), {
                                    size: '24px',
                                    color: '#4285F4',
                                });
                            }
                            return (
                                <Box
                                    component="img"
                                    src={getAssetIcon(iconType)}
                                    alt="Entry type icon"
                                    sx={{
                                        width: "24px",
                                        height: "24px",
                                        filter: "brightness(0) saturate(100%) invert(22%) sepia(85%) saturate(2867%) hue-rotate(220deg) brightness(92%) contrast(95%)"
                                    }}
                                />
                            );
                        })()}
                    </Box>
                    {/* Title and Tags Column */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
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
                                fontSize: "28px",
                                fontWeight: "400",
                                lineHeight: "36px",
                                maxWidth: '500px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}>
                                {displayEntry.entrySource.displayName.length > 0 ? displayEntry.entrySource.displayName : getName(displayEntry.name || '', '/')}
                            </label>
                            </Tooltip>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <Tag
                                    text={(() => { const sys = displayEntry.entrySource.system; if (!sys) return 'Custom'; const lower = sys.toLowerCase(); if (lower === 'dataplex universal catalog' || lower === 'dataplex') return 'Knowledge Catalog'; if (lower === 'bigquery') return 'BigQuery'; return sys.replace("_", " ").replace("-", " ").toLowerCase(); })()}
                                    css={{
                                        fontFamily: '"Google Sans", sans-serif',
                                        backgroundColor: '#C2E7FF',
                                        color: '#004A77',
                                        borderRadius: '8px',
                                        padding: '3px 8px',
                                        height: '22px',
                                        fontSize: '12px',
                                        fontWeight: '500',
                                        border: 'none',
                                        textTransform: 'capitalize',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        display: 'flex',
                                        letterSpacing: '0.1px'
                                    }}
                                />
                                <Tag
                                    text={(() => {
                                        const rawType = displayEntry?.entryType?.split('-').length > 1
                                            ? displayEntry.entryType.split('-').pop()!
                                            : displayEntry?.name?.split('/').at(-2) ?? '';
                                        return rawType.charAt(0).toUpperCase() + rawType.slice(1);
                                    })()}
                                    css={{
                                        fontFamily: '"Google Sans", sans-serif',
                                        backgroundColor: '#C2E7FF',
                                        color: '#004A77',
                                        borderRadius: '8px',
                                        padding: '3px 8px',
                                        height: '22px',
                                        fontSize: '12px',
                                        fontWeight: '500',
                                        border: 'none',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        display: 'flex',
                                        letterSpacing: '0.1px'
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - CTA Buttons */}
                <div style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px"
                }}>
                  {
                    displayEntry.entrySource?.system.toLowerCase() === 'bigquery' ? (<>
                        <Box
                              component="button"
                              disabled={!bigQueryLink}
                              onClick={() => bigQueryLink && window.open(bigQueryLink, '_blank')}
                              sx={{
                              background: "transparent",
                              border: "1px solid #DADCE0",
                              borderRadius: "100px",
                              cursor: bigQueryLink ? "pointer" : "not-allowed",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "8px",
                              padding: "10px 16px",
                              color: "#0B57D0",
                              fontFamily: '"Google Sans", sans-serif',
                              fontSize: "14px",
                              fontWeight: "500",
                              lineHeight: "20px",
                              whiteSpace: "nowrap",
                              transition: "background-color 0.2s ease",
                              opacity: bigQueryLink ? 1 : 0.5,
                              '&:hover': {
                                backgroundColor: bigQueryLink ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                              },
                          }}>
                              <img
                                  src="/assets/images/Product-Icons.png"
                                  alt="Open in BQ"
                                  style={{width: "20px", height: "20px"}}
                              />
                              Open in BigQuery
                        </Box>
                        <Box
                              component="button"
                              disabled={!lookerLink}
                              onClick={() => lookerLink && window.open(lookerLink, '_blank')}
                              sx={{
                              background: "transparent",
                              border: "1px solid #DADCE0",
                              borderRadius: "100px",
                              cursor: lookerLink ? "pointer" : "not-allowed",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "8px",
                              padding: "10px 16px",
                              color: "#0B57D0",
                              fontFamily: '"Google Sans", sans-serif',
                              fontSize: "14px",
                              fontWeight: "500",
                              lineHeight: "20px",
                              whiteSpace: "nowrap",
                              transition: "background-color 0.2s ease",
                              opacity: lookerLink ? 1 : 0.5,
                              '&:hover': {
                                backgroundColor: lookerLink ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                              },
                          }}>
                              <img
                                  src="/assets/images/looker.png"
                                  alt="Open in Looker"
                                  style={{width: "20px", height: "20px"}}
                              />
                              Explore in Looker
                        </Box>
                      </>
                    ):(<></>)
                  }
                </div>
              </div>
            {/* Close sticky header - only name slip stays sticky */}
            </div>

            {/* Flex row for content + preview sidebar */}
            <div style={{display: "flex", flexDirection: "row", gap: "2px"}}>
            <div style={{display: "flex", flexDirection: "column", flex: 1, minWidth: 0, overflow: 'hidden'}}>

              {/* Description Section with Show more/less */}
              <div style={{ padding: "16px 20px 0px", maxWidth: "800px" }}>
                {headerDescription ? (
                  <>
                    <div style={{
                        fontFamily: '"Google Sans", sans-serif',
                        fontSize: "14px",
                        lineHeight: "20px",
                        color: "#575757",
                        fontWeight: 400,
                        maxHeight: descriptionExpanded ? "none" : "60px",
                        overflow: "hidden",
                        position: "relative"
                    }}>
                        {headerDescription}
                    </div>
                    {headerDescription.length > 200 && (
                        <button
                            onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                            style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "6px 0px",
                                color: "#0B57D0",
                                fontFamily: '"Google Sans", sans-serif',
                                fontSize: "14px",
                                fontWeight: 500,
                                lineHeight: "20px"
                            }}
                        >
                            {descriptionExpanded ? <KeyboardArrowUp sx={{ fontSize: "20px" }} /> : <KeyboardArrowDown sx={{ fontSize: "20px" }} />}
                            {descriptionExpanded ? 'Show less' : 'Show more'}
                        </button>
                    )}
                  </>
                ) : (
                  <div style={{
                      fontFamily: '"Google Sans", sans-serif',
                      fontSize: "14px",
                      lineHeight: "20px",
                      color: "#575757",
                      fontWeight: 400,
                      fontStyle: "italic",
                  }}>
                      No description provided for this asset.
                  </div>
                )}
              </div>

              {/* Navigation Tab Bar */}
              <div style={{ paddingTop: "0px", marginTop: "0px" }}>
                <Box
                  sx={{
                    width: "100%",
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
                        fontFamily: '"Product Sans Regular", sans-serif',
                        fontSize: "14px",
                        color: "#575757",
                        textTransform: "none",
                        minHeight: "48px",
                        padding: "12px 20px 16px",
                        "&.Mui-selected": {
                          color: "#0B57D0",
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
                              <Tab key="dataQuality" label="Data Quality" {...tabProps(4)} />,
                              <Tab key="insights" label="Insights" {...tabProps(5)} />,
                            ] : getEntryType(displayEntry.name, '/') === 'Datasets' ? [
                              <Tab key="overview" label="Overview" {...tabProps(0)} />,
                              <Tab key="entryList" label="Entry List" {...tabProps(1)} />,
                              <Tab key="annotations" label="Aspects" {...tabProps(2)} />,
                              <Tab key="insights" label="Insights" {...tabProps(3)} />
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

           {/* Tab Content */}
            <div style={{paddingTop:"0px", marginTop:"0px", marginLeft: "20px", marginRight: "20px", paddingBottom: "2rem", borderTop: "1px solid #E0E0E0"}}>
                    <CustomTabPanel value={tabValue} index={0}>
                        {overviewTab}
                    </CustomTabPanel>
                    {getEntryType(entry.name, '/') === 'Tables' && entry.entrySource?.system.toLowerCase() === 'bigquery' ? (
                      <>
                        <CustomTabPanel value={tabValue} index={1}>
                            <AnnotationFilter
                              entry={displayEntry}
                              onFilteredEntryChange={setFilteredEntry}
                              sx={{width: "100%" }}
                              onCollapseAll={handleAnnotationCollapseAll}
                              onExpandAll={handleAnnotationExpandAll}
                            />
                            {annotationTab}
                        </CustomTabPanel>
                       <CustomTabPanel value={tabValue} index={2}>
                            {lineageTab}
                        </CustomTabPanel>
                        <CustomTabPanel value={tabValue} index={3}>
                            <DataProfile scanName={dpScanName} allScansStatus={allScansStatus} />
                        </CustomTabPanel>
                        <CustomTabPanel value={tabValue} index={4}>
                            <DataQuality scanName={dqScanName} allScansStatus={allScansStatus} />
                        </CustomTabPanel>
                        <CustomTabPanel value={tabValue} index={5}>
                            <TableInsights entry={entry} scanName={tableInsightsScanName} />
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
                              sx={{}}
                              onCollapseAll={handleAnnotationCollapseAll}
                              onExpandAll={handleAnnotationExpandAll}
                            />
                            {annotationTab}
                        </CustomTabPanel>
                        <CustomTabPanel value={tabValue} index={3}>
                            <TableInsights entry={entry} scanName={tableInsightsScanName} />
                        </CustomTabPanel>
                      </>
                    ) : glossaryType === 'glossary' || glossaryType === 'category' ? (
                      <>
                        <CustomTabPanel value={tabValue} index={1}>
                          {isGlossaryDataLoading ? (
                            <Box sx={{ height: '100%' }}>
                              <GlossariesCategoriesTermsSkeleton />
                            </Box>
                          ) : (
                            <Box sx={{ height: '100%' }}>
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
                            <Box sx={{ height: '100%' }}>
                              <GlossariesCategoriesTermsSkeleton />
                            </Box>
                          ) : (
                            <Box sx={{ height: '100%' }}>
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
                              sx={{}}
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
                            <Box sx={{ p: '0 20px 20px 20px', height: 'calc(100% - 40px)' }}>
                              <ShimmerLoader count={6} type="card" />
                            </Box>
                          ) : (
                            <Box sx={{ height: '100%', marginTop: '-10px' }}>
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
                            <Box sx={{ height: '100%' }}>
                              <GlossariesSynonymsSkeleton />
                            </Box>
                          ) : (
                            <Box sx={{ height: '100%' }}>
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
                              sx={{}}
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
                              sx={{}}
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
        </div>
      {/* Asset Preview Panel - Sticky Sidebar */}
      <Box
        sx={{
          width: isAssetPreviewOpen ? "clamp(300px, 22vw, 360px)" : "0px",
          minWidth: isAssetPreviewOpen ? "clamp(300px, 22vw, 360px)" : "0px",
          height: "calc(100vh - 180px)",
          position: "sticky",
          top: "80px",
          marginTop: "10px",
          borderRadius: "20px",
          backgroundColor: "#fff",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transition: "width 0.3s ease-in-out, min-width 0.3s ease-in-out, opacity 0.3s ease-in-out",
          opacity: isAssetPreviewOpen ? 1 : 0,
          marginRight: isAssetPreviewOpen ? "16px" : 0,
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
      </>
      )}
    </div>
  )
}

export default ViewDetails;