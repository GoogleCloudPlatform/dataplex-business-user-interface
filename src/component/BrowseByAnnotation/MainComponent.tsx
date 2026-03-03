import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Skeleton,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { AppDispatch, RootState } from '../../app/store';
import { browseResourcesByAspects, setItems, setItemsStatus } from '../../features/resources/resourcesSlice';
import { useDispatch, useSelector } from 'react-redux';
import ResourcePreview from '../Common/ResourcePreview';
import DetailPageOverview from '../DetailPageOverview/DetailPageOverview';
import DetailPageOverviewSkeleton from '../DetailPageOverview/DetailPageOverviewSkeleton';
import SubTypesTab from './SubTypesTab';
import SubTypesTabSkeleton from './SubTypesTabSkeleton';
import SubTypeHeaderSkeleton from './SubTypeHeaderSkeleton';
import AspectLinkedAssets from './AspectLinkedAssets';
import AnnotationsIconBlue from '../../assets/svg/annotations-icon-blue.svg';
import AnnotationSubitemIcon from '../../assets/svg/annotation-subitem.svg';

/**
 * @file MainComponent.tsx
 * @summary Renders the main content panel for the "Browse by Aspect" (Annotation) page.
 *
 * @description
 * This component displays a tab-based view for the selected aspect with two tabs:
 * - Overview: Shows aspect details using DetailPageOverview component
 * - Sub Types: Shows a grid of sub-type cards with asset counts
 *
 * When a sub-type is clicked, it navigates to the ResourceViewer to show
 * the filtered resources for that sub-type.
 */

interface MainComponentProps {
  selectedCard: any;
  onItemClick: (item: any) => void;
  selectedSubItem: any;
  onSubItemClick: (subItem: any) => void;
  annotationsData: any[];
  tabValue: number;
  onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
  contentSearchTerm: string;
  onContentSearchTermChange: (value: string) => void;
  sortBy: 'name' | 'assets' | 'type';
  onSortByChange: (value: 'name' | 'assets' | 'type') => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderToggle: () => void;
  loadingAspectName?: string | null;
  subTypesWithCache: Record<string, boolean>;
}

