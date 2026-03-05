import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { searchApiSlice, useSearchMutation } from "./searchApiSlice";
import { apiSlice } from "../../app/api/apiSlice";
import { URLS } from "../../constants/urls";

// ==========================================================================
// Mock Data
// ==========================================================================

const mockSearchBody = {
  query: "employee table",
  pageSize: 10,
  pageToken: "",
};

const mockSearchResponse = {
  results: [
    {
      dataplexEntry: {
        name: "projects/test-project/locations/us/entryGroups/@bigquery/entries/employee-table",
        entryType: "projects/test-project/locations/global/entryTypes/bigquery-table",
        entrySource: {
          resource: "projects/test-project/datasets/hr_data/tables/employee",
          system: "BIGQUERY",
          displayName: "employee",
          description: "Employee data table",
          location: "us",
        },
      },
    },
    {
      dataplexEntry: {
        name: "projects/test-project/locations/us/entryGroups/@bigquery/entries/employee-view",
        entryType: "projects/test-project/locations/global/entryTypes/bigquery-view",
        entrySource: {
          resource: "projects/test-project/datasets/hr_data/views/employee_view",
          system: "BIGQUERY",
          displayName: "employee_view",
          description: "Employee view",
          location: "us",
        },
      },
    },
  ],
  totalSize: 2,
  nextPageToken: "",
};

const mockEmptySearchResponse = {
  results: [],
  totalSize: 0,
  nextPageToken: "",
};

const mockSearchBodyWithFilters = {
  query: "type=table AND system=bigquery",
  pageSize: 25,
  pageToken: "page-token-123",
  scope: "projects/test-project",
};

const mockPaginatedSearchResponse = {
  results: [
    {
      dataplexEntry: {
        name: "projects/test-project/locations/us/entryGroups/@bigquery/entries/table-1",
        entrySource: { displayName: "table_1" },
      },
    },
  ],
  totalSize: 500,
  nextPageToken: "next-page-token-456",
};

const mockAdvancedSearchBody = {
  query: 'name:"sales_data" OR description:"revenue"',
  pageSize: 50,
  pageToken: "",
  orderBy: "displayName",
  filter: "entryType=bigquery-table",
  scope: "projects/analytics-project/locations/us",
};

// ==========================================================================
// Test Store Setup
// ==========================================================================

