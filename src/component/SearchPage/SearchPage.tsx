import React, { useEffect, useState } from 'react'
import { Grid } from '@mui/material'
import { Tune } from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux'
import FilterDropdown from '../Filter/FilterDropDown'
import type { AppDispatch } from '../../app/store'
import { searchResourcesByTerm } from '../../features/resources/resourcesSlice'
import { useAuth } from '../../auth/AuthProvider'
import ResourceViewer from '../Common/ResourceViewer'
import ResourcePreview from '../Common/ResourcePreview'
import { typeAliases } from '../../utils/resourceUtils'

/**
 * @file SearchPage.tsx
 * @description
 * This component renders the main search results page, coordinating a
 * filter panel, a results list, and a details preview panel.
 *
 * It operates in a master-detail pattern:
 * 1.  **Filter Panel**: A `FilterDropdown` component is rendered in a
 * slidable panel on the left, which is toggled by a "Tune" icon
 * (`customFilters`).
 * 2.  **Master List**: A `ResourceViewer` component displays the main list
 * of search results (`resources`) fetched from the Redux store.
 * 3.  **Detail Panel**: A `ResourcePreview` component appears on the
 * right when an item in the `ResourceViewer` is selected (which sets
 * the `previewData` state).
 *
 * The component is heavily driven by Redux state:
 * - It fetches its own data by dispatching `searchResourcesByTerm` based
 * on the `searchTerm` and `searchType` from the Redux store.
 * - It re-fetches data whenever the `filters` (from the `FilterDropdown`) change.
 * - It automatically synchronizes the `searchType` from the global `SearchBar`
 * (via Redux) with its local `filters` state.
 * - It manages all pagination state (`startIndex`, `pageSize`, etc.) and
 * logic (`handlePagination`), dispatching new searches for more items
 * as the user paginates.
 *
 * @param {SearchPageProps} props - The props for the component.
 * @param {any[]} [props.searchResult] - (Optional) An array of search
 * results. (Note: The component primarily relies on data fetched from the
 * Redux store rather than this prop).
 *
 * @returns {React.ReactElement} A React element rendering the complete
 * search page layout, which includes the `FilterDropdown`,
 * `ResourceViewer`, and `ResourcePreview` components.
 */

interface SearchPageProps {
  searchResult?: any[]; // Optional search results array
}

