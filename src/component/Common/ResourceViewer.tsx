import React, { useState, useMemo, useEffect } from 'react';
import { Box, Typography, ToggleButton, ToggleButtonGroup, Menu, MenuItem, IconButton, Tooltip } from '@mui/material';
import { KeyboardArrowDown, InfoOutlined, ChevronLeftOutlined, ChevronRightOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import SearchEntriesCard from '../SearchEntriesCard/SearchEntriesCard';
import FilterTag from '../Tags/FilterTag';
import SearchTableView from '../SearchPage/SearchTableView';
import ShimmerLoader from '../Shimmer/ShimmerLoader';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../../app/store';
// import { fetchEntry } from '../../features/entry/entrySlice';
import FilterChips from './FilterChips';

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
  onTypeFilterChange,
  typeAliases,
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
  selectedFilters = [],
  onFiltersChange,
  startIndex = 0,
  pageSize = 20,
  setPageSize,
  requestItemStore,
  resourcesTotalSize,
  handlePagination
}) => {
  // Navigation and auth hooks
  const navigate = useNavigate();
  const { logout } = useAuth();
  // const id_token = user?.token || '';

  const dispatch = useDispatch<AppDispatch>();
  const searchFilters = useSelector((state: any) => state.search.searchFilters);
  const semanticSearch = useSelector((state:any) => state.search.semanticSearch);
  const entryStatus = useSelector((state: any) => state.entry.status);

  // Sort state
  const [sortBy, setSortBy] = useState<'name' | 'lastModified'>('lastModified');
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
                color: '#666',
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

    // Sort the filtered resources
    return filteredCopy.sort((a: any, b: any) => {
      if (sortBy === 'name') {
        const nameA = a.dataplexEntry.entrySource?.displayName?.toLowerCase() || '';
        const nameB = b.dataplexEntry.entrySource?.displayName?.toLowerCase() || '';
        
        // Handle entries with no display name - put them at the bottom
        if (!nameA && !nameB) return 0;
        if (!nameA) return 1;  // Put entries with no name at the bottom
        if (!nameB) return -1; // Put entries with no name at the bottom
        
        return nameA.localeCompare(nameB);
      } else if (sortBy === 'lastModified') {
        const dateA = a.dataplexEntry.updateTime?.seconds || 0;
        const dateB = b.dataplexEntry.updateTime?.seconds || 0;
        return dateB - dateA; // Descending order (newest first)
      }
      return 0;
    });
  }, [resources, selectedTypeFilter, sortBy]);

  const filteredResources = filteredAndSortedResources;

  // Utility functions
  const getFormatedDate = (date: any) => {
    if (!date) return '-';
    
    const myDate = new Date(date);

    if (isNaN(myDate.getTime())) {
      return '-';
    }

    const formatedDate = new Intl.DateTimeFormat('en-US', { month: "short", day: "numeric", year: "numeric" }).format(myDate);
    return (formatedDate);
  };

  const getEntryType = (namePath: string = '', separator: string = '') => {
    const segments: string[] = namePath.split(separator);
    let eType = segments[segments.length - 2];
    return (`${eType[0].toUpperCase()}${eType.slice(1)}`);
  };

  // Event handlers
  const handleRemoveFilterTag = (filter: any) => {
    if (!onFiltersChange) return;
    const updated = selectedFilters.filter((f: any) => !(f.name === filter.name && f.type === filter.type));
    if(filter.type === "system"){
      const systemFilters = updated.filter((f: any) => f.type === 'system');
      if (systemFilters.length === 0) {
        // No system filters selected, set search type to 'All'
        dispatch({ type: 'search/setSearchType', payload: { searchType: 'All' } });
      } else if (systemFilters.length === 1) {
        // One system filter selected, set search type to that filter
        dispatch({ type: 'search/setSearchType', payload: { searchType: systemFilters[0].name } });
      }
    }
    onTypeFilterChange(null);
    onFiltersChange(updated);
    dispatch({ type: 'search/setSearchFilters', payload: { searchFilters: updated } });
  };

  // Compute result count for a given selected filter based on current resources
  const getFilterResultCount = (filter: any): string | undefined => {
    try {
      const type = String(filter.type || '').toLowerCase();
      const name = String(filter.name || '');
      if (!name) return undefined;
      if (type === 'typealiases') {
        //const key = name.replace(' ', '_').replace('/','').toLowerCase();
        if(selectedFilters.length === 1){
          return selectedFilters.find((f: any) => f.name === name && f.type === 'typeAliases') ? ""+resourcesTotalSize : undefined;
        }
        // return resources.filter((r: any) => (r?.dataplexEntry?.entryType || '').split('-').pop() === key).length > 0 ? 
        // `${resources.filter((r: any) => (r?.dataplexEntry?.entryType || '').split('-').pop() === key).length}+`
        // : undefined;
      }
      if (type === 'system') {
        //const key = name.replace(' ', '_').replace('/','').toLowerCase();
        if(selectedFilters.length === 1){
          return selectedFilters.find((f: any) => f.name === name && f.type === 'system') ? ""+resourcesTotalSize : undefined;
        }
        // return resources.filter((r: any) => (r?.dataplexEntry?.entrySource?.system || '').split('-').pop() === key).length > 0 ?
        // `${resources.filter((r: any) => String(r?.dataplexEntry?.entrySource?.system || '').toLowerCase() === key).length}+` 
        // : undefined;
      }
      // For other types (e.g., aspectType, project), backend filtering may apply;
      // data shape might not allow local counting reliably → omit count.
      return undefined;
    } catch {
      return undefined;
    }
  };
  const handleTypeFilterClick = (type: string) => {
    const updated = selectedFilters.find((f: any) => (f.name === type && f.type === 'typeAliases'))
      ? selectedFilters.filter((f: any) => !(f.name === type && f.type === 'typeAliases'))
      : [...selectedFilters, { name: type, type: 'typeAliases' }];
    onTypeFilterChange(null);
    if(onFiltersChange) onFiltersChange(updated);
    dispatch({ type: 'search/setSearchFilters', payload: { searchFilters: updated } });
  };

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

  const handleSortOptionSelect = (option: 'name' | 'lastModified') => {
    setSortBy(option);
    handleSortMenuClose();
  };

  const selectedIndex = filteredResources?.findIndex(
  r => previewData && previewData.name === r.dataplexEntry.name
);

  let filterChips;

  if(searchFilters.length > 0){
    filterChips = (
      <FilterChips 
        selectedFilters={selectedFilters} 
        getCount={(f)=>{ return getFilterResultCount(f)}}
        handleRemoveFilterTag={(f) => handleRemoveFilterTag(f)}
      />
    );
  }else{
    filterChips=(<></>);
  }

  // Main content rendering
  let content;

  if (resourcesStatus === 'loading') {
    content = (
      <div style={{ background: "#FFF", height:'calc(100vh - 3.9rem)', padding: "0px", borderRadius: "20px", margin: '0rem 1.25rem' }}>
        <div style={{
          display: 'block',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '20px',
          background: '#ffffff',
          margin: '0px 5px 0px 5px',
          padding: "5px",
          minHeight: 'calc(100vh - 3.9rem)',
          maxHeight: 'calc(100vh - 3.9rem)',
          overflowY: 'auto'
        }}>
          <ShimmerLoader count={6} type="list" />
        </div>
      </div>
    );
  } else if (resourcesStatus === 'succeeded') {
    content = (<></>);
    content = (
      <div
        onScroll={handleScroll}
        style={{
          display: 'block',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '20px',
          background: '#ffffff',
          margin: '0px 5px 0px 5px',
          padding: "0px 5px",
          minHeight: 'calc(100vh - 3.9rem)',
          maxHeight: 'calc(100vh - 3.9rem)',
          overflowY: 'auto',
          ...contentStyle
      }}>
        <div style={{ 
            position: 'sticky', 
            top: 0, 
            zIndex: 10, 
            backgroundColor: '#ffffff'
        }}>
        {/* Custom Header */}
        {customHeader}

        {/* Filters Section */}
        {showFilters && (
          <div style={{
            padding: "10px 10px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap"
          }}>
            {customFilters}
            {/* Selected filters from sidebar as tags */}
            {filterChips}
            
            {filteredResources.length > 0 && (() => {
              const availableTags = typeAliases.filter((item) =>
                filteredResources.some((resource: any) => resource.dataplexEntry.entryType.includes('-' + item.toLowerCase()))
              );
              if (availableTags.length <= 0) return null;
              return availableTags.map((item) => {
                return selectedFilters.find((f) => f.name == item) ? (<></>) : (
                  <FilterTag
                    key={`type-${item}`}
                    handleClick={() => handleTypeFilterClick(item)}
                    handleClose={() => onTypeFilterChange(null)}
                    showCloseButton={selectedTypeFilter === item}
                    css={{
                      margin: "0px",
                      textTransform: "capitalize",
                      fontFamily: '"Google Sans Text", sans-serif',
                      fontWeight: 400,
                      fontSize: '12px',
                      letterSpacing: '0.83%',
                      padding: '8px 13px',
                      borderRadius: '59px',
                      gap: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: selectedTypeFilter === item ? '#E7F0FE' : 'transparent',
                      color: selectedTypeFilter === item ? '#0E4DCA' : '#1F1F1F',
                      border: selectedTypeFilter === item ? 'none' : '1px solid #DADCE0',
                      height: '32px',
                      whiteSpace: 'nowrap'
                    }}
                    text={`${item}`+ 
                      (selectedFilters.length === 1 
                        && selectedFilters.find((f: any) => f.name.toLowerCase() === item.toLowerCase()) 
                        ? " ("+ resourcesTotalSize +")"  : ""
                        // : "("+ filteredResources.filter((r: any) => r.dataplexEntry.entryType.split('-').pop() == item.toLowerCase()).length +"+)"
                      )} />
                )
              });
            })()}
          </div>
        )}

        {/* Results and Sort Section */}
        {(showResultsCount || showSortBy) && (
          <div style={{
            padding: "0px 10px 10px 10px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              {/* {showResultsCount && (
                <>
                  <Typography component="span" style={{ margin: "0px 5px", fontSize: "14px", fontWeight: "500" }}>
                    {filteredResources.length} results
                  </Typography>
                  <Typography component="span" style={{ margin: "0px 5px", fontSize: "14px", fontWeight: "500" }}>
                    |
                  </Typography>
                </>
              )} */}
              {showSortBy && (
                <>
                  <Typography component="span" style={{ margin: "0px 5px", fontSize: "12px", fontWeight: "500" }}>
                    Sort by:
                  </Typography>
                  <Typography 
                    component="span" 
                    style={{ 
                      margin: "0px 5px", 
                      fontSize: "12px", 
                      fontWeight: "500", 
                      display: "flex", 
                      alignItems: "center",
                      cursor: "pointer",
                      color: "#1F1F1F"
                    }}
                    onClick={handleSortMenuClick}
                  >
                    {sortBy === 'name' ? 'Name' : 'Last Modified'} 
                    <KeyboardArrowDown style={{ marginLeft: "2px" }} />
                  </Typography>
                </>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {/* <TablePagination
                component="div"
                count={100}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              /> */}
              {/* <span style={{
                fontFamily: '"Google Sans Text", sans-serif',
                fontWeight: "500",
                fontSize: "14px",
                lineHeight: "1.5",
              }}>Rows : 
                <Select style={{ marginLeft: '5px', fontSize: '14px', height: '24px' }}
                  disabled={resourcesTotalSize < 20 ? true : false}
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    console.log("Page size changed:", e.target.value);
                    handlePagination('next', Number(e.target.value), true);
                  }}
                  size="small"
                >
                  {[10, 20, 50, 100].map((size) => (
                    <MenuItem sx={{fontSize: '14px'}} key={size} value={size}>{size}</MenuItem>
                  ))}
                </Select>
              </span> */}
              {semanticSearch === true ? (<>
                <span style={{
                  fontFamily: '"Google Sans Text", sans-serif',
                  fontWeight: "500",
                  fontSize: "14px",
                  lineHeight: "1.5",
                }}>
                  Top 100 results
                </span>
              </>) : (<>
              <IconButton
                style={{padding: '0px', fontFamily: '"Google Sans Text", sans-serif',}}
                disabled={requestItemStore.length > 0 && startIndex > 0 ? false : true}
                onClick={() => {
                  console.log("previos page clicked");
                  handlePagination("previous", pageSize, false);
                }}
              >
                <ChevronLeftOutlined style={{ color: '#0E4DCA', opacity: (requestItemStore.length > 0 && startIndex > 0) ? 1 : 0.5 }} />
              </IconButton>
              <span style={{
                fontFamily: '"Google Sans Text", sans-serif',
                fontWeight: "500",
                fontSize: "14px",
                lineHeight: "1.5",
              }}>{`${startIndex+1} to ${startIndex + pageSize < resourcesTotalSize ? startIndex + pageSize : resourcesTotalSize} of ${resourcesTotalSize < 100 ? resourcesTotalSize : 'many'}`}</span>
              <IconButton
                style={{padding: '0px', fontFamily: '"Google Sans Text", sans-serif',}}
                disabled={(startIndex + pageSize >= resourcesTotalSize) ? true : false}
                onClick={() => {
                  console.log("Next page clicked");
                  handlePagination("next", pageSize, false);
                }}
              >
                <ChevronRightOutlined style={{ color: '#0E4DCA' , opacity: (startIndex + pageSize >= resourcesTotalSize) ? 0.5 : 1 }} />
              </IconButton>
              </>)}

              {/* View Mode Toggle */}
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={handleViewModeChange}
                aria-label="view mode"
                size="small"
                sx={{
                  width: '5rem', // 80px total width as per Figma
                  height: '1.5rem', // 24px height as per Figma
                  borderRadius: '1rem', // 16px - fully rounded
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#FFFFFF',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0,
                  padding: 0,
                  '& .MuiToggleButton-root': {
                    border: 'none',
                    borderRadius: '1rem', // 16px - fully rounded
                    padding: '0px', // No padding as per Figma
                    fontSize: 0, // Hide text, only show icons
                    fontWeight: 500,
                    fontFamily: '"Google Sans Text", sans-serif',
                    lineHeight: 1,
                    minWidth: 'auto',
                    height: '1.5rem', // 24px
                    margin: 0,
                    backgroundColor: 'transparent',
                    color: '#64748B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.125rem', // 2px gap between check and icon
                    transition: 'all 0.2s ease-in-out',
                    '&:first-of-type': {
                      borderTopRightRadius: 0,
                      borderBottomRightRadius: 0,
                    },
                    '&:last-of-type': {
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                    },
                    '&.Mui-selected': {
                      width: '3.125rem', // 50px when selected (fits check + icon)
                      backgroundColor: '#E8F0FE',
                      color: '#0B57D0',
                      borderColor: 'transparent',
                      padding: '0 0.25rem', // 4px horizontal padding when selected
                      '& svg': {
                        fill: '#0B57D0'
                      }
                    },
                    '&:not(.Mui-selected)': {
                      width: '1.875rem', // 30px when not selected (icon only)
                      backgroundColor: 'transparent',
                      color: '#64748B',
                      borderColor: 'transparent',
                      padding: '0', // No padding when not selected
                      '& svg': {
                        fill: '#64748B'
                      },
                      '&:hover': {
                        backgroundColor: '#F8FAFC',
                        color: '#475569'
                      }
                    }
                  }
                }}
              >
                <ToggleButton value="table" aria-label="table view">
                  {viewMode === 'table' && (
                    <img src="/assets/svg/check.svg" alt="Check" style={{ width: '16px', height: '16px', marginRight: '2px' }} />
                  )}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13.1368 13.1369V10.4486H2.86285V13.1369H13.1368ZM13.1368 9.42119V6.57872H2.86285V9.42119H13.1368ZM13.1368 5.55132V2.86297H2.86285V5.55132H13.1368ZM2.86285 14.1643C2.58887 14.1643 2.34915 14.0616 2.14367 13.8561C1.93819 13.6506 1.83545 13.4109 1.83545 13.1369V2.86297C1.83545 2.589 1.93819 2.34927 2.14367 2.14379C2.34915 1.93831 2.58887 1.83557 2.86285 1.83557H13.1368C13.4108 1.83557 13.6505 1.93831 13.856 2.14379C14.0615 2.34927 14.1642 2.589 14.1642 2.86297V13.1369C14.1642 13.4109 14.0615 13.6506 13.856 13.8561C13.6505 14.0616 13.4108 14.1643 13.1368 14.1643H2.86285Z" fill={viewMode === 'table' ? '#0B57D0' : '#64748B'}/>
                    <rect x="5" y="2" width="1" height="12" fill={viewMode === 'table' ? '#0B57D0' : '#64748B'}/>
                  </svg>
                </ToggleButton>
                <ToggleButton value="list" aria-label="list view">
                  {viewMode === 'list' && (
                    <img src="/assets/svg/check.svg" alt="Check" style={{ width: '16px', height: '16px', marginRight: '2px' }} />
                  )}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 13V11H14V13H2ZM2 9V7H14V9H2ZM2 5V3H14V5H2Z" fill={viewMode === 'list' ? '#0B57D0' : '#64748B'}/>
                  </svg>
                </ToggleButton>
              </ToggleButtonGroup>
              
              {/* Info Icon */}
              <Tooltip 
                title={previewData ? "Close Preview" : "Open Preview"}
                placement="bottom"
                arrow
              >
                <IconButton
                  onClick={() => {
                    if (previewData) {
                      // Close the side panel
                      onPreviewDataChange(null);
                    } else {
                      // Open preview panel with placeholder data to show empty state
                      onPreviewDataChange({ isPlaceholder: true });
                    }
                  }}
                  sx={{
                    width: '24px',
                    height: '24px',
                    padding: '0',
                    borderRadius: '50%',
                    backgroundColor: previewData ? '#E7F0FE' : '#FFFFFF',
                    minWidth: '20px',
                    cursor: 'pointer',
                    marginRight: '0.5rem',
                    '&:hover': {
                      backgroundColor: '#F8FAFC'
                    }
                  }}
                >
                  <InfoOutlined 
                    sx={{ 
                      fontSize: '20px',
                      color: previewData ? '#0B57D0' : '#1f1f1f'
                    }} 
                  />
                </IconButton>
              </Tooltip>
            </div>
          </div>
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
              boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)',
              minWidth: '140px'
            }
          }}
        >
          <MenuItem 
            onClick={() => handleSortOptionSelect('name')}
            style={{
              fontSize: '12px',
              fontWeight: sortBy === 'name' ? '500' : '400',
              color: sortBy === 'name' ? '#0B57D0' : '#1F1F1F',
              backgroundColor: sortBy === 'name' ? '#F8FAFD' : 'transparent'
            }}
          >
            Name
          </MenuItem>
          <MenuItem 
            onClick={() => handleSortOptionSelect('lastModified')}
            style={{
              fontSize: '12px',
              fontWeight: sortBy === 'lastModified' ? '500' : '400',
              color: sortBy === 'lastModified' ? '#0B57D0' : '#1F1F1F',
              backgroundColor: sortBy === 'lastModified' ? '#F8FAFD' : 'transparent'
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
            background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.35), transparent)',
            filter: 'blur(1px)',
            opacity: isScrolled ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out',
          }}
        />
        </div>
        {/* Resources List */}
        {filteredResources.length > 0 ? (
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
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    padding: '0px',
                    marginLeft: '-0.5rem'
                  }}
                >
                  <SearchEntriesCard
                    index={index}
                    entry={resource.dataplexEntry}
                    hideTopBorderOnHover={hideTopBorder}
                    sx={{ backgroundColor: 'transparent', borderRadius: isSelected ? '8px' : '0px', marginTop: isSelected ? '-1px' : '0px',  marginBottom: isSelected ? '-2px' : '0px' }}
                    isSelected={isSelected}
                    onDoubleClick={handleSearchEntriesDoubleClick}
                    disableHoverEffect={disableHoverEffect}
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
              color: '#575757',
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
      <div style={{ backgroundColor: "#F8FAFD", height: 'calc(100vh - 4rem)', position: "relative", ...containerStyle }}>
        {content}
      </div>

    </>
  );
};

export default ResourceViewer;