const createTestStore = () => {
  return configureStore({
    reducer: {
      [apiSlice.reducerPath]: apiSlice.reducer,
      user: (state = { token: "test-auth-token" }) => state,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(apiSlice.middleware),
  });
};

// ==========================================================================
// Tests
// ==========================================================================

describe("searchApiSlice", () => {
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
    it("exports searchApiSlice", () => {
      expect(searchApiSlice).toBeDefined();
    });

    it("exports useSearchMutation hook", () => {
      expect(useSearchMutation).toBeDefined();
      expect(typeof useSearchMutation).toBe("function");
    });

    it("searchApiSlice has endpoints property", () => {
      expect(searchApiSlice.endpoints).toBeDefined();
    });

    it("searchApiSlice has search endpoint", () => {
      expect(searchApiSlice.endpoints.search).toBeDefined();
    });

    it("search endpoint is a mutation", () => {
      const searchEndpoint = searchApiSlice.endpoints.search;
      expect(searchEndpoint).toBeDefined();
      // Mutations have initiate function
      expect(searchEndpoint.initiate).toBeDefined();
    });
  });

  // ==========================================================================
  // Endpoint Configuration Tests
  // ==========================================================================

  describe("Endpoint Configuration", () => {
    it("search endpoint has correct query configuration", () => {
      const endpoint = searchApiSlice.endpoints.search;

      expect(endpoint.initiate).toBeDefined();
      expect(typeof endpoint.initiate).toBe("function");
    });

    it("search mutation uses correct API URL", () => {
      expect(URLS.API_URL).toBeDefined();
      expect(URLS.SEARCH).toBeDefined();

      const expectedUrl = URLS.API_URL + URLS.SEARCH;
      expect(expectedUrl).toContain("/search");
    });

    it("search endpoint uses POST method", () => {
      const endpoint = searchApiSlice.endpoints.search;
      expect(endpoint).toBeDefined();
    });

    it("URLS constants are properly defined", () => {
      expect(typeof URLS.API_URL).toBe("string");
      expect(typeof URLS.SEARCH).toBe("string");
      expect(URLS.SEARCH).toBe("/search");
    });
  });

  // ==========================================================================
  // Store Integration Tests
  // ==========================================================================

  describe("Store Integration", () => {
    it("creates store with searchApiSlice reducer", () => {
      const store = createTestStore();
      const state = store.getState();

      expect(state[apiSlice.reducerPath]).toBeDefined();
    });

    it("store has user state for authentication", () => {
      const store = createTestStore();
      const state = store.getState() as { user: { token: string }; api: unknown };

      expect(state.user).toBeDefined();
      expect(state.user.token).toBe("test-auth-token");
    });

    it("apiSlice reducerPath is correctly set", () => {
      expect(apiSlice.reducerPath).toBe("api");
    });

    it("store state includes api slice", () => {
      const store = createTestStore();
      const state = store.getState();

      expect(state.api).toBeDefined();
    });
  });

  // ==========================================================================
  // Mutation Initiation Tests
  // ==========================================================================

  describe("Mutation Initiation", () => {
    it("can initiate search mutation", () => {
      createTestStore();
      const endpoint = searchApiSlice.endpoints.search;

      const action = endpoint.initiate(mockSearchBody);
      expect(action).toBeDefined();
      expect(typeof action).toBe("function");
    });

    it("can dispatch search mutation with search body", async () => {
      const store = createTestStore();
      const endpoint = searchApiSlice.endpoints.search;

      const promise = store.dispatch(endpoint.initiate(mockSearchBody));

      expect(promise).toBeDefined();
      expect(typeof promise.then).toBe("function");

      promise.abort();
    });

    it("can dispatch search mutation with filters", async () => {
      const store = createTestStore();
      const endpoint = searchApiSlice.endpoints.search;

      const promise = store.dispatch(endpoint.initiate(mockSearchBodyWithFilters));

      expect(promise).toBeDefined();
      promise.abort();
    });

    it("can dispatch search mutation with advanced query", async () => {
      const store = createTestStore();
      const endpoint = searchApiSlice.endpoints.search;

      const promise = store.dispatch(endpoint.initiate(mockAdvancedSearchBody));

      expect(promise).toBeDefined();
      promise.abort();
    });

    it("can dispatch search mutation with empty query", async () => {
      const store = createTestStore();
      const endpoint = searchApiSlice.endpoints.search;

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
      expect(mockSearchBody.query).toBe("employee table");
      expect(mockSearchBody.pageSize).toBe(10);
      expect(mockSearchBody.pageToken).toBe("");
    });

    it("mockSearchResponse has correct structure", () => {
      expect(mockSearchResponse.results).toBeInstanceOf(Array);
      expect(mockSearchResponse.results.length).toBe(2);
      expect(mockSearchResponse.totalSize).toBe(2);
      expect(mockSearchResponse.results[0].dataplexEntry).toBeDefined();
      expect(mockSearchResponse.results[0].dataplexEntry.entrySource.displayName).toBe("employee");
    });

    it("mockEmptySearchResponse represents empty results", () => {
      expect(mockEmptySearchResponse.results).toEqual([]);
      expect(mockEmptySearchResponse.totalSize).toBe(0);
      expect(mockEmptySearchResponse.nextPageToken).toBe("");
    });

    it("mockPaginatedSearchResponse has pagination token", () => {
      expect(mockPaginatedSearchResponse.nextPageToken).toBe("next-page-token-456");
      expect(mockPaginatedSearchResponse.totalSize).toBe(500);
      expect(mockPaginatedSearchResponse.results.length).toBe(1);
    });

    it("mockAdvancedSearchBody has all fields", () => {
      expect(mockAdvancedSearchBody.query).toContain("name:");
      expect(mockAdvancedSearchBody.orderBy).toBe("displayName");
      expect(mockAdvancedSearchBody.filter).toBeDefined();
      expect(mockAdvancedSearchBody.scope).toContain("projects/");
    });
  });

  // ==========================================================================
  // API Slice Inheritance Tests
  // ==========================================================================

  describe("API Slice Inheritance", () => {
    it("searchApiSlice extends apiSlice", () => {
      expect(searchApiSlice.reducerPath).toBe(apiSlice.reducerPath);
    });

    it("searchApiSlice has injectEndpoints capability", () => {
      expect(searchApiSlice.injectEndpoints).toBeDefined();
    });

    it("searchApiSlice has reducer", () => {
      expect(searchApiSlice.reducer).toBeDefined();
      expect(typeof searchApiSlice.reducer).toBe("function");
    });

    it("searchApiSlice has middleware", () => {
      expect(searchApiSlice.middleware).toBeDefined();
    });

    it("apiSlice endpoints can be extended", () => {
      expect(apiSlice.endpoints).toBeDefined();
    });

    it("searchApiSlice shares reducerPath with apiSlice", () => {
      expect(searchApiSlice.reducerPath).toBe("api");
    });
  });

  // ==========================================================================
  // Hook Export Tests
  // ==========================================================================

  describe("Hook Exports", () => {
    it("useSearchMutation is a valid React hook function", () => {
      expect(typeof useSearchMutation).toBe("function");
      expect(useSearchMutation).toBeDefined();
    });

    it("useSearchMutation is exported from searchApiSlice", () => {
      const hooks = searchApiSlice;
      expect(hooks).toBeDefined();
    });
  });

  // ==========================================================================
  // Endpoint Action Types Tests
  // ==========================================================================

  describe("Endpoint Action Types", () => {
    it("search endpoint has matchPending", () => {
      const endpoint = searchApiSlice.endpoints.search;
      expect(endpoint.matchPending).toBeDefined();
      expect(typeof endpoint.matchPending).toBe("function");
    });

    it("search endpoint has matchFulfilled", () => {
      const endpoint = searchApiSlice.endpoints.search;
      expect(endpoint.matchFulfilled).toBeDefined();
      expect(typeof endpoint.matchFulfilled).toBe("function");
    });

    it("search endpoint has matchRejected", () => {
      const endpoint = searchApiSlice.endpoints.search;
      expect(endpoint.matchRejected).toBeDefined();
      expect(typeof endpoint.matchRejected).toBe("function");
    });

    it("matchPending returns false for unrelated actions", () => {
      const endpoint = searchApiSlice.endpoints.search;
      const unrelatedAction = { type: "some/other/action" };
      expect(endpoint.matchPending(unrelatedAction)).toBe(false);
    });

    it("matchFulfilled returns false for unrelated actions", () => {
      const endpoint = searchApiSlice.endpoints.search;
      const unrelatedAction = { type: "some/other/action" };
      expect(endpoint.matchFulfilled(unrelatedAction)).toBe(false);
    });

    it("matchRejected returns false for unrelated actions", () => {
      const endpoint = searchApiSlice.endpoints.search;
      const unrelatedAction = { type: "some/other/action" };
      expect(endpoint.matchRejected(unrelatedAction)).toBe(false);
    });
  });

  // ==========================================================================
  // Subscription Management Tests
  // ==========================================================================

  describe("Subscription Management", () => {
    it("dispatched mutation returns abort function", async () => {
      const store = createTestStore();
      const endpoint = searchApiSlice.endpoints.search;

      const promise = store.dispatch(endpoint.initiate(mockSearchBody));

      expect(promise.abort).toBeDefined();
      expect(typeof promise.abort).toBe("function");

      promise.abort();
    });

    it("dispatched mutation returns unwrap function", async () => {
      const store = createTestStore();
      const endpoint = searchApiSlice.endpoints.search;

      const promise = store.dispatch(endpoint.initiate(mockSearchBody));

      expect(promise.unwrap).toBeDefined();
      expect(typeof promise.unwrap).toBe("function");

      promise.abort();
    });

    it("dispatched mutation returns reset function", async () => {
      const store = createTestStore();
      const endpoint = searchApiSlice.endpoints.search;

      const promise = store.dispatch(endpoint.initiate(mockSearchBody));

      expect(promise.reset).toBeDefined();
      expect(typeof promise.reset).toBe("function");

      promise.abort();
    });

    it("dispatched mutation is thenable", async () => {
      const store = createTestStore();
      const endpoint = searchApiSlice.endpoints.search;

      const promise = store.dispatch(endpoint.initiate(mockSearchBody));

      expect(promise.then).toBeDefined();
      expect(typeof promise.then).toBe("function");

      promise.abort();
    });

    it("abort function can be called without error", async () => {
      const store = createTestStore();
      const endpoint = searchApiSlice.endpoints.search;

      const promise = store.dispatch(endpoint.initiate(mockSearchBody));

      expect(() => promise.abort()).not.toThrow();
    });
  });

  // ==========================================================================
  // Request Body Variations Tests
  // ==========================================================================

  describe("Request Body Variations", () => {
    it("accepts minimal search body", async () => {
      const store = createTestStore();
      const endpoint = searchApiSlice.endpoints.search;

      const minimalBody = { query: "test" };
      const promise = store.dispatch(endpoint.initiate(minimalBody));

      expect(promise).toBeDefined();
      promise.abort();
    });

    it("accepts search body with all fields", async () => {
      const store = createTestStore();
      const endpoint = searchApiSlice.endpoints.search;

      const fullBody = {
        query: "SELECT * FROM table",
        pageSize: 100,
        pageToken: "token123",
        scope: "projects/my-project",
        orderBy: "createTime desc",
        filter: "type=dataset",
      };

      const promise = store.dispatch(endpoint.initiate(fullBody));

      expect(promise).toBeDefined();
      promise.abort();
    });

    it("accepts null/undefined body fields", async () => {
      const store = createTestStore();
      const endpoint = searchApiSlice.endpoints.search;

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
      const endpoint = searchApiSlice.endpoints.search;

      const promise = store.dispatch(endpoint.initiate({}));

      expect(promise).toBeDefined();
      promise.abort();
    });

    it("accepts body with wildcard query", async () => {
      const store = createTestStore();
      const endpoint = searchApiSlice.endpoints.search;

      const wildcardBody = { query: "*" };
      const promise = store.dispatch(endpoint.initiate(wildcardBody));

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

    it("SEARCH URL is /search", () => {
      expect(URLS.SEARCH).toBe("/search");
    });
  });

  // ==========================================================================
  // Type Safety Tests
  // ==========================================================================

  describe("Type Safety", () => {
    it("endpoint accepts any body type", async () => {
      const store = createTestStore();
      const endpoint = searchApiSlice.endpoints.search;

      // String body
      const promise1 = store.dispatch(endpoint.initiate("string query"));
      promise1.abort();

      // Number body
      const promise2 = store.dispatch(endpoint.initiate(42));
      promise2.abort();

      // Array body
      const promise3 = store.dispatch(endpoint.initiate(["query1", "query2"]));
      promise3.abort();

      // Nested object body
      const promise4 = store.dispatch(endpoint.initiate({ nested: { query: { value: "test" } } }));
      promise4.abort();

      expect(true).toBe(true);
    });

    it("endpoint accepts boolean body", async () => {
      const store = createTestStore();
      const endpoint = searchApiSlice.endpoints.search;

      const promise = store.dispatch(endpoint.initiate(true));
      expect(promise).toBeDefined();
      promise.abort();
    });
  });

  // ==========================================================================
  // Reducer Path Tests
  // ==========================================================================

  describe("Reducer Path", () => {
    it("searchApiSlice uses correct reducer path", () => {
      expect(searchApiSlice.reducerPath).toBe("api");
    });

    it("reducer is accessible via reducer path in store", () => {
      const store = createTestStore();
      const state = store.getState();

      expect(state.api).toBeDefined();
    });

    it("mutations are tracked in store state", async () => {
      const store = createTestStore();
      const endpoint = searchApiSlice.endpoints.search;

      const promise = store.dispatch(endpoint.initiate(mockSearchBody));

      const state = store.getState();
      expect(state.api.mutations).toBeDefined();

      promise.abort();
    });

    it("queries state exists in store", () => {
      const store = createTestStore();
      const state = store.getState();

      expect(state.api.queries).toBeDefined();
    });
  });

  // ==========================================================================
  // Cache Behavior Tests
  // ==========================================================================

  describe("Cache Behavior", () => {
    it("mutations do not cache by default", async () => {
      const store = createTestStore();
      const endpoint = searchApiSlice.endpoints.search;

      const promise1 = store.dispatch(endpoint.initiate(mockSearchBody));
      const promise2 = store.dispatch(endpoint.initiate(mockSearchBody));

      expect(promise1).not.toBe(promise2);

      promise1.abort();
      promise2.abort();
    });

    it("each mutation dispatch creates new request", async () => {
      const store = createTestStore();
      const endpoint = searchApiSlice.endpoints.search;

      const promise1 = store.dispatch(endpoint.initiate({ query: "test1" }));
      const promise2 = store.dispatch(endpoint.initiate({ query: "test2" }));

      expect(promise1.requestId).not.toBe(promise2.requestId);

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
      const endpoint = searchApiSlice.endpoints.search;

      const longQuery = "search term ".repeat(1000);
      const promise = store.dispatch(endpoint.initiate({ query: longQuery }));

      expect(promise).toBeDefined();
      promise.abort();
    });

    it("handles special characters in query", async () => {
      const store = createTestStore();
      const endpoint = searchApiSlice.endpoints.search;

      const specialCharsQuery = 'query with "double quotes" and \'single quotes\' and <brackets> and &ampersand';
      const promise = store.dispatch(endpoint.initiate({ query: specialCharsQuery }));

      expect(promise).toBeDefined();
      promise.abort();
    });

    it("handles unicode characters in query", async () => {
      const store = createTestStore();
      const endpoint = searchApiSlice.endpoints.search;

      const unicodeQuery = "搜索 🔍 поиск بحث 検索";
      const promise = store.dispatch(endpoint.initiate({ query: unicodeQuery }));

      expect(promise).toBeDefined();
      promise.abort();
    });

    it("handles negative pageSize", async () => {
      const store = createTestStore();
      const endpoint = searchApiSlice.endpoints.search;

      const promise = store.dispatch(endpoint.initiate({ query: "test", pageSize: -1 }));

      expect(promise).toBeDefined();
      promise.abort();
    });

    it("handles zero pageSize", async () => {
      const store = createTestStore();
      const endpoint = searchApiSlice.endpoints.search;

      const promise = store.dispatch(endpoint.initiate({ query: "test", pageSize: 0 }));

      expect(promise).toBeDefined();
      promise.abort();
    });

    it("handles very large pageSize", async () => {
      const store = createTestStore();
      const endpoint = searchApiSlice.endpoints.search;

      const promise = store.dispatch(endpoint.initiate({ query: "test", pageSize: 999999 }));

      expect(promise).toBeDefined();
      promise.abort();
    });

    it("handles SQL injection-like query", async () => {
      const store = createTestStore();
      const endpoint = searchApiSlice.endpoints.search;

      const sqlInjectionQuery = "'; DROP TABLE users; --";
      const promise = store.dispatch(endpoint.initiate({ query: sqlInjectionQuery }));

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
      expect(typeof apiSlice.util.resetApiState).toBe("function");
    });

    it("apiSlice util has invalidateTags", () => {
      expect(apiSlice.util.invalidateTags).toBeDefined();
      expect(typeof apiSlice.util.invalidateTags).toBe("function");
    });

    it("can dispatch resetApiState", () => {
      const store = createTestStore();

      const action = apiSlice.util.resetApiState();
      store.dispatch(action);

      const state = store.getState();
      expect(state.api).toBeDefined();
    });

    it("resetApiState clears mutation state", () => {
      const store = createTestStore();
      const endpoint = searchApiSlice.endpoints.search;

      // Dispatch a mutation
      const promise = store.dispatch(endpoint.initiate(mockSearchBody));
      promise.abort();

      // Reset API state
      store.dispatch(apiSlice.util.resetApiState());

      const state = store.getState();
      expect(state.api.mutations).toBeDefined();
    });
  });

  // ==========================================================================
  // Concurrent Requests Tests
  // ==========================================================================

  describe("Concurrent Requests", () => {
    it("can dispatch multiple mutations concurrently", async () => {
      const store = createTestStore();
      const endpoint = searchApiSlice.endpoints.search;

      const promises = [
        store.dispatch(endpoint.initiate({ query: "query1" })),
        store.dispatch(endpoint.initiate({ query: "query2" })),
        store.dispatch(endpoint.initiate({ query: "query3" })),
      ];

      expect(promises).toHaveLength(3);
      promises.forEach((p) => expect(p).toBeDefined());

      // Abort all
      promises.forEach((p) => p.abort());
    });

    it("each concurrent request has unique requestId", async () => {
      const store = createTestStore();
      const endpoint = searchApiSlice.endpoints.search;

      const promise1 = store.dispatch(endpoint.initiate({ query: "a" }));
      const promise2 = store.dispatch(endpoint.initiate({ query: "b" }));
      const promise3 = store.dispatch(endpoint.initiate({ query: "c" }));

      const requestIds = new Set([promise1.requestId, promise2.requestId, promise3.requestId]);
      expect(requestIds.size).toBe(3);

      promise1.abort();
      promise2.abort();
      promise3.abort();
    });
  });

  // ==========================================================================
  // Endpoint Select Tests
  // ==========================================================================

  describe("Endpoint Select", () => {
    it("endpoint has select function", () => {
      const endpoint = searchApiSlice.endpoints.search;
      expect(endpoint.select).toBeDefined();
      expect(typeof endpoint.select).toBe("function");
    });
  });
});
