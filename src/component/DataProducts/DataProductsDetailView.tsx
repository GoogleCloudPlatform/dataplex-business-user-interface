import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Box, IconButton, Skeleton, Tab, Tabs, Tooltip } from '@mui/material'
import { ArrowBack, KeyboardArrowUp, KeyboardArrowDown, LockOutlined } from '@mui/icons-material'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import CustomTabPanel from '../TabPanel/CustomTabPanel'
import PreviewAnnotation from '../Annotation/PreviewAnnotation'
import AnnotationFilter from '../Annotation/AnnotationFilter'
import type { AppDispatch } from '../../app/store'
import { useAuth } from '../../auth/AuthProvider'
import { getEntryType, getMimeType, getName, hasValidAnnotationData  } from '../../utils/resourceUtils'
import { fetchDataProductsAssetsList, fetchDataProductsList, getDataProductDetails, setDataProductsDetailTabValue } from '../../features/dataProducts/dataProductsSlice'
import Assets from './Assets'
import AccessGroup from './AccessGroup'
import Contract from './Contract'
import DataProductOverviewNew from './DataProductOverviewNew'
import SubmitAccess from '../SearchPage/SubmitAccess'
import NotificationBar from '../SearchPage/NotificationBar'
import { useAccessRequest } from '../../contexts/AccessRequestContext'
import ResourcePreview from '../Common/ResourcePreview'
import { fetchEntry, clearHistory } from '../../features/entry/entrySlice'
import { useNotification } from '../../contexts/NotificationContext'
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

// //interface for the component props
interface DataProductsDetailViewProps {
  //css?: React.CSSProperties; // Optional CSS properties for the button
  onRequestAccess?: (entry: any) => void;
}

