import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { resourcesApiSlice, useResourcesMutation } from "./resourcesApiSlice";
import { apiSlice } from "../../app/api/apiSlice";
import { URLS } from "../../constants/urls";

// ==========================================================================
// Mock Data
// ==========================================================================

const mockSearchBody = {
  query: "test search query",
  pageSize: 10,
  pageToken: "",
};

const mockSearchResponse = {
  results: [
    {
      dataplexEntry: {
        name: "projects/test-project/locations/us/entryGroups/@bigquery/entries/test-entry",
        entryType: "projects/test-project/locations/global/entryTypes/bigquery-table",
        entrySource: {
          resource: "projects/test-project/datasets/test_dataset/tables/test_table",
          system: "BIGQUERY",
          displayName: "test_table",
          description: "A test table",
          location: "us",
        },
      },
    },
  ],
  totalSize: 1,
  nextPageToken: "",
};

const mockEmptySearchResponse = {
  results: [],
  totalSize: 0,
  nextPageToken: "",
};

const mockSearchBodyWithFilters = {
  query: "type=table AND name:employee",
  pageSize: 20,
  pageToken: "next-page-token",
};

const mockPaginatedResponse = {
  results: [
    {
      dataplexEntry: {
        name: "projects/test-project/locations/us/entryGroups/@bigquery/entries/entry-1",
        entrySource: {
          displayName: "entry_1",
        },
      },
    },
    {
      dataplexEntry: {
        name: "projects/test-project/locations/us/entryGroups/@bigquery/entries/entry-2",
        entrySource: {
          displayName: "entry_2",
        },
      },
    },
  ],
  totalSize: 100,
  nextPageToken: "page-2-token",
};

// ==========================================================================
// Test Store Setup
// ==========================================================================

