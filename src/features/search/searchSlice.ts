import { createSlice } from '@reduxjs/toolkit';

type searchState = {
  searchTerm: string | null;
  searchResult: unknown | null; // Replace 'unknown' with your actual search result type
  searchType: string; // Add search type to persist dropdown selection
  searchFilters:any[];
  semanticSearch?: boolean;
};

const initialState : searchState = {
  searchTerm: '',
  searchResult: null,
  searchType: 'All', // Default to 'All',
  searchFilters:[],
  semanticSearch: false,
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
    }
  },
});

export const { setSearchResult, setSearchTerm, setSearchType, setSearchFilters, setSemanticSearch } = searchSlice.actions;

export default searchSlice.reducer;
