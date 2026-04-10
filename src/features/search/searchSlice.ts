import { createSlice } from '@reduxjs/toolkit';

type searchState = {
  searchTerm: string | null;
  searchResult: unknown | null; // Replace 'unknown' with your actual search result type
  searchType: string; // Add search type to persist dropdown selection
  searchFilters:any[];
  semanticSearch?: boolean;
  isSearchFiltersOpen: boolean;
  isSideNavOpen: boolean;
  searchSubmitted: boolean;
};

const initialState : searchState = {
  searchTerm: '',
  searchResult: null,
  searchType: 'All', // Default to 'All',
  searchFilters:[],
  semanticSearch: true,
  isSearchFiltersOpen: true,
  isSideNavOpen: true,
  searchSubmitted: false,
};

export const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload.searchTerm;
    },
    setSearchResult: (state, action) => {
      state.searchResult = action.payload;
    },
    setSearchType: (state, action) => {
      state.searchType = action.payload.searchType;
    },
    setSearchFilters: (state, action) => {
      state.searchFilters = action.payload.searchFilters;
    },
    setSemanticSearch: (state, action) => {
      state.semanticSearch = action.payload.semanticSearch;
    },
    setSearchFiltersOpen: (state, action) => {
      state.isSearchFiltersOpen = action.payload;
    },
    setSideNavOpen: (state, action) => {
      state.isSideNavOpen = action.payload;
    },
    setSearchSubmitted: (state, action) => {
      state.searchSubmitted = action.payload;
    },
  },
});

export const { setSearchResult, setSearchTerm, setSearchType, setSearchFilters, setSemanticSearch, setSearchFiltersOpen, setSideNavOpen, setSearchSubmitted } = searchSlice.actions;

export default searchSlice.reducer;
