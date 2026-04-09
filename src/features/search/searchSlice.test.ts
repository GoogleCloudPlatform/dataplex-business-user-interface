import { configureStore } from '@reduxjs/toolkit';
import { describe, it, expect, beforeEach } from 'vitest';
import searchReducer, {
  setSearchTerm,
  setSearchResult,
  setSearchType,
  setSearchFilters,
  setSemanticSearch,
  searchSlice,
} from './searchSlice';

// Define the state type
type SearchState = {
  searchTerm: string | null;
  searchResult: unknown | null;
  searchType: string;
  searchFilters: any[];
  semanticSearch?: boolean;
  isSearchFiltersOpen: boolean;
  isSideNavOpen: boolean;
  searchSubmitted: boolean;
};

describe('searchSlice', () => {
  // Mock data
  const mockSearchResult = {
    results: [
      { id: 1, name: 'Table A', type: 'TABLE' },
      { id: 2, name: 'Dataset B', type: 'DATASET' },
    ],
    totalCount: 2,
    nextPageToken: 'token123',
  };

  const mockFilters = [
    { type: 'system', name: 'BigQuery' },
    { type: 'typeAliases', name: 'Table' },
    { type: 'project', name: 'test-project' },
  ];

  let store: ReturnType<typeof configureStore<{ search: SearchState }>>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        search: searchReducer,
      },
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = store.getState().search;

      expect(state.searchTerm).toBe('');
      expect(state.searchResult).toBeNull();
      expect(state.searchType).toBe('All');
      expect(state.searchFilters).toEqual([]);
      expect(state.semanticSearch).toBe(true);
    });

    it('should return initial state when called with undefined state', () => {
      const state = searchReducer(undefined, { type: 'unknown' });

      expect(state.searchTerm).toBe('');
      expect(state.searchResult).toBeNull();
      expect(state.searchType).toBe('All');
      expect(state.searchFilters).toEqual([]);
      expect(state.semanticSearch).toBe(true);
    });
  });

  describe('Slice Configuration', () => {
    it('should have correct slice name', () => {
      expect(searchSlice.name).toBe('search');
    });

    it('should have all reducers defined', () => {
      expect(searchSlice.caseReducers.setSearchTerm).toBeDefined();
      expect(searchSlice.caseReducers.setSearchResult).toBeDefined();
      expect(searchSlice.caseReducers.setSearchType).toBeDefined();
      expect(searchSlice.caseReducers.setSearchFilters).toBeDefined();
      expect(searchSlice.caseReducers.setSemanticSearch).toBeDefined();
    });
  });

  describe('setSearchTerm Reducer', () => {
    it('should set search term', () => {
      store.dispatch(setSearchTerm({ searchTerm: 'test query' }));

      const state = store.getState().search;
      expect(state.searchTerm).toBe('test query');
    });

    it('should replace existing search term', () => {
      store.dispatch(setSearchTerm({ searchTerm: 'first query' }));
      store.dispatch(setSearchTerm({ searchTerm: 'second query' }));

      const state = store.getState().search;
      expect(state.searchTerm).toBe('second query');
    });

    it('should set search term to empty string', () => {
      store.dispatch(setSearchTerm({ searchTerm: 'some query' }));
      store.dispatch(setSearchTerm({ searchTerm: '' }));

      const state = store.getState().search;
      expect(state.searchTerm).toBe('');
    });

    it('should set search term to null', () => {
      store.dispatch(setSearchTerm({ searchTerm: 'some query' }));
      store.dispatch(setSearchTerm({ searchTerm: null }));

      const state = store.getState().search;
      expect(state.searchTerm).toBeNull();
    });

    it('should handle special characters in search term', () => {
      store.dispatch(setSearchTerm({ searchTerm: 'test:query=value' }));

      const state = store.getState().search;
      expect(state.searchTerm).toBe('test:query=value');
    });

    it('should handle long search terms', () => {
      const longTerm = 'a'.repeat(1000);
      store.dispatch(setSearchTerm({ searchTerm: longTerm }));

      const state = store.getState().search;
      expect(state.searchTerm).toBe(longTerm);
    });

    it('should not affect other state properties', () => {
      store.dispatch(setSearchResult(mockSearchResult));
      store.dispatch(setSearchType({ searchType: 'Table' }));
      store.dispatch(setSearchTerm({ searchTerm: 'new term' }));

      const state = store.getState().search;
      expect(state.searchTerm).toBe('new term');
      expect(state.searchResult).toEqual(mockSearchResult);
      expect(state.searchType).toBe('Table');
    });
  });

  describe('setSearchResult Reducer', () => {
    it('should set search result', () => {
      store.dispatch(setSearchResult(mockSearchResult));

      const state = store.getState().search;
      expect(state.searchResult).toEqual(mockSearchResult);
    });

    it('should replace existing search result', () => {
      const firstResult = { results: [{ id: 1 }] };
      const secondResult = { results: [{ id: 2 }, { id: 3 }] };

      store.dispatch(setSearchResult(firstResult));
      store.dispatch(setSearchResult(secondResult));

      const state = store.getState().search;
      expect(state.searchResult).toEqual(secondResult);
    });

    it('should set search result to null', () => {
      store.dispatch(setSearchResult(mockSearchResult));
      store.dispatch(setSearchResult(null));

      const state = store.getState().search;
      expect(state.searchResult).toBeNull();
    });

    it('should handle empty object result', () => {
      store.dispatch(setSearchResult({}));

      const state = store.getState().search;
      expect(state.searchResult).toEqual({});
    });

    it('should handle empty array result', () => {
      store.dispatch(setSearchResult([]));

      const state = store.getState().search;
      expect(state.searchResult).toEqual([]);
    });

    it('should handle complex nested result', () => {
      const complexResult = {
        results: [
          {
            id: 1,
            metadata: {
              tags: ['tag1', 'tag2'],
              attributes: { key: 'value' },
            },
          },
        ],
        pagination: {
          currentPage: 1,
          totalPages: 10,
          pageSize: 20,
        },
      };

      store.dispatch(setSearchResult(complexResult));

      const state = store.getState().search;
      expect(state.searchResult).toEqual(complexResult);
    });

    it('should not affect other state properties', () => {
      store.dispatch(setSearchTerm({ searchTerm: 'my search' }));
      store.dispatch(setSearchType({ searchType: 'Dataset' }));
      store.dispatch(setSearchResult(mockSearchResult));

      const state = store.getState().search;
      expect(state.searchResult).toEqual(mockSearchResult);
      expect(state.searchTerm).toBe('my search');
      expect(state.searchType).toBe('Dataset');
    });
  });

  describe('setSearchType Reducer', () => {
    it('should set search type', () => {
      store.dispatch(setSearchType({ searchType: 'Table' }));

      const state = store.getState().search;
      expect(state.searchType).toBe('Table');
    });

    it('should replace existing search type', () => {
      store.dispatch(setSearchType({ searchType: 'Table' }));
      store.dispatch(setSearchType({ searchType: 'Dataset' }));

      const state = store.getState().search;
      expect(state.searchType).toBe('Dataset');
    });

    it('should set search type to All', () => {
      store.dispatch(setSearchType({ searchType: 'Table' }));
      store.dispatch(setSearchType({ searchType: 'All' }));

      const state = store.getState().search;
      expect(state.searchType).toBe('All');
    });

    it('should handle various search types', () => {
      const searchTypes = ['All', 'Table', 'Dataset', 'View', 'Model', 'Schema'];

      searchTypes.forEach((type) => {
        store.dispatch(setSearchType({ searchType: type }));
        expect(store.getState().search.searchType).toBe(type);
      });
    });

    it('should not affect other state properties', () => {
      store.dispatch(setSearchTerm({ searchTerm: 'query' }));
      store.dispatch(setSearchResult(mockSearchResult));
      store.dispatch(setSearchType({ searchType: 'Model' }));

      const state = store.getState().search;
      expect(state.searchType).toBe('Model');
      expect(state.searchTerm).toBe('query');
      expect(state.searchResult).toEqual(mockSearchResult);
    });
  });

  describe('setSearchFilters Reducer', () => {
    it('should set search filters', () => {
      store.dispatch(setSearchFilters({ searchFilters: mockFilters }));

      const state = store.getState().search;
      expect(state.searchFilters).toEqual(mockFilters);
    });

    it('should replace existing filters', () => {
      const firstFilters = [{ type: 'system', name: 'BigQuery' }];
      const secondFilters = [{ type: 'project', name: 'my-project' }];

      store.dispatch(setSearchFilters({ searchFilters: firstFilters }));
      store.dispatch(setSearchFilters({ searchFilters: secondFilters }));

      const state = store.getState().search;
      expect(state.searchFilters).toEqual(secondFilters);
    });

    it('should set filters to empty array', () => {
      store.dispatch(setSearchFilters({ searchFilters: mockFilters }));
      store.dispatch(setSearchFilters({ searchFilters: [] }));

      const state = store.getState().search;
      expect(state.searchFilters).toEqual([]);
    });

    it('should handle single filter', () => {
      const singleFilter = [{ type: 'typeAliases', name: 'Table' }];
      store.dispatch(setSearchFilters({ searchFilters: singleFilter }));

      const state = store.getState().search;
      expect(state.searchFilters).toEqual(singleFilter);
      expect(state.searchFilters.length).toBe(1);
    });

    it('should handle many filters', () => {
      const manyFilters = Array.from({ length: 20 }, (_, i) => ({
        type: 'filter',
        name: `filter-${i}`,
      }));

      store.dispatch(setSearchFilters({ searchFilters: manyFilters }));

      const state = store.getState().search;
      expect(state.searchFilters).toEqual(manyFilters);
      expect(state.searchFilters.length).toBe(20);
    });

    it('should handle filters with subAnnotationData', () => {
      const filtersWithSubAnnotation = [
        {
          type: 'aspectType',
          name: 'Data Classification',
          subAnnotationData: [
            { fieldName: 'sensitivity', enabled: true, filterType: 'include', value: 'high' },
          ],
        },
      ];

      store.dispatch(setSearchFilters({ searchFilters: filtersWithSubAnnotation }));

      const state = store.getState().search;
      expect(state.searchFilters).toEqual(filtersWithSubAnnotation);
    });

    it('should not affect other state properties', () => {
      store.dispatch(setSearchTerm({ searchTerm: 'test' }));
      store.dispatch(setSearchType({ searchType: 'View' }));
      store.dispatch(setSearchFilters({ searchFilters: mockFilters }));

      const state = store.getState().search;
      expect(state.searchFilters).toEqual(mockFilters);
      expect(state.searchTerm).toBe('test');
      expect(state.searchType).toBe('View');
    });
  });

  describe('setSemanticSearch Reducer', () => {
    it('should set semantic search to true', () => {
      store.dispatch(setSemanticSearch({ semanticSearch: true }));

      const state = store.getState().search;
      expect(state.semanticSearch).toBe(true);
    });

    it('should set semantic search to false', () => {
      store.dispatch(setSemanticSearch({ semanticSearch: true }));
      store.dispatch(setSemanticSearch({ semanticSearch: false }));

      const state = store.getState().search;
      expect(state.semanticSearch).toBe(false);
    });

    it('should toggle semantic search', () => {
      // Initially true
      expect(store.getState().search.semanticSearch).toBe(true);

      // Set to false
      store.dispatch(setSemanticSearch({ semanticSearch: false }));
      expect(store.getState().search.semanticSearch).toBe(false);

      // Set back to true
      store.dispatch(setSemanticSearch({ semanticSearch: true }));
      expect(store.getState().search.semanticSearch).toBe(true);
    });

    it('should not affect other state properties', () => {
      store.dispatch(setSearchTerm({ searchTerm: 'semantic query' }));
      store.dispatch(setSearchType({ searchType: 'All' }));
      store.dispatch(setSearchFilters({ searchFilters: mockFilters }));
      store.dispatch(setSemanticSearch({ semanticSearch: true }));

      const state = store.getState().search;
      expect(state.semanticSearch).toBe(true);
      expect(state.searchTerm).toBe('semantic query');
      expect(state.searchType).toBe('All');
      expect(state.searchFilters).toEqual(mockFilters);
    });
  });

  describe('Combined Actions', () => {
    it('should handle setting all state properties', () => {
      store.dispatch(setSearchTerm({ searchTerm: 'full test' }));
      store.dispatch(setSearchResult(mockSearchResult));
      store.dispatch(setSearchType({ searchType: 'Table' }));
      store.dispatch(setSearchFilters({ searchFilters: mockFilters }));
      store.dispatch(setSemanticSearch({ semanticSearch: true }));

      const state = store.getState().search;
      expect(state.searchTerm).toBe('full test');
      expect(state.searchResult).toEqual(mockSearchResult);
      expect(state.searchType).toBe('Table');
      expect(state.searchFilters).toEqual(mockFilters);
      expect(state.semanticSearch).toBe(true);
    });

    it('should handle resetting all state properties', () => {
      // Set all properties
      store.dispatch(setSearchTerm({ searchTerm: 'query' }));
      store.dispatch(setSearchResult(mockSearchResult));
      store.dispatch(setSearchType({ searchType: 'Dataset' }));
      store.dispatch(setSearchFilters({ searchFilters: mockFilters }));
      store.dispatch(setSemanticSearch({ semanticSearch: true }));

      // Reset to initial-like values
      store.dispatch(setSearchTerm({ searchTerm: '' }));
      store.dispatch(setSearchResult(null));
      store.dispatch(setSearchType({ searchType: 'All' }));
      store.dispatch(setSearchFilters({ searchFilters: [] }));
      store.dispatch(setSemanticSearch({ semanticSearch: false }));

      const state = store.getState().search;
      expect(state.searchTerm).toBe('');
      expect(state.searchResult).toBeNull();
      expect(state.searchType).toBe('All');
      expect(state.searchFilters).toEqual([]);
      expect(state.semanticSearch).toBe(false);
    });

    it('should handle rapid successive updates', () => {
      for (let i = 0; i < 100; i++) {
        store.dispatch(setSearchTerm({ searchTerm: `query ${i}` }));
      }

      const state = store.getState().search;
      expect(state.searchTerm).toBe('query 99');
    });
  });

  describe('Direct Reducer Tests', () => {
    it('should handle setSearchTerm action directly', () => {
      const initialState: SearchState = {
        searchTerm: '',
        searchResult: null,
        searchType: 'All',
        searchFilters: [],
        semanticSearch: false,
        isSearchFiltersOpen: true,
        isSideNavOpen: true,
        searchSubmitted: false,
      };

      const action = setSearchTerm({ searchTerm: 'direct test' });
      const state = searchReducer(initialState, action);

      expect(state.searchTerm).toBe('direct test');
    });

    it('should handle setSearchResult action directly', () => {
      const initialState: SearchState = {
        searchTerm: '',
        searchResult: null,
        searchType: 'All',
        searchFilters: [],
        semanticSearch: false,
        isSearchFiltersOpen: true,
        isSideNavOpen: true,
        searchSubmitted: false,
      };

      const action = setSearchResult({ data: 'test' });
      const state = searchReducer(initialState, action);

      expect(state.searchResult).toEqual({ data: 'test' });
    });

    it('should handle setSearchType action directly', () => {
      const initialState: SearchState = {
        searchTerm: '',
        searchResult: null,
        searchType: 'All',
        searchFilters: [],
        semanticSearch: false,
        isSearchFiltersOpen: true,
        isSideNavOpen: true,
        searchSubmitted: false,
      };

      const action = setSearchType({ searchType: 'View' });
      const state = searchReducer(initialState, action);

      expect(state.searchType).toBe('View');
    });

    it('should handle setSearchFilters action directly', () => {
      const initialState: SearchState = {
        searchTerm: '',
        searchResult: null,
        searchType: 'All',
        searchFilters: [],
        semanticSearch: false,
        isSearchFiltersOpen: true,
        isSideNavOpen: true,
        searchSubmitted: false,
      };

      const action = setSearchFilters({ searchFilters: [{ type: 'test' }] });
      const state = searchReducer(initialState, action);

      expect(state.searchFilters).toEqual([{ type: 'test' }]);
    });

    it('should handle setSemanticSearch action directly', () => {
      const initialState: SearchState = {
        searchTerm: '',
        searchResult: null,
        searchType: 'All',
        searchFilters: [],
        semanticSearch: false,
        isSearchFiltersOpen: true,
        isSideNavOpen: true,
        searchSubmitted: false,
      };

      const action = setSemanticSearch({ semanticSearch: true });
      const state = searchReducer(initialState, action);

      expect(state.semanticSearch).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined payload properties gracefully', () => {
      // This tests the actual behavior - dispatching with undefined
      store.dispatch(setSearchTerm({ searchTerm: undefined as any }));
      expect(store.getState().search.searchTerm).toBeUndefined();
    });

    it('should handle number as search term', () => {
      store.dispatch(setSearchTerm({ searchTerm: 12345 as any }));
      expect(store.getState().search.searchTerm).toBe(12345);
    });

    it('should preserve immutability', () => {
      const stateBefore = store.getState().search;
      store.dispatch(setSearchTerm({ searchTerm: 'new term' }));
      const stateAfter = store.getState().search;

      expect(stateBefore).not.toBe(stateAfter);
      expect(stateBefore.searchTerm).toBe('');
      expect(stateAfter.searchTerm).toBe('new term');
    });

    it('should handle unicode characters in search term', () => {
      store.dispatch(setSearchTerm({ searchTerm: '日本語テスト 中文测试 한국어' }));
      expect(store.getState().search.searchTerm).toBe('日本語テスト 中文测试 한국어');
    });

    it('should handle whitespace-only search term', () => {
      store.dispatch(setSearchTerm({ searchTerm: '   ' }));
      expect(store.getState().search.searchTerm).toBe('   ');
    });
  });
});