const MainComponent: React.FC<MainComponentProps> = ({
  selectedCard,
  selectedSubItem,
  onSubItemClick,
  tabValue,
  onTabChange,
  contentSearchTerm,
  onContentSearchTermChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderToggle,
  loadingAspectName = null,
  subTypesWithCache,
}) => {

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const id_token = useSelector((state:any) => state.user.token);

  // ResourceViewer state
  const resources = useSelector((state: any) => state.resources.items);
  const resourcesStatus = useSelector((state: any) => state.resources.status);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [linkedAssetsSearchTerm, setLinkedAssetsSearchTerm] = useState<string>('');

  // Access Redux cache
  const aspectBrowseCache = useSelector((state: RootState) => state.resources.aspectBrowseCache);

  // Cache key generator helper
  const generateCacheKey = (aspectTitle: string, subTypeName: string) => {
    return `${aspectTitle}__${subTypeName}`;
  };

  // Fetch resources when sub-item is selected
  useEffect(() => {
    if (selectedCard && selectedSubItem) {
      // Check if data is already cached
      const cacheKey = generateCacheKey(selectedCard.title, selectedSubItem.title);
      const cachedData = aspectBrowseCache[cacheKey];

      if (cachedData && subTypesWithCache[cacheKey]) {
        // Use cached data - set directly without API call
        dispatch(setItems(cachedData.data));
        dispatch(setItemsStatus('succeeded'));
        // Don't clear preview when using cache for better UX
      } else {
        // Fetch fresh data
        dispatch({ type: 'resources/setItemsPreviousPageRequest', payload: null });
        dispatch({ type: 'resources/setItemsPageRequest', payload: null });
        dispatch({ type: 'resources/setItemsStoreData', payload: [] });
        dispatch(browseResourcesByAspects({term : '', id_token: id_token, annotationName : selectedCard.title, subAnnotationName: selectedSubItem.title || null}));
        setIsPreviewOpen(false);
      }
    }
  }, [selectedCard, selectedSubItem, dispatch, id_token, aspectBrowseCache, subTypesWithCache]);

  const handleBackClick = () => {
    if (selectedSubItem) {
      onSubItemClick(null); // Clear selected subItem, return to tabs view
    } else {
      navigate('/home');
    }
  };

  const handleSubTypeClick = (subItem: any) => {
    onSubItemClick(subItem);
    setIsPreviewOpen(false);
  };

  // Transform annotation data to entry format for DetailPageOverview
  const transformAnnotationToEntry = (item: any) => {
    if (!item) return null;
    return {
      name: item.name,
      entryType: `annotation/${item.title}`,
      fullyQualifiedName: item.fullyQualifiedName || item.resource || item.name,
      createTime: item.createTime,
      updateTime: item.updateTime,
      entrySource: {
        description: item.description || '',
        displayName: item.title,
        location: item.location || '',
        system: item.system || '',
        resource: item.resource || '',
        labels: item.labels || {}
      },
      aspects: {
        [`${item.title}.global.overview`]: {
          data: {
            fields: {
              content: {
                stringValue: 'No Documentation Available',
                kind: 'stringValue'
              }
            }
          }
        }
      }
    };
  };

  // Custom header for ResourceViewer (when viewing sub-item resources)
  const resourceViewerHeader =
    resourcesStatus === 'loading' ? (
      <SubTypeHeaderSkeleton />
    ) : (
      <Box
        sx={{
          height: '64px',
          position: 'relative',
          flexShrink: 0,
          mx: '-5px',
          px: '5px',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            position: 'absolute',
            top: '20px',
            left: '20px',
          }}
        >
          <ArrowBack
            onClick={handleBackClick}
            sx={{ color: '#5f6368', cursor: 'pointer' }}
            fontSize="small"
          />
          <Box
            sx={{
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={AnnotationSubitemIcon}
              alt=""
              style={{ width: '18px', height: '18px' }}
            />
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontFamily: '"Google Sans", sans-serif',
              fontWeight: 500,
              fontSize: '18px',
              lineHeight: '24px',
              color: '#1F1F1F',
            }}
          >
            {selectedSubItem?.displayName || selectedSubItem?.title}
          </Typography>
        </Box>
      </Box>
    );

  // If selectedSubItem is set, show Linked Assets view
  if (selectedSubItem) {
    return (
      <Box
        sx={{
          display: 'flex',
          height: 'calc(100vh - 80px)',
          flex: 1,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            height: '100%',
            borderRadius: '24px',
            backgroundColor: '#fff',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          {resourceViewerHeader}

          {/* Linked Assets Tab */}
          <Box
            sx={{
              borderBottom: '1px solid #DADCE0',
              px: '20px',
            }}
          >
            {resourcesStatus === 'loading' ? (
              <Box sx={{ minHeight: '44px', height: '44px', display: 'flex', alignItems: 'flex-end', pb: '8px' }}>
                <Skeleton
                  variant="text"
                  width={100}
                  height={20}
                  sx={{ borderRadius: '4px', bgcolor: '#E8EAED' }}
                />
              </Box>
            ) : (
              <Tabs
                value={0}
                sx={{
                  minHeight: '44px',
                  height: '44px',
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#0E4DCA',
                    height: '3px',
                    borderTopLeftRadius: '2.5px',
                    borderTopRightRadius: '2.5px',
                    bottom: 0,
                  },
                }}
              >
                <Tab
                  label="Linked Assets"
                  disableRipple
                  sx={{
                    textTransform: 'none',
                    fontFamily: '"Google Sans Text", sans-serif',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    lineHeight: '20px',
                    minWidth: 'auto',
                    padding: '8px 0 0 0',
                    color: '#575757',
                    '&.Mui-selected': { color: '#0E4DCA' },
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                  }}
                />
              </Tabs>
            )}
          </Box>

          {/* Linked Assets Content */}
          <Box sx={{ flex: 1, p: '20px', overflow: 'hidden' }}>
            <AspectLinkedAssets
              linkedAssets={resources}
              searchTerm={linkedAssetsSearchTerm}
              onSearchTermChange={setLinkedAssetsSearchTerm}
              idToken={id_token}
              onAssetPreviewChange={(data) => {
                setPreviewData(data);
                setIsPreviewOpen(!!data);
              }}
              resourcesStatus={resourcesStatus}
            />
          </Box>
        </Paper>

        {/* Resource Preview Panel - matching Glossaries CSS */}
        <Paper
          elevation={0}
          sx={{
            width: isPreviewOpen ? 'clamp(300px, 22vw, 360px)' : '0px',
            minWidth: isPreviewOpen ? 'clamp(300px, 22vw, 360px)' : '0px',
            height: 'calc(100vh - 80px)',
            borderRadius: '24px',
            backgroundColor: '#fff',
            border: 'transparent',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'visible',
            flexShrink: 0,
            transition: 'width 0.3s ease-in-out, min-width 0.3s ease-in-out, opacity 0.3s ease-in-out, margin-left 0.3s ease-in-out',
            marginLeft: isPreviewOpen ? '2%' : 0,
            opacity: isPreviewOpen ? 1 : 0,
            borderWidth: isPreviewOpen ? undefined : 0,
          }}
        >
          <ResourcePreview
            previewData={previewData}
            onPreviewDataChange={(data) => {
              if (data) {
                setPreviewData(data);
                setIsPreviewOpen(true);
              } else {
                setIsPreviewOpen(false);
              }
            }}
            id_token={id_token}
            isGlossary={true}
          />
        </Paper>
      </Box>
    );
  }

  // If no selectedCard, show empty state
  if (!selectedCard) {
    return (
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          height: 'calc(100vh - 80px)',
          borderRadius: '24px',
          backgroundColor: '#fff',
          border: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <Typography sx={{ color: '#575757', fontFamily: '"Google Sans Text", sans-serif' }}>
          Select an aspect from the sidebar
        </Typography>
      </Paper>
    );
  }

  // Tab-based view (Overview + Sub Types)
  return (
    <Paper
      elevation={0}
      sx={{
        flex: 1,
        height: 'calc(100vh - 80px)',
        borderRadius: '24px',
        backgroundColor: '#fff',
        border: 'transparent',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Header with Title and Tabs */}
      <Box
        sx={{
          height: "102px",
          borderBottom: "1px solid #DADCE0",
          position: "relative",
          flexShrink: 0,
        }}
      >
        {/* Title Row */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            position: "absolute",
            top: "20px",
            left: "20px",
          }}
        >
          <img
            src={AnnotationsIconBlue}
            alt=""
            style={{ width: '24px', height: '24px' }}
          />
          <Typography
            variant="h5"
            sx={{
              fontFamily: '"Google Sans", sans-serif',
              fontWeight: 500,
              fontSize: "18px",
              color: "#1F1F1F",
            }}
          >
            {selectedCard?.title}
          </Typography>
        </Box>

        {/* Tabs */}
        <Tabs
          value={tabValue}
          onChange={onTabChange}
          sx={{
            position: "absolute",
            bottom: 0,
            left: "20px",
            minHeight: "44px",
            height: "44px",
            "& .MuiTabs-indicator": {
              backgroundColor: "#0E4DCA",
              height: "3px",
              borderTopLeftRadius: "2.5px",
              borderTopRightRadius: "2.5px",
              bottom: 0,
            },
            "& .MuiTabs-flexContainer": {
              gap: "40px",
            },
          }}
        >
          <Tab
            label="Overview"
            disableRipple
            sx={{
              textTransform: "none",
              fontFamily: '"Google Sans Text", sans-serif',
              fontSize: "0.875rem",
              fontWeight: 500,
              lineHeight: "20px",
              minWidth: "auto",
              padding: "8px 0 0 0",
              color: "#575757",
              "&.Mui-selected": { color: "#0E4DCA" },
              alignItems: "flex-start",
              justifyContent: "flex-start",
            }}
          />
          <Tab
            label="Sub Types"
            disableRipple
            sx={{
              textTransform: "none",
              fontFamily: '"Google Sans Text", sans-serif',
              fontSize: "0.875rem",
              fontWeight: 500,
              lineHeight: "20px",
              minWidth: "auto",
              padding: "8px 0 0 0",
              color: "#575757",
              "&.Mui-selected": { color: "#0E4DCA" },
              alignItems: "flex-start",
              justifyContent: "flex-start",
            }}
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box sx={{ p: "20px", overflowY: "hidden", flex: 1 }}>
        {/* Overview Tab */}
        {tabValue === 0 && selectedCard && (
          loadingAspectName === selectedCard?.name ? (
            <DetailPageOverviewSkeleton />
          ) : (
            <Box sx={{ height: "100%", overflowY: "auto", minHeight: 0 }}>
              <DetailPageOverview
                entry={transformAnnotationToEntry(selectedCard)}
                css={{ width: "100%" }}
              />
            </Box>
          )
        )}

        {/* Sub Types Tab */}
        {tabValue === 1 && (
          selectedCard?.subTypesLoaded ? (
            <SubTypesTab
              key={selectedCard?.title || selectedCard?.name}
              items={selectedCard?.subItems || []}
              searchTerm={contentSearchTerm}
              onSearchTermChange={onContentSearchTermChange}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortByChange={onSortByChange}
              onSortOrderToggle={onSortOrderToggle}
              onItemClick={handleSubTypeClick}
            />
          ) : (
            <SubTypesTabSkeleton />
          )
        )}
      </Box>
    </Paper>
  );
};

export default MainComponent;
