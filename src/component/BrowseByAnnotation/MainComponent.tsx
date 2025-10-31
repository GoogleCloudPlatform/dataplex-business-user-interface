import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent,
  Select,
  MenuItem,
  FormControl,
  Avatar,
  CircularProgress
} from '@mui/material';
import { Grid } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { AppDispatch } from '../../app/store';
import { browseResourcesByAspects } from '../../features/resources/resourcesSlice';
import { useDispatch, useSelector } from 'react-redux';
import ResourceViewer from '../Common/ResourceViewer';
import ResourcePreview from '../Common/ResourcePreview';
import { typeAliases } from '../../utils/resourceUtils';

/**
 * @file MainComponent.tsx
 * @summary Renders the main content panel for the "Browse by Aspect" (Annotation) page.
 *
 * @description
 * This component is responsible for displaying the hierarchical content of the
 * "Browse by Aspect" feature. Its UI changes based on user selection,
 * progressing through three distinct levels, which are controlled by the `selectedCard`
 * and `selectedSubItem` props.
 *
 * 1.  **Main View (`selectedCard` is null):** Renders `renderMainView`. This
 * displays a grid of top-level aspect categories (from `annotationsData`).
 * Clicking a category card invokes the `onItemClick` callback.
 *
 * 2.  **Detail View (`selectedCard` is set, `selectedSubItem` is null):**
 * Renders `renderCardDetailView`. This displays a "Back" button and a grid
 * of sub-items (e.g., specific fields) for the selected aspect. This view
 * includes sorting options (Relevance, Name, Assets). Clicking a sub-item
 * card invokes the `onSubItemClick` callback.
 *
 * 3.  **Resource View (`selectedSubItem` is set):** Renders `renderSubItemView`.
 * This view is the final level, displaying the actual data assets (resources)
 * that match the selected aspect and sub-item. It uses the `ResourceViewer`
 * component to show a paginated list of results. This view also manages a
 * two-column layout, showing a `ResourcePreview` panel when an asset is
 * clicked.
 *
 * The component is responsible for dispatching the `browseResourcesByAspects`
 * Redux action to fetch the list of resources when a sub-item is selected.
 * It also manages all pagination state and logic for the `ResourceViewer`.
 *
 * @param {object} props - The props for the MainComponent.
 * (Note: The interface is named `SideNavProps` in the file).
 *
 * @param {any} props.selectedCard - The currently selected top-level aspect
 * category object, passed from the parent.
 * @param {function} props.onItemClick - Callback function to update the
 * parent's `selectedCard` state (e.g., on-click or 'Back' press).
 * @param {any} props.selectedSubItem - The currently selected sub-item object,
 * passed from the parent.
 * @param {function} props.onSubItemClick - Callback function to update the
 * parent's `selectedSubItem` state.
 * @param {any[]} props.annotationsData - An array of all top-level aspect
 * category objects to display in the main view.
 *
 * @returns {JSX.Element} The rendered React component, which conditionally
 * displays one of the three hierarchical views.
 */

interface SideNavProps {
  selectedCard:any;
  onItemClick: any | (() => void);
  selectedSubItem: any;
  onSubItemClick: any | (() => void);
  annotationsData: any[];
}