const SearchPage: React.FC<SearchPageProps> = ({ searchResult }) => {
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const searchTerm = useSelector((state:any) => state.search.searchTerm);
  const searchType = useSelector((state:any) => state.search.searchType);
  const semanticSearch = useSelector((state:any) => state.search.semanticSearch);
  const id_token = user?.token || '';
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [filters, setFilters] = useState<any[]>([]);
  const [prevFilters, setPrevFilters] = useState<any[]>([]);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'table'>('list');
  const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(true);
  const [startIndex, setStartIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(20);
  const [pageNumber, setPageNumber] = useState<number>(1);
  

  const handleFilterChange = (selectedFilters: any[]) => {
    setFilters(selectedFilters);
  };

  const handleTuneIconClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsFiltersOpen(!isFiltersOpen);
  };

  useEffect(() => {
    setPageSize(20);
    setPageNumber(1);
    setStartIndex(0);
    // Clear previous search results in the store
    dispatch({ type: 'resources/setItemsPreviousPageRequest', payload: null });
    dispatch({ type: 'resources/setItemsPageRequest', payload: null });
    dispatch({ type: 'resources/setItemsStoreData', payload: [] });
    // Only search if there's a search term and no existing results
    if (searchTerm && searchTerm.trim() !== '' && resources.length === 0) {
      
      dispatch(searchResourcesByTerm({term : searchTerm, id_token: id_token, filters: filters, semanticSearch: semanticSearch}) );   
    }
  }, []);

  useEffect(() => {
    setStartIndex(0);
    setPageNumber(1);
    setPageSize(20);
    dispatch({ type: 'resources/setItemsPreviousPageRequest', payload: null });
    dispatch({ type: 'resources/setItemsPageRequest', payload: null });
    dispatch({ type: 'resources/setItemsStoreData', payload: [] });   
  }, [searchTerm]);

  useEffect(() => {
    console.log("Search result:", searchResult);
    dispatch({ type: 'resources/setItemsPreviousPageRequest', payload: null });
    dispatch({ type: 'resources/setItemsPageRequest', payload: null });
    dispatch({ type: 'resources/setItemsStoreData', payload: [] });
    setStartIndex(0);
    setPageNumber(1);
    if(filters.length > 0 || prevFilters.length > 0){
      dispatch(searchResourcesByTerm({term : searchTerm, id_token: id_token, filters: filters, semanticSearch: semanticSearch}));
    }
    setPrevFilters(filters);
  }, [filters]);

  useEffect(() => {
    dispatch({ type: 'resources/setItemsPreviousPageRequest', payload: null });
    dispatch({ type: 'resources/setItemsPageRequest', payload: null });
    dispatch({ type: 'resources/setItemsStoreData', payload: [] });
    setStartIndex(0);
    setPageNumber(1);
    if(searchType === "BigQuery" || searchType === "bigquery"){
      if(!filters.some(item => item.name === "BigQuery")){
        const updatedFilters = [...filters, {name: 'BigQuery', type: 'system'}];
        setFilters(updatedFilters);
        // Notify parent
        dispatch({ type: 'search/setSearchFilters', payload: { searchFilters: updatedFilters } });
      }
    }else if(searchType === "All"){
      if(filters.some(item => item.name === "BigQuery")){
        const updatedFilters = filters.filter((f: any) => !(f.name === "BigQuery" && f.type === 'system'));
        setFilters(updatedFilters);
        // Notify parent
        dispatch({ type: 'search/setSearchFilters', payload: { searchFilters: updatedFilters } });
      }
    }
  }, [searchType]);

  // Keep dropdown filters in sync with selected type tag
  useEffect(() => {
    // When a type tag is selected, ensure the corresponding checkbox is checked in dropdown
    if (selectedTypeFilter) {
      const withoutTypeAliases = filters.filter((f: any) => f.type !== 'typeAliases');
      const alreadySelected = filters.some((f: any) => f.type === 'typeAliases' && f.name === selectedTypeFilter);
      const next = alreadySelected 
        ? filters 
        : [...withoutTypeAliases, { name: selectedTypeFilter, type: 'typeAliases' }];
      setFilters(next);
    } else {
      // When the type tag is cleared, uncheck corresponding checkbox in dropdown
      if (filters.some((f: any) => f.type === 'typeAliases')) {
        const next = filters.filter((f: any) => f.type !== 'typeAliases');
        setFilters(next);
      }
    }
  }, [selectedTypeFilter]);

  // Select data from the Redux store
  const resources = useSelector((state: any) => state.resources.items);
  const resourcesStatus = useSelector((state: any) => state.resources.status);
  const error = useSelector((state: any) => state.resources.error);

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
        const start = sizeChange ? 0 : size * pageNumber;
        setPageNumber(pageNumber + 1);
        setStartIndex(start);
        const paginatedItems = start + size <= requestItemStore.length 
        ? requestItemStore.slice(start, start + size) : requestItemStore.slice(start);

        if(paginatedItems.length === size || ((start + size) >= resourcesTotalSize && requestItemStore.length === resourcesTotalSize)){
          dispatch({ type: 'resources/setItemsStatus', payload: 'loading' });
          dispatch({ type: 'resources/setItems', payload: paginatedItems });
        }else if(requestResourceData != null){
          requestResourceData.pageSize = (start + size) - requestItemStore.length;
          dispatch({ type: 'resources/setItemsNextPageSize', payload: size });
          dispatch(searchResourcesByTerm({ term:searchTerm, requestResourceData: requestResourceData, id_token: id_token, filters:filters, semanticSearch: semanticSearch }) );
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

  // useEffect hook to dispatch the fetchResources action for the initial load
  useEffect(() => {
    // Only set previewData to null on initial load, not on every status change
    if (resourcesStatus === 'idle') {
      setPreviewData(null);
    }
    if (resourcesStatus === 'loading') {
      //setLoader(true);
      setPreviewData(null);
    }
    // if (resourcesStatus === 'succeeded') {
    //   //setLoader(false)
    //   //console.log("Resources fetched successfully:", resources);
    // }
  }, [resourcesStatus]);
  
  // Custom filter component for SearchPage
  const customFilters = (
    <span 
        style={{
            background: isFiltersOpen ? "#E7F0FE" : "none", 
            color: "#0E4DCA" , 
            padding:"8px 13px", 
            borderRadius:"59px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "40px",
            height: "32px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            border: isFiltersOpen ? "none" : "1px solid #DADCE0"
        }}
        onClick={handleTuneIconClick}
    >
        <Tune style={{ fontSize: "20px" }} />
    </span>
  );

  return (
    <>
        <div style={{backgroundColor:"#F8FAFD", height: 'calc(100vh - 3.9rem)', position: "relative"}}>
            {/* Filters Component - Absolute Overlay */}
            <div style={{
                position: 'absolute',
                left: isFiltersOpen ? '1rem' : '-210px',
                top: '5px',
                width: '210px',
                height: 'calc(100vh - 3.9rem)',
                transition: 'left 0.3s ease-in-out',
                zIndex: 900,
                overflowY: 'auto',
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                padding: '10px 0'
            }}>
                <FilterDropdown key="filters-panel" filters={filters} onFilterChange={(f) => { handleFilterChange(f)} }/>
            </div>

            {/* Main Content - Always Stable Layout */}
            <Grid container spacing={0} style={{padding:"5px 10px", height: 'calc(100vh - 3.9rem)'}}>
                <Grid size={previewData ? 8.5 : 12}>
                    <div style={{
                        transition: 'margin-left 0.3s ease-in-out',
                        marginLeft: isFiltersOpen ? '13.25rem' : '-1.25rem'
                    }}>
                          <ResourceViewer
                          resources={resources}
                          resourcesStatus={resourcesStatus}
                          error={error}
                          previewData={previewData}
                          onPreviewDataChange={setPreviewData}
                          selectedTypeFilter={selectedTypeFilter}
                          onTypeFilterChange={setSelectedTypeFilter}
                          typeAliases={typeAliases}
                          viewMode={viewMode}
                          onViewModeChange={setViewMode}
                          id_token={id_token}
                          showFilters={true}
                          showSortBy={true}
                          showResultsCount={true}
                          customFilters={customFilters}
                          selectedFilters={filters}
                          onFiltersChange={(updated) => {handleFilterChange(updated);}}
                          containerStyle={{ marginLeft: '0px' }}
                          contentStyle={{ margin: '0px 5px 0px 20px' }}
                          renderPreview={false}
                          startIndex={startIndex}
                          pageSize={pageSize}
                          setPageSize={setPageSize}
                          requestItemStore={requestItemStore}
                          resourcesTotalSize={resourcesTotalSize}
                          handlePagination={handlePagination}
                        />
                    </div>
                </Grid>
                {previewData && (
                  <Grid size={3.5}>
                      <ResourcePreview
                        previewData={previewData}
                        onPreviewDataChange={setPreviewData}
                        id_token={id_token}
                      />
                  </Grid>
                )}
            </Grid>
        </div>
    </>
  )
}

export default SearchPage;