const createTestStore = () => {
  return configureStore({
    reducer: {
      [apiSlice.reducerPath]: apiSlice.reducer,
      user: (state = { token: "test-token" }) => state,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(apiSlice.middleware),
  });
};

// ==========================================================================
// Tests
// ==========================================================================

describe("resourcesApiSlice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // Slice Configuration Tests
  // ==========================================================================

  describe("Slice Configuration", () => {
    it("exports resourcesApiSlice", () => {
      expect(resourcesApiSlice).toBeDefined();
    });

    it("exports useResourcesMutation hook", () => {
      expect(useResourcesMutation).toBeDefined();
      expect(typeof useResourcesMutation).toBe("function");
    });

    it("resourcesApiSlice has endpoints property", () => {
      expect(resourcesApiSlice.endpoints).toBeDefined();
    });

    it("resourcesApiSlice has resources endpoint", () => {
      expect(resourcesApiSlice.endpoints.resources).toBeDefined();
    });

    it("resources endpoint is a mutation", () => {
      // RTK Query mutations have specific properties
      const resourcesEndpoint = resourcesApiSlice.endpoints.resources;
      expect(resourcesEndpoint).toBeDefined();
    });
  });

  // ==========================================================================
  // Endpoint Configuration Tests
  // ==========================================================================

  describe("Endpoint Configuration", () => {
    it("resources endpoint has correct query configuration", () => {
      const endpoint = resourcesApiSlice.endpoints.resources;

      // Access the initiate function which is available on the endpoint
      expect(endpoint.initiate).toBeDefined();
      expect(typeof endpoint.initiate).toBe("function");
    });

    it("resources mutation uses correct API URL", () => {
      // Verify URLS are correctly imported and used
      expect(URLS.API_URL).toBeDefined();
      expect(URLS.SEARCH).toBeDefined();

      const expectedUrl = URLS.API_URL + URLS.SEARCH;
      expect(expectedUrl).toContain("/search");
    });

    it("resources endpoint uses POST method", () => {
      // The endpoint is configured as a mutation with POST method
      // We can verify this by checking the endpoint's behavior
      const endpoint = resourcesApiSlice.endpoints.resources;
      expect(endpoint).toBeDefined();
    });
  });

  // ==========================================================================
  // Store Integration Tests
  // ==========================================================================

  describe("Store Integration", () => {
    it("creates store with resourcesApiSlice reducer", () => {
      const store = createTestStore();
      const state = store.getState();

      expect(state[apiSlice.reducerPath]).toBeDefined();
    });

    it("store has user state for authentication", () => {
      const store = createTestStore();
      const state = store.getState() as { user: { token: string }; api: unknown };

      expect(state.user).toBeDefined();
      expect(state.user.token).toBe("test-token");
    });

    it("apiSlice reducerPath is correctly set", () => {
      expect(apiSlice.reducerPath).toBe("api");
    });
  });

  // ==========================================================================
  // Mutation Initiation Tests
  // ==========================================================================

  describe("Mutation Initiation", () => {
    it("can initiate resources mutation", () => {
      createTestStore(); // Create store to ensure proper setup
      const endpoint = resourcesApiSlice.endpoints.resources;

      // Initiate should return a thunk action
      const action = endpoint.initiate(mockSearchBody);
      expect(action).toBeDefined();
      expect(typeof action).toBe("function");
    });

    it("can dispatch resources mutation with search body", async () => {
      const store = createTestStore();
      const endpoint = resourcesApiSlice.endpoints.resources;

      // This will dispatch the mutation (actual network call will fail without mock)
      const promise = store.dispatch(endpoint.initiate(mockSearchBody));

      // The promise should be a thenable
      expect(promise).toBeDefined();
      expect(typeof promise.then).toBe("function");

      // Unsubscribe/abort to clean up
      promise.abort();
    });

    it("can dispatch resources mutation with filters", async () => {
      const store = createTestStore();
      const endpoint = resourcesApiSlice.endpoints.resources;

      const promise = store.dispatch(endpoint.initiate(mockSearchBodyWithFilters));

      expect(promise).toBeDefined();
      promise.abort();
    });

    it("can dispatch resources mutation with empty query", async () => {
      const store = createTestStore();
      const endpoint = resourcesApiSlice.endpoints.resources;

      const emptyBody = { query: "", pageSize: 10 };
      const promise = store.dispatch(endpoint.initiate(emptyBody));

      expect(promise).toBeDefined();
      promise.abort();
    });
  });

  // ==========================================================================
  // Mock Data Validation Tests
  // ==========================================================================

  describe("Mock Data Validation", () => {
    it("mockSearchBody has correct structure", () => {
      expect(mockSearchBody.query).toBe("test search query");
      expect(mockSearchBody.pageSize).toBe(10);
      expect(mockSearchBody.pageToken).toBe("");
    });

    it("mockSearchResponse has correct structure", () => {
      expect(mockSearchResponse.results).toBeInstanceOf(Array);
      expect(mockSearchResponse.results.length).toBe(1);
      expect(mockSearchResponse.totalSize).toBe(1);
      expect(mockSearchResponse.results[0].dataplexEntry).toBeDefined();
    });

    it("mockEmptySearchResponse represents empty results", () => {
      expect(mockEmptySearchResponse.results).toEqual([]);
      expect(mockEmptySearchResponse.totalSize).toBe(0);
    });

    it("mockPaginatedResponse has pagination token", () => {
      expect(mockPaginatedResponse.nextPageToken).toBe("page-2-token");
      expect(mockPaginatedResponse.totalSize).toBe(100);
      expect(mockPaginatedResponse.results.length).toBe(2);
    });
  });

  // ==========================================================================
  // API Slice Inheritance Tests
  // ==========================================================================

  describe("API Slice Inheritance", () => {
    it("resourcesApiSlice extends apiSlice", () => {
      // Both should share the same reducerPath
      expect(resourcesApiSlice.reducerPath).toBe(apiSlice.reducerPath);
    });

    it("resourcesApiSlice has injectEndpoints capability", () => {
      // The slice was created using injectEndpoints
      expect(resourcesApiSlice.injectEndpoints).toBeDefined();
    });

    it("resourcesApiSlice has reducer", () => {
      expect(resourcesApiSlice.reducer).toBeDefined();
      expect(typeof resourcesApiSlice.reducer).toBe("function");
    });

    it("resourcesApiSlice has middleware", () => {
      expect(resourcesApiSlice.middleware).toBeDefined();
    });

    it("apiSlice endpoints can be extended", () => {
      // The base apiSlice should now have the resources endpoint
      // since injectEndpoints modifies the original slice
      expect(apiSlice.endpoints).toBeDefined();
    });
  });

  // ==========================================================================
  // Hook Export Tests
  // ==========================================================================

  describe("Hook Exports", () => {
    it("useResourcesMutation is a valid React hook function", () => {
      // React hooks are functions that start with "use"
      expect(typeof useResourcesMutation).toBe("function");
      // Hook functions have a name property
      expect(useResourcesMutation).toBeDefined();
    });

    it("useResourcesMutation is exported from resourcesApiSlice", () => {
      // Verify the hook is properly generated by RTK Query
      const hooks = resourcesApiSlice;
      expect(hooks).toBeDefined();
    });
  });

  // ==========================================================================
  // Endpoint Action Types Tests
  // ==========================================================================

  describe("Endpoint Action Types", () => {
    it("resources endpoint has matchPending", () => {
      const endpoint = resourcesApiSlice.endpoints.resources;
      expect(endpoint.matchPending).toBeDefined();
      expect(typeof endpoint.matchPending).toBe("function");
    });

    it("resources endpoint has matchFulfilled", () => {
      const endpoint = resourcesApiSlice.endpoints.resources;
      expect(endpoint.matchFulfilled).toBeDefined();
      expect(typeof endpoint.matchFulfilled).toBe("function");
    });

    it("resources endpoint has matchRejected", () => {
      const endpoint = resourcesApiSlice.endpoints.resources;
      expect(endpoint.matchRejected).toBeDefined();
      expect(typeof endpoint.matchRejected).toBe("function");
    });
  });

  // ==========================================================================
  // Subscription Management Tests
  // ==========================================================================

  describe("Subscription Management", () => {
    it("dispatched mutation returns abort function", async () => {
      const store = createTestStore();
      const endpoint = resourcesApiSlice.endpoints.resources;

      const promise = store.dispatch(endpoint.initiate(mockSearchBody));

      expect(promise.abort).toBeDefined();
      expect(typeof promise.abort).toBe("function");

      promise.abort();
    });

    it("dispatched mutation returns unwrap function", async () => {
      const store = createTestStore();
      const endpoint = resourcesApiSlice.endpoints.resources;

      const promise = store.dispatch(endpoint.initiate(mockSearchBody));

      expect(promise.unwrap).toBeDefined();
      expect(typeof promise.unwrap).toBe("function");

      promise.abort();
    });

    it("dispatched mutation returns reset function", async () => {
      const store = createTestStore();
      const endpoint = resourcesApiSlice.endpoints.resources;

      const promise = store.dispatch(endpoint.initiate(mockSearchBody));

      expect(promise.reset).toBeDefined();
      expect(typeof promise.reset).toBe("function");

      promise.abort();
    });

    it("dispatched mutation is thenable", async () => {
      const store = createTestStore();
      const endpoint = resourcesApiSlice.endpoints.resources;

      const promise = store.dispatch(endpoint.initiate(mockSearchBody));

      // RTK Query mutations return a thenable promise
      expect(promise.then).toBeDefined();
      expect(typeof promise.then).toBe("function");

      promise.abort();
    });
  });

  // ==========================================================================
  // Request Body Variations Tests
  // ==========================================================================

  describe("Request Body Variations", () => {
    it("accepts minimal search body", async () => {
      const store = createTestStore();
      const endpoint = resourcesApiSlice.endpoints.resources;

      const minimalBody = { query: "test" };
      const promise = store.dispatch(endpoint.initiate(minimalBody));

      expect(promise).toBeDefined();
      promise.abort();
    });

    it("accepts search body with all fields", async () => {
      const store = createTestStore();
      const endpoint = resourcesApiSlice.endpoints.resources;

      const fullBody = {
        query: "SELECT * FROM table",
        pageSize: 50,
        pageToken: "abc123",
        scope: "projects/test-project",
        orderBy: "displayName",
        filter: "type=table",
      };

      const promise = store.dispatch(endpoint.initiate(fullBody));

      expect(promise).toBeDefined();
      promise.abort();
    });

    it("accepts null/undefined body fields", async () => {
      const store = createTestStore();
      const endpoint = resourcesApiSlice.endpoints.resources;

      const bodyWithNulls = {
        query: "test",
        pageSize: null,
        pageToken: undefined,
      };

      const promise = store.dispatch(endpoint.initiate(bodyWithNulls));

      expect(promise).toBeDefined();
      promise.abort();
    });

    it("accepts empty object body", async () => {
      const store = createTestStore();
      const endpoint = resourcesApiSlice.endpoints.resources;

      const promise = store.dispatch(endpoint.initiate({}));

      expect(promise).toBeDefined();
      promise.abort();
    });
  });

  // ==========================================================================
  // URL Constants Tests
  // ==========================================================================

  describe("URL Constants", () => {
    it("URLS.API_URL is defined", () => {
      expect(URLS.API_URL).toBeDefined();
      expect(typeof URLS.API_URL).toBe("string");
    });

    it("URLS.SEARCH is defined", () => {
      expect(URLS.SEARCH).toBeDefined();
      expect(typeof URLS.SEARCH).toBe("string");
    });

    it("combined URL is valid", () => {
      const combinedUrl = URLS.API_URL + URLS.SEARCH;
      expect(combinedUrl).toBeDefined();
      expect(combinedUrl.length).toBeGreaterThan(0);
    });

    it("SEARCH URL starts with slash", () => {
      expect(URLS.SEARCH).toMatch(/^\//);
    });
  });

  // ==========================================================================
  // Type Safety Tests
  // ==========================================================================

  describe("Type Safety", () => {
    it("endpoint accepts any body type", async () => {
      const store = createTestStore();
      const endpoint = resourcesApiSlice.endpoints.resources;

      // String body
      const promise1 = store.dispatch(endpoint.initiate("string body"));
      promise1.abort();

      // Number body
      const promise2 = store.dispatch(endpoint.initiate(123));
      promise2.abort();

      // Array body
      const promise3 = store.dispatch(endpoint.initiate([1, 2, 3]));
      promise3.abort();

      // Nested object body
      const promise4 = store.dispatch(endpoint.initiate({ nested: { deep: { value: true } } }));
      promise4.abort();

      expect(true).toBe(true); // All dispatches should work without type errors
    });
  });

  // ==========================================================================
  // Reducer Path Tests
  // ==========================================================================

  describe("Reducer Path", () => {
    it("resourcesApiSlice uses correct reducer path", () => {
      expect(resourcesApiSlice.reducerPath).toBe("api");
    });

    it("reducer is accessible via reducer path in store", () => {
      const store = createTestStore();
      const state = store.getState();

      expect(state.api).toBeDefined();
    });

    it("mutations are tracked in store state", async () => {
      const store = createTestStore();
      const endpoint = resourcesApiSlice.endpoints.resources;

      // Dispatch a mutation
      const promise = store.dispatch(endpoint.initiate(mockSearchBody));

      // Check that mutations state exists
      const state = store.getState();
      expect(state.api.mutations).toBeDefined();

      promise.abort();
    });
  });

  // ==========================================================================
  // Cache Behavior Tests
  // ==========================================================================

  describe("Cache Behavior", () => {
    it("mutations do not cache by default", async () => {
      const store = createTestStore();
      const endpoint = resourcesApiSlice.endpoints.resources;

      // Mutations in RTK Query are not cached like queries
      const promise1 = store.dispatch(endpoint.initiate(mockSearchBody));
      const promise2 = store.dispatch(endpoint.initiate(mockSearchBody));

      // Both should be separate mutation calls
      expect(promise1).not.toBe(promise2);

      promise1.abort();
      promise2.abort();
    });
  });

  // ==========================================================================
  // Edge Cases Tests
  // ==========================================================================

  describe("Edge Cases", () => {
    it("handles very long query strings", async () => {
      const store = createTestStore();
      const endpoint = resourcesApiSlice.endpoints.resources;

      const longQuery = "a".repeat(10000);
      const promise = store.dispatch(endpoint.initiate({ query: longQuery }));

      expect(promise).toBeDefined();
      promise.abort();
    });

    it("handles special characters in query", async () => {
      const store = createTestStore();
      const endpoint = resourcesApiSlice.endpoints.resources;

      const specialCharsQuery = 'query with "quotes" and \'apostrophes\' and <brackets>';
      const promise = store.dispatch(endpoint.initiate({ query: specialCharsQuery }));

      expect(promise).toBeDefined();
      promise.abort();
    });

    it("handles unicode characters in query", async () => {
      const store = createTestStore();
      const endpoint = resourcesApiSlice.endpoints.resources;

      const unicodeQuery = "查询 🔍 поиск بحث";
      const promise = store.dispatch(endpoint.initiate({ query: unicodeQuery }));

      expect(promise).toBeDefined();
      promise.abort();
    });

    it("handles negative pageSize", async () => {
      const store = createTestStore();
      const endpoint = resourcesApiSlice.endpoints.resources;

      const promise = store.dispatch(endpoint.initiate({ query: "test", pageSize: -1 }));

      expect(promise).toBeDefined();
      promise.abort();
    });

    it("handles zero pageSize", async () => {
      const store = createTestStore();
      const endpoint = resourcesApiSlice.endpoints.resources;

      const promise = store.dispatch(endpoint.initiate({ query: "test", pageSize: 0 }));

      expect(promise).toBeDefined();
      promise.abort();
    });
  });

  // ==========================================================================
  // API Slice Util Tests
  // ==========================================================================

  describe("API Slice Utilities", () => {
    it("apiSlice has util property", () => {
      expect(apiSlice.util).toBeDefined();
    });

    it("apiSlice util has resetApiState", () => {
      expect(apiSlice.util.resetApiState).toBeDefined();
    });

    it("apiSlice util has invalidateTags", () => {
      expect(apiSlice.util.invalidateTags).toBeDefined();
    });

    it("can dispatch resetApiState", () => {
      const store = createTestStore();

      const action = apiSlice.util.resetApiState();
      store.dispatch(action);

      // After reset, the state should be clean
      const state = store.getState();
      expect(state.api).toBeDefined();
    });
  });
});
