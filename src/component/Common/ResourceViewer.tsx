import React, { useState, useMemo, useEffect } from 'react';
import { Box, Typography, ToggleButton, ToggleButtonGroup, Menu, MenuItem, Tooltip } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
// import { KeyboardArrowDown, InfoOutlined } from '@mui/icons-material';
// import { ChevronLeftOutlined, ChevronRightOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import SearchEntriesCard from '../SearchEntriesCard/SearchEntriesCard';
// import FilterTag from '../Tags/FilterTag';
import SearchTableView from '../SearchPage/SearchTableView';
import ShimmerLoader from '../Shimmer/ShimmerLoader';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../../app/store';
import { fetchEntry } from '../../features/entry/entrySlice';
// import FilterChips from './FilterChips';
import SubmitAccess from '../SearchPage/SubmitAccess';
import NotificationBar from '../SearchPage/NotificationBar';
import { getName } from '../../utils/resourceUtils';
import FilterChipCarousel from './FilterChipCarousel';

/**
 * @file ResourceViewer.tsx
 * @summary A highly configurable component for displaying a list of data resources.
 *
 * @description
 * This component acts as the main content area for displaying search results or
 * browsable resource lists. It is responsible for:
 *
 * 1.  **Displaying Data:** Renders the `resources` array in one of two modes:
 * - 'list' (using `<SearchEntriesCard>`)
 * - 'table' (using `<SearchTableView>`)
 * 2.  **Handling States:** Manages the UI for 'loading' (shows `<ShimmerLoader>`),
 * 'succeeded' (shows data), and 'failed' (handles auth errors by
 * redirecting to login, or shows an error for invalid arguments).
 * 3.  **Sticky Header:** Renders a feature-rich sticky header that includes:
 * - A `customHeader` (if provided).
 * - Filters: `customFilters`, `<FilterChips>` for selected filters, and
 * dynamically generated type-alias tags.
 * - Sort by dropdown ('Name' or 'Last Modified').
 * - Pagination controls (rows per page, next/previous buttons).
 * - A view-mode `ToggleButtonGroup` (list/table).
 * - An info icon to toggle the preview panel.
 * 4.  **Interactivity:**
 * - Handles item clicks to update the parent's preview state
 * (via `onPreviewDataChange`).
 * - Handles double-clicks to navigate to the 'view-details' page.
 * - Manages the UI for pagination, delegating the fetch logic to the
 * `handlePagination` prop.
 *
 * @param {object} props - The props for the ResourceViewer component.
 *
 * @param {any[]} props.resources - The array of resource items to display.
 * @param {'idle' | 'loading' | 'succeeded' | 'failed'} props.resourcesStatus - The
 * current fetch status of the resources.
 * @param {any|string} [props.error] - The error object or message if `resourcesStatus`
 * is 'failed'.
 *
 * @param {any | null} props.previewData - The currently selected resource object
 * for the preview panel.
 * @param {(data: any | null) => void} props.onPreviewDataChange - Callback function
 * to update the `previewData` in the parent component.
 *
 * @param {string | null} props.selectedTypeFilter - The currently selected type filter
 * (legacy, often managed by `selectedFilters` now).
 * @param {(filter: string | null) => void} props.onTypeFilterChange - Callback to
 * change the type filter.
 * @param {string[]} props.typeAliases - A list of available type alias strings for
 * filtering.
 *
 * @param {'list' | 'table'} props.viewMode - The current display mode.
 * @param {(mode: 'list' | 'table') => void} props.onViewModeChange - Callback to
 * change the view mode.
 *
 * @param {string} props.id_token - The user's authentication token.
 *
 * @param {boolean} [props.showFilters=true] - Whether to display the filter bar.
 * @param {boolean} [props.showSortBy=false] - Whether to display the sort-by dropdown.
 * @param {boolean} [props.showResultsCount=true] - Whether to display the results
 * count text.
 * @param {React.ReactNode} [props.customHeader] - An optional React node to render
 * at the top of the header.
 * @param {React.ReactNode} [props.customFilters] - Optional React nodes to render
 * in the filter bar.
 * @param {any[]} [props.selectedFilters=[]] - An array of active filter objects
 * to be displayed as chips.
 * @param {(filters: any[]) => void} [props.onFiltersChange] - Callback to notify
 * the parent of a change in filters.
 *
 * @param {React.CSSProperties} [props.containerStyle] - Optional styles for the main
 * container.
 * @param {React.CSSProperties} [props.contentStyle] - Optional styles for the
 * scrollable content area.
 *
 * @param {(entry: any) => void} [props.onViewDetails] - Optional callback for
 * "View Details" action.
 * @param {(entry: any) => void} [props.onRequestAccess] - Optional callback for
 * "Request Access" action.
 * @param {(entry: any) => void} [props.onFavoriteClick] - Optional callback for
 * clicking the favorite icon.
 *
 * @param {boolean} [props.renderPreview] - (Note: This prop is in the interface
 * but not currently used in the component's logic).
 *
 * @param {number} props.pageSize - The current number of items per page.
 * @param {(size: number) => void} props.setPageSize - Callback to update the page size.
 * @param {number} [props.startIndex=0] - The starting index of the current page.
 * @param {any[]} props.requestItemStore - The store of all fetched items across pages.
 * @param {number} props.resourcesTotalSize - The total number of resources available.
 * @param {(direction: 'next' | 'previous', size: number, sizeChange: boolean) => void} props.handlePagination -
 * The main callback function to trigger a pagination event.
 *
 * @returns {JSX.Element} A React component that renders the full resource list UI,
 * including a shimmer loader, error state, or the interactive list/table of results.
 */