// Tab component
const DataProductsDetailView: React.FC<DataProductsDetailViewProps> = ({ onRequestAccess }) => {

  const { user } = useAuth();
  const {
        dataProductsItems, 
        status, 
        selectedDataProductDetails, 
        selectedDataProductStatus,
        selectedDataProductError
    } = useSelector((state: any) => state.dataProducts);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dataProductIdFromUrl = searchParams.get('dataProductId');
  const dispatch = useDispatch<AppDispatch>();
  const { showError } = useNotification();

  const { setAccessPanelOpen } = useAccessRequest();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [sortBy, setSortBy] = useState<'name' | 'lastModified'>('name');
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [dataProductsList, setDataProductsList] = useState<any>([]);
  const tabValue = (useSelector((state: any) => state.dataProducts.detailTabValue) ?? 0) as number;
  const setTabValue = (val: number) => dispatch(setDataProductsDetailTabValue(val));
  const [expandedAnnotations, setExpandedAnnotations] = useState<Set<string>>(new Set());
  const [filteredEntry, setFilteredEntry] = useState<any>(null);
  const [isSubmitAccessOpen, setIsSubmitAccessOpen] = useState<boolean>(false);
  const [isNotificationVisible, setIsNotificationVisible] = useState<boolean>(false);
  const [notificationMessage, setNotificationMessage] = useState<string>('');
  const [assetPreviewData, setAssetPreviewData] = useState<any | null>(null);
  const [isAssetPreviewOpen, setIsAssetPreviewOpen] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const id_token = user?.token || '';

  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      setIsScrolled(scrollContainerRef.current.scrollTop > 0);
    }
  }, []);


  let selectedDataProduct = localStorage.getItem('selectedDataProduct') ? 
  JSON.parse(localStorage.getItem('selectedDataProduct') || '{}') : {};

  let accessGroups = selectedDataProduct ? (selectedDataProduct?.accessGroups || {}): {};
    const handleResourceClick = (id: string) => {
      dispatch(clearHistory());
  
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
      navigate('/view-details');
    };
    
    
    
    

  const handleAnnotationCollapseAll = () => {
    console.log(filteredEntry, sortAnchorEl, dataProductsList);
    setSearchTerm(searchTerm);
    setSortOrder(sortOrder);
    setSortBy(sortBy);
    setSortAnchorEl(sortAnchorEl);
    setExpandedAnnotations(new Set());
  };
  
  const handleAnnotationExpandAll = () => {
    if (selectedDataProductDetails?.aspects) {
    const number = getEntryType(selectedDataProductDetails.name, '/');
    const annotationKeys = Object.keys(selectedDataProductDetails.aspects)
        .filter(key =>
        key !== `${number}.global.schema` &&
        key !== `${number}.global.overview` &&
        key !== `${number}.global.contacts` &&
        key !== `${number}.global.usage`
        )
        .filter(key => hasValidAnnotationData(selectedDataProductDetails.aspects![key])); // Only expand those with data
    setExpandedAnnotations(new Set(annotationKeys));
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    console.log("Tab changed to:", event);
    setIsAssetPreviewOpen(false);
    setAssetPreviewData(null);
    setTabValue(newValue);
  };


const tabProps = (index: number)  => {
    return {
        id: `tab-${index}`,
        'aria-controls': `tabpanel-${index}`,
    };
}

  useEffect(() => {
    if (dataProductsItems.length === 0 && status === 'idle' && user?.token) {
       dispatch(fetchDataProductsList({ id_token: user?.token }));
    }
    if(status=== 'succeeded'){
        setDataProductsList(dataProductsItems);
    }
  }, [dispatch, dataProductsItems.length, status, user?.token]);

    useEffect(() => {
    if (selectedDataProductStatus === 'idle' && dataProductIdFromUrl && user?.token) {
      dispatch(getDataProductDetails({ id_token: user.token, dataProductId: dataProductIdFromUrl }));
    }
    }, [dispatch, selectedDataProductStatus, dataProductIdFromUrl, user?.token]);

    useEffect(() => {
    if(selectedDataProductStatus=== 'succeeded'){
        console.log("Selected Data Product Details", selectedDataProductDetails);
        dispatch(fetchDataProductsAssetsList({ id_token: user?.token, dataProductId: selectedDataProductDetails.name }));
    }

    if(selectedDataProductStatus === 'failed'){
        console.log("Error fetching selected data product details", selectedDataProductError);
        showError(`Error fetching data product details: ${selectedDataProductError}`, 5000);
        setTimeout(() => {
          //setIsNotificationVisible(false);
          navigate('/data-products');
        }, 2000);
    }
  }, [dispatch, selectedDataProductDetails.length, selectedDataProductStatus, user?.token]);

  // Effects
    // Sync local panel state with global context
    useEffect(() => {
      setAccessPanelOpen(isSubmitAccessOpen);
    }, [isSubmitAccessOpen, setAccessPanelOpen]);

    const handleCloseSubmitAccess = () => {
    setIsSubmitAccessOpen(false);
  };

  const handleSubmitSuccess = (_assetName: string) => {
    setIsSubmitAccessOpen(false);
    setNotificationMessage(`Request sent`);
    setIsNotificationVisible(true);
    
    // Auto-hide notification after 5 seconds
    setTimeout(() => {
      setIsNotificationVisible(false);
    }, 5000);
  };

  const handleCloseNotification = () => {
    setIsNotificationVisible(false);
  };

  //sorting handlers
//   const handleSortMenuClick = (event: React.MouseEvent<HTMLElement>) => {
//     setSortAnchorEl(event.currentTarget);
//   };
  
//   const handleSortMenuClose = () => {
//     setSortAnchorEl(null);
//   };
  
//   const handleSortOptionSelect = (option: 'name' | 'lastModified') => {
//     setSortBy(option);
//     setSortOrder(prevOrder => prevOrder === 'asc' ? 'desc' : 'asc');
//     setDataProductsList(sortItems(dataProductsList));
//     handleSortMenuClose();
//   };

  const sortItems = (items: any[]) => {
    return [...items].sort((a, b) => {
      if (sortBy === 'name') {
          const nameA = a.displayName.toLowerCase();
          const nameB = b.displayName.toLowerCase();
          if (sortOrder === 'asc') return nameA.localeCompare(nameB);
          return nameB.localeCompare(nameA);
      } else {
          // Last Modified (Number)
          const dateA = a.updateTime || 0;
          const dateB = b.updateTime || 0;
          if (sortOrder === 'asc') return dateA - dateB; // Oldest first
          return dateB - dateA; // Newest first
      }
    });
  };

  useEffect(() => {
    if (dataProductsItems.length > 0) {
      setDataProductsList(sortItems(
        dataProductsItems.filter((item:any) => {
            // The includes() method is case-sensitive. Use .toLowerCase() for case-insensitive search.
            return item.displayName.toLowerCase().includes(searchTerm);
        })
      ));
    }
  }, [searchTerm]);


  let annotationTab = <PreviewAnnotation
    entry={filteredEntry || selectedDataProductDetails}
    css={{width:"100%", borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px', borderTopLeftRadius: '0px', borderTopRightRadius: '0px', marginRight: '8px'}}
    isTopComponent={true} 
    expandedItems={expandedAnnotations}
    setExpandedItems={setExpandedAnnotations}
  />;
  
  let overviewTab = <DataProductOverviewNew entry={selectedDataProductDetails} entryType={'data-product'} css={{width:"100%"}} />;
  let assetsTab = <Assets 
    entry={selectedDataProductDetails} css={{width:"100%"}} 
    onAssetPreviewChange={(data) => {
        setAssetPreviewData(data);
        setIsAssetPreviewOpen(!!data);
    }}
  />;
  let accessGroupTab = <AccessGroup entry={selectedDataProductDetails} css={{width:"100%"}} />;
  let contractTab = <Contract entry={selectedDataProductDetails} css={{width:"100%"}} />;


  const handleRequestAccess = (data: any) => {
    if (onRequestAccess) {
      onRequestAccess(data);
    } else {
      setIsSubmitAccessOpen(true);
    }
  };

 


  const headerDescription = selectedDataProductDetails?.entrySource?.description || '';

  return selectedDataProductStatus == 'succeeded' ? (
    <div ref={scrollContainerRef} onScroll={handleScroll} style={{display: "flex", flexDirection: "column", padding: "0px 0", background:"#FFFFFF", height: "100%", overflowY: "auto" }}>
      {/* Primary Title Bar - sticky, direct child of scroll container */}
      <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 20px 12px 20px",
          position: "sticky",
          top: 0,
          backgroundColor: "#ffffff",
          zIndex: 1001,
          boxShadow: isScrolled ? "0px 2px 4px rgba(0, 0, 0, 0.12)" : "none",
          transition: "box-shadow 0.2s ease",
      }}>
          {/* Left Side - Back Arrow, Icon, Title, and Tags */}
          <div style={{
              display: "flex",
              alignItems: "center",
              gap: "20px"
          }}>
              <IconButton
                  onClick={() => { navigate(-1); }}
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
              {/* Product Image */}
              <img
                  src={selectedDataProduct.icon ? `data:${getMimeType(selectedDataProduct.icon)};base64,${selectedDataProduct.icon}` : '/assets/images/data-product-card.png'}
                  alt={selectedDataProductDetails.entrySource?.displayName}
                  style={{ width: '48px', height: '48px', border: '1.25px solid #FFFFFF', borderRadius: '8px' }}
              />
              {/* Title and Tags Column */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
                      <Tooltip
                        title={
                          selectedDataProductDetails.entrySource?.displayName?.length > 0
                          ? selectedDataProductDetails.entrySource.displayName
                          : getName(selectedDataProductDetails.name || '', '/')
                        }
                        arrow placement='top'
                      >
                      <label style={{
                          fontFamily: '"Google Sans", sans-serif',
                          color: "#1F1F1F",
                          fontSize: "28px",
                          fontWeight: "400",
                          lineHeight: "36px",
                      }}>
                          {selectedDataProductDetails.entrySource?.displayName?.length > 0 ? selectedDataProductDetails.entrySource.displayName : getName(selectedDataProductDetails.name || '', '/')}
                      </label>
                      </Tooltip>
                  </div>
              </div>
          </div>
      </div>

      <div style={{display: "flex", flexDirection: "row", gap: "2px"}}>
        <div style={{display: "flex", flexDirection: "column", flex: 1, minWidth: 0}}>
          <div style={{padding:"0px 0rem", display: "flex", flexDirection: "column"}}>
            {/* Header Container */}
            <div style={{
                flexShrink: 0,
                backgroundColor: '#ffffff',
                zIndex: 1000,
            }}>

              {/* Description Section */}
              <div style={{ padding: "8px 20px 0px", maxWidth: "800px" }}>
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
                      No description provided for this data product.
                  </div>
                )}
              </div>

              {/* Request Access Button - below description, left-aligned */}
              <div style={{ padding: "12px 20px 0px" }}>
                  <Box
                      component="button"
                      data-testid="cta-button"
                      onClick={() => {handleRequestAccess(selectedDataProductDetails)}}
                      sx={{
                        fontFamily: '"Google Sans", sans-serif',
                        backgroundColor: '#0B57D0',
                        color: '#FFFFFF',
                        borderRadius: '100px',
                        padding: '10px 16px',
                        fontSize: '14px',
                        fontWeight: '500',
                        border: 'none',
                        height: '40px',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textTransform: 'none',
                        gap: '8px',
                        width: 'fit-content',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease',
                        '&:hover': { backgroundColor: '#1A5CD8' },
                      }}
                  >
                      <LockOutlined style={{ fontSize: "18px" }} />
                      Request Access
                  </Box>
              </div>

              {/* Navigation Tab Bar */}
              <div style={{ paddingTop: "12px", marginTop: "0px" }}>
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
                          color: "#0E4DCA",
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
                          borderTop: "3px solid #0E4DCA",
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
                            <Tab key="overview" label="Overview" {...tabProps(0)} />
                            <Tab key="assets" label="Assets" {...tabProps(1)} />
                            <Tab key="accessGroup&Permission" label="Access Groups & Permissions" {...tabProps(2)} />
                            <Tab key="contract" label="Contract" {...tabProps(3)} />
                            <Tab key="annotations" label="Aspects" {...tabProps(4)} />
                        </Tabs>
                    </Box>
                </Box>
              </div>
            </div>

            {/* Tab Content - Scrollable */}
            <div style={{paddingTop:"0px", marginTop:"0px", marginLeft: "20px", marginRight: "20px", paddingBottom: "2rem", borderTop: "1px solid #E0E0E0"}}>
                    <CustomTabPanel value={tabValue} index={0}>
                        {overviewTab}
                    </CustomTabPanel>
                    <CustomTabPanel value={tabValue} index={1}>
                        <div style={{ marginLeft: "-20px", marginRight: "-20px", marginTop: "-10px" }}>
                          {assetsTab}
                        </div>
                    </CustomTabPanel>
                    <CustomTabPanel value={tabValue} index={2}>
                        {accessGroupTab}
                    </CustomTabPanel>
                    <CustomTabPanel value={tabValue} index={3}>
                        {contractTab}
                    </CustomTabPanel>
                    <CustomTabPanel value={tabValue} index={4}>
                        <AnnotationFilter
                            entry={selectedDataProductDetails}
                            onFilteredEntryChange={setFilteredEntry}
                            sx={{width: "100%" }}
                            onCollapseAll={handleAnnotationCollapseAll}
                            onExpandAll={handleAnnotationExpandAll}
                        />
                        {annotationTab}
                    </CustomTabPanel>
            </div>
          </div>

        {/* Backdrop Overlay */}
        {selectedDataProductStatus == 'succeeded' && isSubmitAccessOpen && (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1200,
              cursor: 'pointer',
              animation: 'fadeIn 0.3s ease-in-out',
              '@keyframes fadeIn': {
                from: { opacity: 0 },
                to: { opacity: 1 }
              }
            }}
            onClick={handleCloseSubmitAccess}
          />
        )}

        {/* Submit Access Panel */}
        {selectedDataProductStatus == 'succeeded' && selectedDataProductDetails && (<SubmitAccess
          isOpen={isSubmitAccessOpen}
          onClose={handleCloseSubmitAccess}
          assetName={selectedDataProductDetails?.entrySource?.displayName?.length > 0 ? selectedDataProductDetails?.entrySource?.displayName : getName(selectedDataProductDetails.name || '', '/')}
          entry={selectedDataProductDetails}
          onSubmitSuccess={handleSubmitSuccess}
          previewData={selectedDataProductDetails ?? null}
          isLookup={true}
          isCalledFromDataProducts={true}
          dataProductsDescription={selectedDataProductDetails?.entrySource?.description || ''}
          assetCounts={selectedDataProduct.assetCount || 0}
          accessGroups={Object.values(accessGroups) || []}
        />)}

        {/* Notification Bar */}
        <NotificationBar
          isVisible={isNotificationVisible}
          onClose={handleCloseNotification}
          message={notificationMessage}
        />
      </div>

      {/* Asset Preview Panel - Sticky Sidebar */}
      <Box
        sx={{
          width: isAssetPreviewOpen ? "clamp(300px, 22vw, 360px)" : "0px",
          minWidth: isAssetPreviewOpen ? "clamp(300px, 22vw, 360px)" : "0px",
          height: "calc(100vh - 160px)",
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
            setIsAssetPreviewOpen(false);
            setAssetPreviewData(null);
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
  ):(
    <div style={{display: "flex", flexDirection: "column", padding: "0px 0", background:"#FFFFFF", height: "100vh", overflow: "hidden" }}>
      <Box sx={{ padding: "0px 20px", display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
        {/* Row 1: Title Bar Skeleton */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          padding: '20px 0px 0px 0px'
        }}>
          <Skeleton variant="circular" width={32} height={32} sx={{ flexShrink: 0 }} />
          <Skeleton variant="rounded" width={48} height={48} sx={{ borderRadius: '8px', flexShrink: 0 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <Skeleton variant="text" width={300} height={36} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Skeleton variant="rounded" width={120} height={22} sx={{ borderRadius: '8px' }} />
                <Skeleton variant="rounded" width={55} height={20} sx={{ borderRadius: '8px' }} />
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Row 2: Description Skeleton */}
        <Box sx={{ padding: '20px 0px 0px 0px' }}>
          <Skeleton variant="text" width="80%" height={20} />
          <Skeleton variant="text" width="50%" height={20} />
        </Box>

        {/* Row 3: Request Access Button Skeleton */}
        <Box sx={{ padding: '20px 0px 0px 0px' }}>
          <Skeleton variant="rounded" width={164} height={40} sx={{ borderRadius: '100px' }} />
        </Box>

        {/* Row 4: Tab Bar Skeleton */}
        <Box sx={{
          display: 'flex',
          gap: '24px',
          paddingBottom: '12px',
          borderBottom: '1px solid #E0E0E0'
        }}>
          <Skeleton variant="text" width={80} height={20} />
          <Skeleton variant="text" width={50} height={20} />
          <Skeleton variant="text" width={170} height={20} />
          <Skeleton variant="text" width={65} height={20} />
          <Skeleton variant="text" width={55} height={20} />
        </Box>

        {/* Row 6: Body Skeleton */}
        <Box sx={{ paddingTop: '20px', flex: 1, overflowY: 'auto', minHeight: 0, paddingBottom: '2rem' }}>
          <Skeleton variant="rounded" width="100%" height={400} sx={{ borderRadius: '12px' }} />
        </Box>
      </Box>
    </div>
  );
}

export default DataProductsDetailView;