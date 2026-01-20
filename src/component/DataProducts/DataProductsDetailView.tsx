import React, { useEffect, useState } from 'react'
import { Box, Button, Paper, Skeleton, Tab, Tabs, Typography } from '@mui/material'
import { ArrowBack } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import CustomTabPanel from '../TabPanel/CustomTabPanel'
import PreviewAnnotation from '../Annotation/PreviewAnnotation'
import AnnotationFilter from '../Annotation/AnnotationFilter'
import type { AppDispatch } from '../../app/store'
import { useAuth } from '../../auth/AuthProvider'
import { getEntryType, hasValidAnnotationData  } from '../../utils/resourceUtils'
import { fetchDataProductsAssetsList, fetchDataProductsList } from '../../features/dataProducts/dataProductsSlice'
import Assets from './Assets'
import AccessGroup from './AccessGroup'
import Contract from './Contract'
import DataProductOverviewNew from './DataProductOverviewNew'
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

const DataProductsDetailView = () => {
  const { user } = useAuth();
  const {
    dataProductsItems, 
    status, 
    selectedDataProductDetails, 
    selectedDataProductStatus
} = useSelector((state: any) => state.dataProducts);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [sortBy, setSortBy] = useState<'name' | 'lastModified'>('name');
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [dataProductsList, setDataProductsList] = useState<any>([]);
  const [selectedDataProduct, setSelectedDataProduct] = useState<any>({});
  const [tabValue, setTabValue] = React.useState(0);
  const [expandedAnnotations, setExpandedAnnotations] = useState<Set<string>>(new Set());
  const [filteredEntry, setFilteredEntry] = useState<any>(null);
    

  const handleAnnotationCollapseAll = () => {
    console.log(filteredEntry, sortAnchorEl, dataProductsList, selectedDataProduct);
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
    // if (selectedDataProductDetails.length === 0 && selectedDataProductStatus === 'idle' && user?.token) {
    //    dispatch(getDataProductDetails({ id_token: user?.token, dataProductId: selectedDataProductDetails.name }));
    // }
    if(selectedDataProductStatus=== 'succeeded'){
        console.log("Selected Data Product Details", selectedDataProductDetails);
        setSelectedDataProduct(selectedDataProductDetails);
        dispatch(fetchDataProductsAssetsList({ id_token: user?.token, dataProductId: selectedDataProductDetails.name }));
    }
  }, [dispatch, selectedDataProductDetails.length, selectedDataProductStatus, user?.token]);

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
    entry={selectedDataProductDetails} 
    css={{width:"100%", borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px', marginRight: '8px'}} 
    isTopComponent={true} 
    expandedItems={expandedAnnotations}
    setExpandedItems={setExpandedAnnotations}
  />;
  
  let overviewTab = <DataProductOverviewNew entry={selectedDataProductDetails} entryType={'data-product'} css={{width:"100%"}} />;//<DataProductOverview entry={selectedDataProductDetails} css={{width:"100%"}} />;
  let assetsTab = <Assets entry={selectedDataProductDetails} css={{width:"100%"}} />;
  let accessGroupTab = <AccessGroup entry={selectedDataProductDetails} css={{width:"100%"}} />;
  let contractTab = <Contract entry={selectedDataProductDetails} css={{width:"100%"}} />;

 


  return selectedDataProductStatus == 'succeeded' ? (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'flex-start', 
      px: 3,
      pb: 3,
      pt: '8px',
      backgroundColor: '#F8FAFD', 
      height: 'calc(100vh - 64px)',
      width: '100%',
      overflow: 'hidden'
    }}>
      <Paper 
        elevation={0} 
        sx={{ 
          flex: 1,
          height: 'calc(100vh - 110px)',
          borderRadius: '24px', 
          backgroundColor: '#fff', 
          border: 'transparent',
          display: 'flex', 
          flexDirection: 'column', 
          overflowY: 'auto',
          overflowX: 'hidden',
          position: 'relative'
        }}
      >
        <Box 
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap:2, position: 'relative', top: '20px', left: '20px' }}>
                <Button
                    sx={{ minWidth: "auto", p: 0.5, mr: 0.5, color: "#5f6368" }}
                    onClick={() => {
                        navigate(-1);
                    }}
                >
                    <ArrowBack fontSize="small" />
                </Button>
                <img 
                    src={selectedDataProductDetails.iconUrl || '/assets/images/data-product-card.png'} 
                    alt={selectedDataProductDetails.entrySource?.displayName} 
                    style={{ width: '40px', height: '40px'}} 
                />
                <Typography variant="h5" sx={{ fontFamily: '"Google Sans", sans-serif', fontWeight: 400, fontSize: '22px', lineHeight: '24px', color: '#1F1F1F', maxWidth: 'calc(100% - 400px)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedDataProductDetails.entrySource?.displayName}
                </Typography>
                <Box
                    sx={{
                        alignSelf: 'flex-end',
                        marginLeft: 'auto'}}>
                    {/* <CTAButton
                        //disabled={!viewDetailAccessable}
                        handleClick={() => {}}
                        text="Request Access"
                        css={{
                        fontFamily: '"Google Sans Text", sans-serif',
                        backgroundColor: '#0E4DCA',
                        color: '#FFFFFF',
                        borderRadius: '6.25rem',
                        padding: '1rem',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        // letterSpacing: '0.71px',
                        border: 'none',
                        height: '2.1rem',
                        maxWidth: '25rem',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textTransform: 'none',
                        flex: '0 0 auto',
                        }}
                    /> */}
                </Box>
            </Box>

            {/* Navigation tabs */}
            <div style={{ paddingTop: "10px", marginTop: "20px" }}>
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
                            <Tab key="overview" label="Overview" {...tabProps(0)} />
                            <Tab key="assets" label="Assets" {...tabProps(1)} />
                            <Tab key="accessGroup&Permission" label="Access Group & Permission" {...tabProps(2)} />
                            <Tab key="contract" label="Contract" {...tabProps(3)} />
                            <Tab key="annotations" label="Aspects" {...tabProps(4)} />
                            
                        </Tabs>
                    </Box>
                </Box>
            </div>

            {/* Tab Panels */}
            {/* Tab Content - Non-sticky */}
                        <div style={{paddingTop:"0px", marginTop:"0px", marginLeft: "2.5rem", marginRight: "2rem"}}>
                                <CustomTabPanel value={tabValue} index={0}>
                                    {overviewTab}
                                </CustomTabPanel>
                                <CustomTabPanel value={tabValue} index={1}>
                                    {/* Assets Tab Content */}
                                    {assetsTab}
                                </CustomTabPanel>
                                <CustomTabPanel value={tabValue} index={2}>
                                    {/* access group Tab Content */}
                                    {accessGroupTab}
                                </CustomTabPanel>
                                <CustomTabPanel value={tabValue} index={3}>
                                    {/* contract Tab Content */}
                                    {contractTab}
                                </CustomTabPanel>
                                <CustomTabPanel value={tabValue} index={4}>
                                    <AnnotationFilter
                                        entry={selectedDataProductDetails}
                                        onFilteredEntryChange={setFilteredEntry}
                                        sx={{width: "100%", marginTop: '1.25rem' }}
                                        onCollapseAll={handleAnnotationCollapseAll}
                                        onExpandAll={handleAnnotationExpandAll}
                                    />
                                    {annotationTab}
                                </CustomTabPanel>
                      </div>
           
        </Box>
        </Paper>
    </Box>
  ):(<Box sx={{ padding: "0px 20px" }}>
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
          </Box>);
}

export default DataProductsDetailView;