const MainComponent: React.FC<SideNavProps> = ({ selectedCard, onItemClick, selectedSubItem, onSubItemClick, annotationsData}) => {

  // Function to generate consistent colors based on text
  const generateAvatarColor = (text: string) => {
    const colors = [
      { bg: '#E3F2FD', text: '#1565C0' }, // Light Blue
      { bg: '#F3E5F5', text: '#7B1FA2' }, // Light Purple
      { bg: '#E8F5E8', text: '#2E7D32' }, // Light Green
      { bg: '#FFF3E0', text: '#F57C00' }, // Light Orange
      { bg: '#FCE4EC', text: '#C2185B' }, // Light Pink
      { bg: '#E0F2F1', text: '#00695C' }, // Light Teal
      { bg: '#F1F8E9', text: '#558B2F' }, // Light Lime
      { bg: '#FFF8E1', text: '#F9A825' }, // Light Yellow
      { bg: '#FFEBEE', text: '#D32F2F' }, // Light Red
      { bg: '#E8EAF6', text: '#303F9F' }, // Light Indigo
    ];
    
    // Simple hash function to get consistent color for same text
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  // Function to get first letter of title
  const getFirstLetter = (title: string) => {
    return title.charAt(0).toUpperCase();
  };

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const id_token = useSelector((state:any) => state.user.token);

  //const [selectedCard, setSelectedCard] = useState<any | null>(null);
  const [sortBy, setSortBy] = useState('relevance');
  const resources = useSelector((state: any) => state.resources.items);
  const resourcesStatus = useSelector((state: any) => state.resources.status);
  const error = useSelector((state: any) => state.resources.error);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'table'>('list');
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [startIndex, setStartIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(20);
  const [pageNumber, setPageNumber] = useState<number>(1);

  useEffect(() => {
    // Only search if there's a search term and no existing results
    //if (resources.length === 0) {
      //setPageSize(20);
      setPageNumber(1);
      setStartIndex(0);
      // Clear previous search results in the store
      dispatch({ type: 'resources/setItemsPreviousPageRequest', payload: null });
      dispatch({ type: 'resources/setItemsPageRequest', payload: null });
      dispatch({ type: 'resources/setItemsStoreData', payload: [] });   
    //}
  }, []);

  useEffect(() => {
    if(resourcesStatus === 'succeeded' || resourcesStatus === 'failed'){
      dispatch({ type: 'resources/setItemsNextPageSize', payload: null });
    }
  }, [resourcesStatus]);

  // Pagination state
  const resourcesTotalSize = useSelector((state: any) => state.resources.totalItems);
  const resourcesRequestData = useSelector((state: any) => state.resources.itemsRequestData);
  const requestItemStore = useSelector((state: any) => state.resources.itemsStore);
  
  // Pagination handler
    const handlePagination = (direction: 'next' | 'previous', size: number, sizeChange:boolean = false) => {
      if (!resourcesRequestData) return;
      let requestResourceData = { ...resourcesRequestData };
      if (sizeChange){
        setStartIndex(0);
        setPageNumber(1);
        setPageSize(size);
      }
  
      if (direction === 'next') {
        if (requestItemStore.length > 0){
          console.log("page number", pageNumber);
          const start = sizeChange ? 0 : size * pageNumber;
          setPageNumber(pageNumber + 1);
          setStartIndex(start);
          const paginatedItems = start + size <= requestItemStore.length 
          ? requestItemStore.slice(start, start + size) : requestItemStore.slice(start);
          console.log(requestItemStore);
          if(paginatedItems.length === size || ((start + size) >= resourcesTotalSize && requestItemStore.length === resourcesTotalSize)){
            dispatch({ type: 'resources/setItemsStatus', payload: 'loading' });
            dispatch({ type: 'resources/setItems', payload: paginatedItems });
          }else if(requestResourceData != null){
            requestResourceData.pageSize = (start + size) - requestItemStore.length;
            console.log("r", requestItemStore);
            dispatch({ type: 'resources/setItemsNextPageSize', payload: size });
            dispatch(browseResourcesByAspects({ requestResourceData: requestResourceData, id_token: id_token }));
          }else{
            console.log('data loaded');
          }
        }
      } else if (direction === 'previous') {
        if (requestItemStore.length > 0){
          dispatch({ type: 'resources/setItemsStatus', payload: 'loading' });
          const start = sizeChange ? 0 : Math.max(0, size * (pageNumber - 2));
          setPageNumber(Math.max(1, pageNumber - 1));
          setStartIndex(start);
          const paginatedItems = requestItemStore.slice(start, start + size);
          dispatch({ type: 'resources/setItems', payload: paginatedItems });
        }
      }
    };

  useEffect(() => {
    if (selectedCard && selectedSubItem) {
      console.log(`Selected Card:`, selectedCard);
      console.log(`Selected SubItem:`, selectedSubItem);
      dispatch({ type: 'resources/setItemsPreviousPageRequest', payload: null });
      dispatch({ type: 'resources/setItemsPageRequest', payload: null });
      dispatch({ type: 'resources/setItemsStoreData', payload: [] });
      dispatch(browseResourcesByAspects({term : '', id_token: id_token, annotationName : selectedCard.title, subAnnotationName: selectedSubItem.title || null}));
    }else if(selectedCard){
      dispatch(browseResourcesByAspects({term : '', id_token: id_token, annotationName : selectedCard.title, subAnnotationName: selectedSubItem?.title || null}));
    }
    setIsPreviewOpen(false);
  }, [selectedCard, selectedSubItem]);


  

  const handleCardClick = (cardData: any) => {
    onItemClick(cardData);
  };

  const handleBackClick = () => {
    onItemClick(selectedSubItem ? selectedCard : null);
    onSubItemClick(null); // Clear selected subItem when going back
  };

  const handleSortChange = (event:any) => {
    setSortBy(event.target.value as string);
  };

  const handleSubItemClick = (subItem:any) => {
    dispatch(browseResourcesByAspects({term : '', id_token: id_token, annotationName : selectedCard.title, subAnnotationName: subItem.title || null}));
    onSubItemClick(subItem);
    setIsPreviewOpen(false); // Close preview when selecting a new subItem
  };

  const getSortedSubTypes = (subItems:any) => {
    switch (sortBy) {
      case 'name':
        return [...subItems].sort((a, b) => a.title.localeCompare(b.title));
      case 'assets':
        return [...subItems].sort((a, b) => b.assets - a.assets);
      case 'relevance':
      default:
        return subItems; 
    }
  };


  let renderMainView = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column'}}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <ArrowBack
          onClick={() => navigate('/home')}
          sx={{
            marginRight: 1,
            color: '#0B57D0',
            cursor: 'pointer',
          }}
        />
        <Typography
          variant="h6"
          sx={{
            fontWeight: 500,
            fontSize: '1rem',
            color: '#1F1F1F',
          }}
        >
          Browse
        </Typography>
      </Box>
      
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <Grid container spacing={2}>
          {annotationsData.map((item, index) => (
            <Grid key={index}>
              <Card
                onClick={() => handleCardClick(item)}
                sx={{
                  width: '289px', // Changed from responsive to fixed width
                  height: '72px', // Changed from 65px
                  cursor: 'pointer',
                  borderRadius: '16px',
                  border: '1px solid var(--Text-Tertiary, #DADCE0)',
                  backgroundColor: '#ffffff',
                  boxShadow: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  '&:hover': {
                    backgroundColor: '#F8FAFD',
                    border: '1px solid #E7F0FE',
                  },
                }}
              >
                <CardContent
                  sx={{
                    marginTop: '8.5px',
                    marginLeft: '-2px',
                    padding: '16px',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      backgroundColor: generateAvatarColor(item.title).bg,
                      color: generateAvatarColor(item.title).text,
                      fontSize: '16px',
                      fontWeight: 600,
                      fontFamily: 'Google Sans Text, sans-serif',
                      flexShrink: 0,
                      borderRadius: '8px'
                    }}
                  >
                    {getFirstLetter(item.title)}
                  </Avatar>
                  <Box 
                    sx={{ 
                      flex: 1,
                      minWidth: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      gap: '2px',
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        fontFamily: 'Google Sans Text, sans-serif',
                        fontWeight: 500,
                        fontSize: '14px',
                        lineHeight: '20px',
                        color: '#1F1F1F',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.title}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: 'Google Sans Text, sans-serif',
                        fontWeight: 400,
                        fontSize: '12px',
                        lineHeight: '16px',
                        color: '#666666',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                      }}
                    >
                      {`${item.fieldValues} Sub Type${item.fieldValues > 1 ? 's' : ''}`}
                      {/* <span style={{ color: '#666666', margin: '0 4px' }}>•</span>
                      {item.assets} Assets */}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );

  const renderCardDetailView = () => (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <ArrowBack
          onClick={handleBackClick}
          sx={{
            marginRight: 1,
            color: '#0B57D0',
            cursor: 'pointer',
          }}
        />
        <Typography
          variant="h6"
          sx={{
            fontWeight: 500,
            fontSize: '18px',
            color: '#1F1F1F',
          }}
        >
          {selectedCard.title}
        </Typography>
      </Box>

      {/* Horizontal Filter Bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          padding: '2px 2px',
          gap: '8px',
          marginBottom: 2
        }}
      >
        <Typography
          sx={{
            fontFamily: 'Google Sans Text, sans-serif',
            fontWeight: 500,
            fontSize: '12px',
            color: '#1F1F1F',
          }}
        >
          {selectedCard.subItems.length} Sub types
        </Typography>
        
        <Box
          sx={{
            width: '1px',
            height: '20px',
            backgroundColor: '#E1E5E9',
          }}
        />
        
        <Typography
          sx={{
            fontFamily: 'Google Sans Text, sans-serif',
            fontWeight: 500,
            fontStyle: 'normal',
            fontSize: '12px', // Static/Body Small/Size
            lineHeight: '16px', // Static/Body Small/Line Height
            letterSpacing: '0.4px', // Static/Body Small/Tracking
            verticalAlign: 'middle',
            color: '#1F1F1F',
            marginRight: '-15px',
          }}
        >
          Sort by:
        </Typography>
        
        <FormControl size="small" sx={{ minWidth: 60 }}>
          <Select
            value={sortBy}
            onChange={handleSortChange}
            sx={{
              '& .MuiOutlinedInput-notchedOutline': {
                border: 'none',
              },
              '& .MuiSelect-select': {
                fontFamily: 'Google Sans Text, sans-serif',
                fontWeight: 500,
                fontSize: '12px',
                color: '#1F1F1F',
                padding: '8px 16px',
                '&:focus': {
                  backgroundColor: 'transparent',
                },
              },
              '& .MuiSvgIcon-root': {
                color: '#666666',
              },
            }}
          >
            <MenuItem value="relevance" sx={{fontSize:'12px'}}>Relevance</MenuItem>
            <MenuItem value="name" sx={{fontSize:'12px'}}>Name</MenuItem>
            <MenuItem value="assets" sx={{fontSize:'12px'}}>Assets</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      <Grid container spacing={2}>
        {getSortedSubTypes(selectedCard?.subItems).map((subItem:any, index:number) => (
          <Grid key={index}>
            <Card
              onClick={() => handleSubItemClick(subItem)}
              sx={{
                width: '289px', // Changed from responsive to fixed width
                height: '72px', // Changed from 65px
                cursor: 'pointer',
                borderRadius: '16px',
                border: '1px solid var(--Text-Tertiary, #DADCE0)',
                backgroundColor: '#ffffff',
                boxShadow: 'none',
                display: 'flex',
                alignItems: 'center',
                '&:hover': {
                  backgroundColor: '#F8FAFD',
                  border: '1px solid #E7F0FE',
                },
              }}
            >
              <CardContent
                sx={{
                  marginTop: '8.5px',
                  marginLeft: '-2px',
                  padding: '16px',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Box 
                  sx={{ 
                    flex: 1,
                    width: '100%',
                    height: '38px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: '2px',
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: 'Google Sans Text, sans-serif',
                      fontWeight: 500,
                      fontSize: '14px',
                      lineHeight: '20px',
                      color: '#1F1F1F',
                    }}
                  >
                    {subItem.title}
                  </Typography>
                 <Typography
                    sx={{
                      fontFamily: 'Google Sans Text, sans-serif',
                      fontWeight: 400,
                      fontSize: '12px',
                      lineHeight: '16px',
                      color: '#666666',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                    }}
                  >
                    {selectedCard?.countsFetched ? (
                      subItem.fieldValues
                    ) : (
                      <CircularProgress size={12} />
                    )}
                    {subItem.fieldValues === 1 ? ' Asset' : ' Assets'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </>
  );

  // Custom header for BrowseByAnnotation
  const customHeader = (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <ArrowBack
        onClick={handleBackClick}
        sx={{
          marginRight: 1,
          color: '#0B57D0',
          cursor: 'pointer',
        }}
      />
      <Typography
        variant="h6"
        sx={{
          fontWeight: 500,
          fontSize: '18px',
          color: '#1F1F1F',
        }}
      >
        {selectedSubItem?.title}
      </Typography>
    </Box>
  );

  // Create renderSubItemView using ResourceViewer
  const renderSubItemView = (
    <ResourceViewer
      resources={resources}
      resourcesStatus={resourcesStatus}
      error={error}
      previewData={previewData}
      onPreviewDataChange={(data) => {
        setPreviewData(data);
        setIsPreviewOpen(!!data); // Open preview when data is set (including placeholder)
      }}
      selectedTypeFilter={selectedTypeFilter}
      onTypeFilterChange={setSelectedTypeFilter}
      typeAliases={typeAliases}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      id_token={id_token}
      showFilters={true}
      showSortBy={true}
      showResultsCount={true}
      customHeader={customHeader}
      containerStyle={{ background: "#FFF", height: "100vh", borderRadius: "20px", paddingTop: "10px"}}
      contentStyle={{ minHeight: "100vh", maxHeight: "100vh", overflowY: 'auto' }}
      renderPreview={false}
      startIndex={startIndex}
      pageSize={pageSize}
      setPageSize={setPageSize}
      requestItemStore={requestItemStore}
      resourcesTotalSize={resourcesTotalSize}
      handlePagination={handlePagination}
    />
  );


  // Show preview only when a SubItem is selected
  if (selectedSubItem) {
    return (
      <>
        <div style={{backgroundColor:"#F8FAFD", minHeight:"100vh", position: "relative", flex: 1}}>
          {/* Main Content - Two Column Layout */}
          <Grid container spacing={0} style={{marginRight: "20px", marginBottom: "20px"}}>
            <Grid size={isPreviewOpen ? 8 : 12} sx={{backgroundColor: '#ffffff',borderRadius: '20px'}}>
              <div style={{
                transition: 'margin-left 0.3s ease-in-out',
              }}>
                <Box
                  sx={{
                    flex: 1,
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    borderRadius: '20px',
                  }}
                >
                  {renderSubItemView}
                </Box>
              </div>
            </Grid>
            {isPreviewOpen && (
              <Grid size={4}>
                <ResourcePreview
                  previewData={previewData}
                  onPreviewDataChange={(data) => {
                    setPreviewData(data);
                    setIsPreviewOpen(!!data); // Open preview when data is set (including placeholder)
                  }}
                  id_token={id_token}
                />
              </Grid>
            )}
          </Grid>
        </div>
      </>
    );
  }

  // Original single-column layout for main view and card detail view
  return (
    <>
      <Box
        sx={{
          flex: 1,
          backgroundColor: '#ffffff',
          padding: '16px 12px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: '20px',
          marginRight: '24px',
          marginBottom: '24px'
        }}
      >
        {selectedCard ? renderCardDetailView() : renderMainView}
      </Box>
    </>
  );
};

export default MainComponent; 