interface ResourceViewerProps {
  // Data props
  resources: any[];
  resourcesStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  error?: any|string;
  
  // Preview props
  previewData: any | null;
  onPreviewDataChange: (data: any | null) => void;
  
  // Filter props
  selectedTypeFilter: string | null;
  onTypeFilterChange: (filter: string | null) => void;
  typeAliases: string[];
  
  // View mode props
  viewMode: 'list' | 'table';
  onViewModeChange: (mode: 'list' | 'table') => void;
  
  // Access control props
  id_token: string;
  
  // Layout props
  showFilters?: boolean;
  showSortBy?: boolean;
  showResultsCount?: boolean;
  customHeader?: React.ReactNode;
  customFilters?: React.ReactNode;
  selectedFilters?: any[];
  onFiltersChange?: (filters: any[]) => void;
  availableTypeAliases?: { name: string; count: number }[];
  onTypeAliasClick?: (type: string) => void;
  
  // Styling props
  containerStyle?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
  
  // Event handlers
  onViewDetails?: (entry: any) => void;
  onRequestAccess?: (entry: any) => void;
  onFavoriteClick?: (entry: any) => void;
  
  // Preview rendering
  renderPreview?: boolean;

  // Pagination props
  pageSize : number;
  setPageSize: (size: number) => void;
  startIndex?: number;
  requestItemStore: any[]; // Store for all fetched items
  resourcesTotalSize: number;
  handlePagination: (direction: 'next' | 'previous', size: number, sizeChange:boolean) => void;
}

const ResourceViewer: React.FC<ResourceViewerProps> = ({
  resources,
  resourcesStatus,
  error,
  previewData,
  onPreviewDataChange,
  selectedTypeFilter,
  onTypeFilterChange: _onTypeFilterChange,
  typeAliases: _typeAliases,
  viewMode,
  onViewModeChange,
  showFilters = true,
  showSortBy = false,
  showResultsCount = true,
  customHeader,
  customFilters,
  containerStyle,
  contentStyle,
  onFavoriteClick,
  selectedFilters: _selectedFilters = [],
  onFiltersChange: _onFiltersChange,
  availableTypeAliases,
  onTypeAliasClick,
  startIndex: _startIndex = 0,
  pageSize: _pageSize = 20,
  setPageSize,
  requestItemStore: _requestItemStore,
  resourcesTotalSize: _resourcesTotalSize,
  handlePagination: _handlePagination,
  id_token
}) => {
  // Navigation and auth hooks
  const navigate = useNavigate();
  const { logout } = useAuth();
  // const id_token = user?.token || '';

  const dispatch = useDispatch<AppDispatch>();
  // const searchFilters = useSelector((state: any) => state.search.searchFilters);
  // const searchTerm = useSelector((state: any) => state.search.searchTerm);
  // semanticSearch is now always true (commented out — kept for future re-enabling)
  // const semanticSearch = useSelector((state:any) => state.search.semanticSearch);
  const entryStatus = useSelector((state: any) => state.entry.status);
  const entryItems = useSelector((state: any) => state.entry.items);
  const mode = useSelector((state: any) => state.user.mode) as string;

  // SubmitAccess modal state for card "Request Access" button
  const [isCardSubmitAccessOpen, setIsCardSubmitAccessOpen] = useState(false);
  const [cardAccessEntry, setCardAccessEntry] = useState<any>(null);
  const [isCardNotificationVisible, setIsCardNotificationVisible] = useState(false);
  const [cardNotificationMessage, setCardNotificationMessage] = useState('');

  // Sort state
  const [sortBy, setSortBy] = useState<'mostRelevant' | 'name' | 'lastModified'>('mostRelevant');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Note: Preview panel is managed by parent components through previewData

  // Handle failed resource status - navigate to login
  useEffect(() => {
    if (resourcesStatus === 'failed') {
      let subString = "INVALID_ARGUMENT:";
      if(error?.details && typeof error?.details === 'string'){
        if(error.details.includes(subString)){
          content = (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '200px',
              width: '100%'
            }}>
              <p style={{
                margin: 0,
                textAlign: 'center',
                color: mode === 'dark' ? '#9aa0a6' : '#666',
                fontSize: '16px'
              }}>{(error?.message || error) + ' invalid arguments passed in search params'}</p>
          </div>);
        }else{
          setPageSize(20);
          logout();
          navigate('/login');
        }
      }else{
        logout();
        navigate('/login');
      }
    }
  }, [resourcesStatus, logout, navigate]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = event.currentTarget;
    setIsScrolled(scrollTop > 0);
  };

  // Filter and sort resources
  const filteredAndSortedResources = useMemo(() => {
    // let filtered = selectedTypeFilter 
    //   ? resources.filter((resource: any) => 
    //       resource.dataplexEntry.entryType.includes('-' + selectedTypeFilter.toLowerCase())
    //     )
    //   : resources;
    // console.log("Filtered Resources:", filtered);
    // Create a copy of the filtered array before sorting to avoid read-only errors
    const filteredCopy = [...resources];

    // Skip sorting when "Most relevant" is selected (original API order)
    if (sortBy === 'mostRelevant') {
      return filteredCopy;
    }

    // Sort the filtered resources
    const direction = sortOrder === 'asc' ? 1 : -1;
    return filteredCopy.sort((a: any, b: any) => {
      if (sortBy === 'name') {
        const nameA = a.dataplexEntry.entrySource?.displayName?.toLowerCase() || '';
        const nameB = b.dataplexEntry.entrySource?.displayName?.toLowerCase() || '';

        // Handle entries with no display name - put them at the bottom
        if (!nameA && !nameB) return 0;
        if (!nameA) return 1;
        if (!nameB) return -1;

        return direction * nameA.localeCompare(nameB);
      } else if (sortBy === 'lastModified') {
        const rawA = a.dataplexEntry.updateTime;
        const rawB = b.dataplexEntry.updateTime;
        const dateA = rawA ? (typeof rawA === 'string' ? new Date(rawA).getTime() : (rawA.seconds || 0) * 1000) : 0;
        const dateB = rawB ? (typeof rawB === 'string' ? new Date(rawB).getTime() : (rawB.seconds || 0) * 1000) : 0;
        return direction * (dateA - dateB);
      }
      return 0;
    });
  }, [resources, selectedTypeFilter, sortBy, sortOrder]);

  const filteredResources = filteredAndSortedResources;

  // Utility functions
  const getFormatedDate = (date: any) => {
    if (!date) return '-';
    
    const myDate = new Date(date);

    if (isNaN(myDate.getTime())) {
      return '-';
    }

    const formatedDate = new Intl.DateTimeFormat('en-US', { month: "long", day: "numeric", year: "numeric" }).format(myDate);
    return (formatedDate);
  };

  const getEntryType = (namePath: string = '', separator: string = '') => {
    const segments: string[] = namePath.split(separator);
    let eType = segments[segments.length - 2];
    return (`${eType[0].toUpperCase()}${eType.slice(1)}`);
  };

  // Event handlers
  // const handleRemoveFilterTag = (filter: any) => {
  //   if (!onFiltersChange) return;
  //   const updated = selectedFilters.filter((f: any) => !(f.name === filter.name && f.type === filter.type));
  //   if(filter.type === "system"){
  //     const systemFilters = updated.filter((f: any) => f.type === 'system');
  //     if (systemFilters.length === 0) {
  //       dispatch({ type: 'search/setSearchType', payload: { searchType: 'All' } });
  //     } else if (systemFilters.length === 1) {
  //       dispatch({ type: 'search/setSearchType', payload: { searchType: systemFilters[0].name } });
  //     }
  //   }
  //   onTypeFilterChange(null);
  //   onFiltersChange(updated);
  //   dispatch({ type: 'search/setSearchFilters', payload: { searchFilters: updated } });
  // };

  // const getFilterResultCount = (filter: any): string | undefined => {
  //   try {
  //     const type = String(filter.type || '').toLowerCase();
  //     const name = String(filter.name || '');
  //     if (!name) return undefined;
  //     if (type === 'typealiases') {
  //       if(selectedFilters.length === 1){
  //         return selectedFilters.find((f: any) => f.name === name && f.type === 'typeAliases') ? ""+resourcesTotalSize : undefined;
  //       }
  //     }
  //     if (type === 'system') {
  //       if(selectedFilters.length === 1){
  //         return selectedFilters.find((f: any) => f.name === name && f.type === 'system') ? ""+resourcesTotalSize : undefined;
  //       }
  //     }
  //     return undefined;
  //   } catch {
  //     return undefined;
  //   }
  // };
  // const handleTypeFilterClick = (type: string) => {
  //   const updated = selectedFilters.find((f: any) => (f.name === type && f.type === 'typeAliases'))
  //     ? selectedFilters.filter((f: any) => !(f.name === type && f.type === 'typeAliases'))
  //     : [...selectedFilters, { name: type, type: 'typeAliases' }];
  //   onTypeFilterChange(null);
  //   if(onFiltersChange) onFiltersChange(updated);
  //   dispatch({ type: 'search/setSearchFilters', payload: { searchFilters: updated } });
  // };

  const handleViewModeChange = (_event: React.MouseEvent<HTMLElement>, newMode: 'list' | 'table' | null) => {
    if (newMode !== null) {
      onViewModeChange(newMode);
    }
  };

  const handleSearchEntriesClick = (entry: any) => {
    onPreviewDataChange(entry);
  };

  const handleSearchEntriesDoubleClick = (clickedEntry: any) => {
    const isCurrentlyPreviewed = previewData && previewData.name === clickedEntry.name;
    const isAccessGranted = entryStatus === 'succeeded';

    if (isCurrentlyPreviewed && isAccessGranted) {
      navigate('/view-details');
    } else {
      onPreviewDataChange(clickedEntry);
    }
  };

  const handleNavigateToTab = (clickedEntry: any, tabName: string) => {
    dispatch(fetchEntry({ entryName: clickedEntry.name, id_token }));
    navigate('/view-details', { state: { tabName } });
  };

  const handleRequestAccessFromCard = (clickedEntry: any) => {
    setCardAccessEntry(clickedEntry);
    // Delay opening so SubmitAccess mounts at right:-500px first, then slides to right:0
    requestAnimationFrame(() => {
      setIsCardSubmitAccessOpen(true);
    });
  };

  const handleCardSubmitAccessClose = () => {
    setIsCardSubmitAccessOpen(false);
    setTimeout(() => setCardAccessEntry(null), 300);
  };

  const handleCardSubmitSuccess = () => {
    setIsCardSubmitAccessOpen(false);
    setTimeout(() => setCardAccessEntry(null), 300);
    setCardNotificationMessage('Request sent');
    setIsCardNotificationVisible(true);
    setTimeout(() => setIsCardNotificationVisible(false), 5000);
  };

  const handleCardCloseNotification = () => {
    setIsCardNotificationVisible(false);
  };

  const handleFavoriteClick = (entry: any) => {
    if (onFavoriteClick) {
      onFavoriteClick(entry);
    }
  };

  // Sort menu handlers
  const handleSortMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setSortMenuAnchor(event.currentTarget);
  };

  const handleSortMenuClose = () => {
    setSortMenuAnchor(null);
  };

  const handleSortOptionSelect = (option: 'mostRelevant' | 'name' | 'lastModified') => {
    setSortBy(option);
    if (option === 'mostRelevant') {
      setSortOrder('asc');
    }
    handleSortMenuClose();
  };

  const selectedIndex = filteredResources?.findIndex(
  r => previewData && previewData.name === r.dataplexEntry.name
);

  // let filterChips;
  // if(searchFilters.length > 0){
  //   filterChips = (
  //     <FilterChips
  //       selectedFilters={selectedFilters}
  //       getCount={(f)=>{ return getFilterResultCount(f)}}
  //       handleRemoveFilterTag={(f) => handleRemoveFilterTag(f)}
  //     />
  //   );
  // }else{
  //   filterChips=(<></>);
  // }

  // Main content rendering
  let content;

  if (resourcesStatus === 'loading' || resourcesStatus === 'succeeded') {
    content = (
      <div
        onScroll={handleScroll}
        style={{
          display: 'block',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '0px',
          background: mode === 'dark' ? '#131314' : '#ffffff',
          margin: '0px 5px 0px 5px',
          padding: "0px 5px",
          minHeight: 'calc(100vh - 3.9rem)',
          maxHeight: 'calc(100vh - 3.9rem)',
          overflowY: 'auto',
          overflowX: 'hidden',
          ...contentStyle
      }}>
        <div style={{ 
            position: 'sticky', 
            top: 0, 
            zIndex: 10,
            backgroundColor: mode === 'dark' ? '#131314' : '#ffffff'
        }}>
        {/* Custom Header */}
        {customHeader}

        {/* Header Row — Filters, Results Count, Sort, View Toggle */}
        {(showFilters || showResultsCount || showSortBy) && (
          <div style={{
            padding: previewData ? "10px 4px 8px 10px" : "10px 10px 8px 10px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "24px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "24px", minWidth: 0, flexShrink: 1 }}>
              {showFilters && customFilters}
              {showResultsCount && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Typography component="span" style={{
                    fontSize: "22px",
                    fontWeight: "400",
                    fontFamily: '"Google Sans", sans-serif',
                    whiteSpace: "nowrap",
                    color: mode === 'dark' ? '#e3e3e3' : '#1F1F1F',
                  }}>
                    Search results
                  </Typography>
                  {resourcesStatus === 'succeeded' && (
                    <Typography component="span" style={{
                      fontSize: "14px",
                      fontWeight: "400",
                      whiteSpace: "nowrap",
                      color: mode === 'dark' ? '#9aa0a6' : '#575757',
                    }}>
                      (Top {filteredResources?.length || 0} results)
                    </Typography>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "16px", flexShrink: 0 }}>
              {/* Sort Controls — right side */}
              {showSortBy && viewMode !== 'table' && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Typography
                    component="span"
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                      color: mode === 'dark' ? '#e3e3e3' : '#1F1F1F',
                      whiteSpace: "nowrap",
                      fontFamily: '"Google Sans Text", sans-serif',
                    }}
                    onClick={handleSortMenuClick}
                  >
                    <ExpandMoreIcon
                      sx={{
                        fontSize: '20px',
                        color: mode === 'dark' ? '#9aa0a6' : '#575757',
                        transform: Boolean(sortMenuAnchor) ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease',
                      }}
                    />
                    {sortBy === 'mostRelevant' ? 'Most relevant' : sortBy === 'name' ? 'Name' : 'Last modified'}
                  </Typography>
                  {sortBy !== 'mostRelevant' && (
                    <Tooltip title={sortOrder === 'asc' ? 'Sort large to small' : 'Sort small to large'} arrow>
                      <span
                        onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        style={{
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          flexShrink: 0,
                          transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.2s ease-in-out',
                        }}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect width="24" height="24" rx="12" fill={mode === 'dark' ? '#004a77' : '#C2E7FF'}/>
                          <path d="M11.168 15.4818L11.168 5.33594L12.8346 5.33594L12.8346 15.4818L17.5013 10.8151L18.668 12.0026L12.0013 18.6693L5.33464 12.0026L6.5013 10.8151L11.168 15.4818Z" fill={mode === 'dark' ? '#8ab4f8' : '#004A77'}/>
                        </svg>
                      </span>
                    </Tooltip>
                  )}
                </div>
              )}

              {/* View Mode Toggle */}
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={handleViewModeChange}
                aria-label="view mode"
                size="small"
                sx={{
                  width: '5rem',
                  height: '1.5rem',
                  borderRadius: '40px',
                  border: mode === 'dark' ? '1px solid #5f6368' : '1px solid #575757',
                  backgroundColor: mode === 'dark' ? '#131314' : '#FFFFFF',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0,
                  padding: 0,
                  '& .MuiToggleButton-root': {
                    border: 'none',
                    borderRadius: 0,
                    padding: '0px',
                    fontSize: 0,
                    fontWeight: 500,
                    fontFamily: '"Google Sans Text", sans-serif',
                    lineHeight: 1,
                    minWidth: 'auto',
                    height: '1.5rem',
                    margin: 0,
                    backgroundColor: 'transparent',
                    color: mode === 'dark' ? '#e3e3e3' : '#1F1F1F',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.125rem',
                    transition: 'all 0.2s ease-in-out',
                    borderRight: mode === 'dark' ? '1px solid #5f6368' : '1px solid #575757',
                    '&:first-of-type': {
                      borderTopLeftRadius: '1rem',
                      borderBottomLeftRadius: '1rem',
                    },
                    '&:last-of-type': {
                      borderTopRightRadius: '1rem',
                      borderBottomRightRadius: '1rem',
                      borderRight: 'none',
                    },
                    '&.Mui-selected': {
                      width: '3.125rem',
                      backgroundColor: mode === 'dark' ? '#004a77' : '#C2E7FF',
                      color: mode === 'dark' ? '#c2e7ff' : '#0B57D0',
                      borderRight: mode === 'dark' ? '1px solid #5f6368' : '1px solid #575757',
                      padding: '0 0.25rem',
                      '& svg': {
                        fill: mode === 'dark' ? '#c2e7ff' : '#004A77'
                      },
                      '&:hover': {
                        backgroundColor: mode === 'dark' ? '#004a77' : '#C2E7FF',
                      }
                    },
                    '&.Mui-selected:last-of-type': {
                      borderRight: 'none',
                    },
                    '&:not(.Mui-selected)': {
                      width: '1.875rem',
                      backgroundColor: 'transparent',
                      color: mode === 'dark' ? '#e3e3e3' : '#1F1F1F',
                      padding: '0',
                      '& svg': {
                        fill: mode === 'dark' ? '#e3e3e3' : '#1F1F1F'
                      },
                      '&:hover': {
                        backgroundColor: mode === 'dark' ? '#3c4043' : '#F0F0F0',
                        color: mode === 'dark' ? '#e3e3e3' : '#1F1F1F'
                      }
                    }
                  }
                }}
              >
                <ToggleButton value="list" aria-label="card view">
                  {viewMode === 'list' && (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '2px' }}>
                      <path d="M5.86339 10.5833L3.08339 7.80333L2.13672 8.74333L5.86339 12.47L13.8634 4.47L12.9234 3.53L5.86339 10.5833Z" fill={mode === 'dark' ? '#c2e7ff' : '#0E4DCA'}/>
                    </svg>
                  )}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <mask id="mask_card" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16">
                      <rect width="16" height="16" fill="#D9D9D9"/>
                    </mask>
                    <g mask="url(#mask_card)">
                      <path d="M3.33333 7.33333C2.96667 7.33333 2.65278 7.20278 2.39167 6.94167C2.13056 6.68056 2 6.36667 2 6V3.33333C2 2.96667 2.13056 2.65278 2.39167 2.39167C2.65278 2.13056 2.96667 2 3.33333 2H12.6667C13.0333 2 13.3472 2.13056 13.6083 2.39167C13.8694 2.65278 14 2.96667 14 3.33333V6C14 6.36667 13.8694 6.68056 13.6083 6.94167C13.3472 7.20278 13.0333 7.33333 12.6667 7.33333H3.33333ZM3.33333 6H12.6667V3.33333H3.33333V6ZM3.33333 14C2.96667 14 2.65278 13.8694 2.39167 13.6083C2.13056 13.3472 2 13.0333 2 12.6667V10C2 9.63333 2.13056 9.31945 2.39167 9.05833C2.65278 8.79722 2.96667 8.66667 3.33333 8.66667H12.6667C13.0333 8.66667 13.3472 8.79722 13.6083 9.05833C13.8694 9.31945 14 9.63333 14 10V12.6667C14 13.0333 13.8694 13.3472 13.6083 13.6083C13.3472 13.8694 13.0333 14 12.6667 14H3.33333ZM3.33333 12.6667H12.6667V10H3.33333V12.6667Z" fill={viewMode === 'list' ? (mode === 'dark' ? '#c2e7ff' : '#004A77') : (mode === 'dark' ? '#e3e3e3' : '#1F1F1F')}/>
                    </g>
                  </svg>
                </ToggleButton>
                <ToggleButton value="table" aria-label="table view">
                  {viewMode === 'table' && (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '2px' }}>
                      <path d="M5.86339 10.5833L3.08339 7.80333L2.13672 8.74333L5.86339 12.47L13.8634 4.47L12.9234 3.53L5.86339 10.5833Z" fill={mode === 'dark' ? '#c2e7ff' : '#0E4DCA'}/>
                    </svg>
                  )}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <mask id="mask_table" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16">
                      <rect width="16" height="16" fill="#D9D9D9"/>
                    </mask>
                    <g mask="url(#mask_table)">
                      <path d="M3.33333 14C2.96667 14 2.65278 13.8694 2.39167 13.6083C2.13056 13.3472 2 13.0333 2 12.6667V3.33333C2 2.96667 2.13056 2.65278 2.39167 2.39167C2.65278 2.13056 2.96667 2 3.33333 2H12.6667C13.0333 2 13.3472 2.13056 13.6083 2.39167C13.8694 2.65278 14 2.96667 14 3.33333V12.6667C14 13.0333 13.8694 13.3472 13.6083 13.6083C13.3472 13.8694 13.0333 14 12.6667 14H3.33333ZM7.33333 10H3.33333V12.6667H7.33333V10ZM8.66667 10V12.6667H12.6667V10H8.66667ZM7.33333 8.66667V6H3.33333V8.66667H7.33333ZM8.66667 8.66667H12.6667V6H8.66667V8.66667ZM3.33333 4.66667H12.6667V3.33333H3.33333V4.66667Z" fill={viewMode === 'table' ? (mode === 'dark' ? '#c2e7ff' : '#004A77') : (mode === 'dark' ? '#e3e3e3' : '#1F1F1F')}/>
                    </g>
                  </svg>
                </ToggleButton>
              </ToggleButtonGroup>

            </div>
          </div>
        )}

        {/* Type Alias Filter Chips Carousel */}
        {showFilters && availableTypeAliases && onTypeAliasClick && (
          <FilterChipCarousel
            availableTypeAliases={availableTypeAliases}
            selectedFilters={_selectedFilters}
            onTypeAliasClick={onTypeAliasClick}
            resourcesStatus={resourcesStatus}
          />
        )}

        {/* Sort Menu */}
        <Menu
          anchorEl={sortMenuAnchor}
          open={Boolean(sortMenuAnchor)}
          onClose={handleSortMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          PaperProps={{
            style: {
              marginTop: '4px',
              borderRadius: '8px',
              boxShadow: mode === 'dark' ? '0px 4px 6px -1px rgba(0, 0, 0, 0.4), 0px 2px 4px -1px rgba(0, 0, 0, 0.3)' : '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)',
              minWidth: '140px',
              backgroundColor: mode === 'dark' ? '#1e1f20' : '#FFFFFF',
            }
          }}
        >
          <MenuItem
            onClick={() => handleSortOptionSelect('mostRelevant')}
            sx={{
              fontSize: '12px',
              fontWeight: sortBy === 'mostRelevant' ? '500' : '400',
              color: sortBy === 'mostRelevant' ? (mode === 'dark' ? '#8ab4f8' : '#0B57D0') : (mode === 'dark' ? '#e3e3e3' : '#1F1F1F'),
              backgroundColor: sortBy === 'mostRelevant' ? (mode === 'dark' ? 'rgba(138,180,248,0.16)' : '#F8FAFD') : 'transparent',
              '&:hover': { backgroundColor: mode === 'dark' ? '#3c4043' : '#F1F3F4' },
            }}
          >
            Most relevant
          </MenuItem>
          <MenuItem
            onClick={() => handleSortOptionSelect('name')}
            sx={{
              fontSize: '12px',
              fontWeight: sortBy === 'name' ? '500' : '400',
              color: sortBy === 'name' ? (mode === 'dark' ? '#8ab4f8' : '#0B57D0') : (mode === 'dark' ? '#e3e3e3' : '#1F1F1F'),
              backgroundColor: sortBy === 'name' ? (mode === 'dark' ? 'rgba(138,180,248,0.16)' : '#F8FAFD') : 'transparent',
              '&:hover': { backgroundColor: mode === 'dark' ? '#3c4043' : '#F1F3F4' },
            }}
          >
            Name
          </MenuItem>
          <MenuItem
            onClick={() => handleSortOptionSelect('lastModified')}
            sx={{
              fontSize: '12px',
              fontWeight: sortBy === 'lastModified' ? '500' : '400',
              color: sortBy === 'lastModified' ? (mode === 'dark' ? '#8ab4f8' : '#0B57D0') : (mode === 'dark' ? '#e3e3e3' : '#1F1F1F'),
              backgroundColor: sortBy === 'lastModified' ? (mode === 'dark' ? 'rgba(138,180,248,0.16)' : '#F8FAFD') : 'transparent',
              '&:hover': { backgroundColor: mode === 'dark' ? '#3c4043' : '#F1F3F4' },
            }}
          >
            Last Modified
          </MenuItem>
        </Menu>
        <div
          style={{
            position: 'absolute',
            bottom: '-1px',
            left: '-10px',
            right: '-10px',
            height: '1.5px',
            background: mode === 'dark' ? 'linear-gradient(to bottom, rgba(0, 0, 0, 0.6), transparent)' : 'linear-gradient(to bottom, rgba(0, 0, 0, 0.35), transparent)',
            filter: 'blur(1px)',
            opacity: isScrolled ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out',
          }}
        />
        </div>
        {/* Resources List or Shimmer */}
        {resourcesStatus === 'loading' ? (
          <div style={{ padding: '10px' }}>
            <ShimmerLoader count={6} type={viewMode === 'table' ? 'search-table' : 'search-card'} />
          </div>
        ) : filteredResources.length > 0 ? (
          viewMode === 'list' ? (
            filteredResources.map((resource: any, index: number) => {
              const isSelected = previewData && previewData.name === resource.dataplexEntry.name;
              const disableHoverEffect = selectedIndex !== -1 && selectedIndex === index - 1;
              const hideTopBorder = hoveredIndex === index - 1;
              return (
                <Box
                  key={resource.dataplexEntry.name}
                  onClick={() => handleSearchEntriesClick(resource.dataplexEntry)}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  sx={{
                    cursor: 'pointer',
                    padding: '0px',
                    marginTop: index === 0 ? '10px' : '0px',
                    marginBottom: '20px',
                    marginLeft: '10px',
                    marginRight: previewData ? '4px' : '10px',
                  }}
                >
                  <SearchEntriesCard
                    index={index}
                    entry={resource.dataplexEntry}
                    hideTopBorderOnHover={hideTopBorder}
                    sx={{ backgroundColor: 'transparent' }}
                    isSelected={isSelected}
                    onDoubleClick={handleSearchEntriesDoubleClick}
                    disableHoverEffect={disableHoverEffect}
                    onNavigateToTab={handleNavigateToTab}
                    id_token={id_token}
                    onRequestAccess={handleRequestAccessFromCard}
                  />
                </Box>
              );
            })
          ) : (
            <SearchTableView
              resources={filteredResources}
              onRowClick={handleSearchEntriesClick}
              onFavoriteClick={handleFavoriteClick}
              getFormatedDate={getFormatedDate}
              getEntryType={getEntryType}
              previewOpen={!!previewData}
              selectedEntryName={previewData?.name || null}
            />
          )
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '200px',
            width: '100%'
          }}>
            <p style={{
              margin: 0,
              textAlign: 'center',
              color: mode === 'dark' ? '#9aa0a6' : '#575757',
              fontSize: '16px'
            }}>No Resources found</p>
          </div>
        )}
      </div>
    );
  } else if (resourcesStatus === 'failed') {
    let subString = "INVALID_ARGUMENT:";
    if(error?.details && typeof error?.details === 'string'){
      if(error.details.includes(subString)){
        content = (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '200px',
            width: '100%'
          }}>
            <p style={{
              margin: 0,
              textAlign: 'center',
              color: '#666',
              fontSize: '16px'
            }}>{(error?.message || error) + ' invalid arguments passed in search params'}</p>
        </div>);
      }else{
        logout();
        navigate('/login');
      }
    }else{
      logout();
      navigate('/login');
    }
  }

  return (
    <>
      <div style={{ backgroundColor: mode === 'dark' ? '#131314' : '#F8FAFD', height: 'calc(100vh - 4.5rem)', position: "relative", ...containerStyle }}>
        {content}
      </div>

      {/* Backdrop for card Request Access modal */}
      {isCardSubmitAccessOpen && (
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
          onClick={handleCardSubmitAccessClose}
        />
      )}
      {/* SubmitAccess panel for card Request Access button */}
      {cardAccessEntry && (
        <SubmitAccess
          isOpen={isCardSubmitAccessOpen}
          onClose={handleCardSubmitAccessClose}
          assetName={cardAccessEntry?.entrySource?.displayName?.length > 0 ? cardAccessEntry.entrySource.displayName : getName(cardAccessEntry?.name || '', '/')}
          entry={entryItems}
          onSubmitSuccess={handleCardSubmitSuccess}
          previewData={cardAccessEntry}
        />
      )}

      {/* Notification Bar */}
      <NotificationBar
        isVisible={isCardNotificationVisible}
        onClose={handleCardCloseNotification}
        message={cardNotificationMessage}
      />
    </>
  );
};

export default ResourceViewer;
