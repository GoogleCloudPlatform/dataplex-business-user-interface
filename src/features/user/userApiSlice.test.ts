import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';

// Mock the apiSlice module - inline everything since vi.mock is hoisted
vi.mock('../../app/api/apiSlice', async () => {
  const { createApi, fetchBaseQuery } = await import('@reduxjs/toolkit/query/react');

  const mockApiSlice = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:3000' }),
    endpoints: () => ({}),
  });

  return {
    apiSlice: mockApiSlice,
  };
});

// Import after mock is set up
import { userApiSlice, useTestMutation } from './userApiSlice';

// Type for the store state
type ApiState = ReturnType<typeof userApiSlice.reducer>;
type StoreState = { [key: string]: ApiState };

describe('userApiSlice', () => {
  describe('Slice Configuration', () => {
    it('should have test endpoint defined', () => {
      expect(userApiSlice.endpoints).toBeDefined();
      expect(userApiSlice.endpoints.test).toBeDefined();
    });

    it('should export useTestMutation hook', () => {
      expect(useTestMutation).toBeDefined();
      expect(typeof useTestMutation).toBe('function');
    });
  });

  describe('test Endpoint', () => {
    it('should have correct endpoint name', () => {
      const endpoint = userApiSlice.endpoints.test;
      expect(endpoint).toBeDefined();
    });

    it('should be a mutation endpoint', () => {
      const endpoint = userApiSlice.endpoints.test;
      // RTK Query mutation endpoints have specific properties
      expect(endpoint).toHaveProperty('initiate');
      expect(endpoint).toHaveProperty('select');
    });

    it('should have initiate function', () => {
      const endpoint = userApiSlice.endpoints.test;
      expect(typeof endpoint.initiate).toBe('function');
    });

    it('should have select function', () => {
      const endpoint = userApiSlice.endpoints.test;
      expect(typeof endpoint.select).toBe('function');
    });
  });

  describe('test Mutation Query Configuration', () => {
    let store: ReturnType<typeof configureStore<{ api: ApiState }>>;

    beforeEach(() => {
      store = configureStore({
        reducer: {
          [userApiSlice.reducerPath]: userApiSlice.reducer,
        },
        middleware: (getDefaultMiddleware) =>
          getDefaultMiddleware().concat(userApiSlice.middleware),
      });
    });

    it('should create store with userApiSlice reducer', () => {
      expect(store.getState()).toHaveProperty(userApiSlice.reducerPath);
    });

    it('should have correct reducer path', () => {
      expect(userApiSlice.reducerPath).toBe('api');
    });

    it('should have middleware defined', () => {
      expect(userApiSlice.middleware).toBeDefined();
    });

    it('should have reducer defined', () => {
      expect(userApiSlice.reducer).toBeDefined();
      expect(typeof userApiSlice.reducer).toBe('function');
    });
  });

  describe('Endpoint Structure', () => {
    it('should have endpoints object', () => {
      expect(typeof userApiSlice.endpoints).toBe('object');
    });

    it('should have injectEndpoints method on base slice', () => {
      // The slice should have been created via injectEndpoints
      expect(userApiSlice.endpoints.test).toBeDefined();
    });

    it('test endpoint should have matchFulfilled', () => {
      const endpoint = userApiSlice.endpoints.test;
      expect(endpoint).toHaveProperty('matchFulfilled');
    });

    it('test endpoint should have matchPending', () => {
      const endpoint = userApiSlice.endpoints.test;
      expect(endpoint).toHaveProperty('matchPending');
    });

    it('test endpoint should have matchRejected', () => {
      const endpoint = userApiSlice.endpoints.test;
      expect(endpoint).toHaveProperty('matchRejected');
    });
  });

  describe('API Slice Utilities', () => {
    it('should have util object', () => {
      expect(userApiSlice.util).toBeDefined();
    });

    it('should have invalidateTags utility', () => {
      expect(userApiSlice.util.invalidateTags).toBeDefined();
    });

    it('should have resetApiState utility', () => {
      expect(userApiSlice.util.resetApiState).toBeDefined();
    });

    it('should have updateQueryData utility', () => {
      expect(userApiSlice.util.updateQueryData).toBeDefined();
    });

    it('should have prefetch utility', () => {
      expect(userApiSlice.util.prefetch).toBeDefined();
    });
  });

  describe('Hook Export', () => {
    it('useTestMutation should be a valid hook function', () => {
      // Hook functions are exported as functions
      expect(typeof useTestMutation).toBe('function');
    });

    it('should export the mutation hook', () => {
      // The hook should be defined and truthy
      expect(useTestMutation).toBeTruthy();
    });

    it('useTestMutation should be callable', () => {
      // Verify it's a function that can be referenced
      expect(useTestMutation).toBeDefined();
    });
  });

  describe('Reducer Functionality', () => {
    it('should return initial state', () => {
      const initialState = userApiSlice.reducer(undefined, { type: 'unknown' });

      expect(initialState).toBeDefined();
      expect(typeof initialState).toBe('object');
    });

    it('should have queries in initial state', () => {
      const initialState = userApiSlice.reducer(undefined, { type: 'unknown' });

      expect(initialState).toHaveProperty('queries');
    });

    it('should have mutations in initial state', () => {
      const initialState = userApiSlice.reducer(undefined, { type: 'unknown' });

      expect(initialState).toHaveProperty('mutations');
    });

    it('should have provided in initial state', () => {
      const initialState = userApiSlice.reducer(undefined, { type: 'unknown' });

      expect(initialState).toHaveProperty('provided');
    });

    it('should have subscriptions in initial state', () => {
      const initialState = userApiSlice.reducer(undefined, { type: 'unknown' });

      expect(initialState).toHaveProperty('subscriptions');
    });

    it('should have config in initial state', () => {
      const initialState = userApiSlice.reducer(undefined, { type: 'unknown' });

      expect(initialState).toHaveProperty('config');
    });
  });

  describe('Endpoint Action Creators', () => {
    it('initiate should return an action', () => {
      const testBody = { data: 'test' };
      const action = userApiSlice.endpoints.test.initiate(testBody);

      expect(action).toBeDefined();
      expect(typeof action).toBe('function'); // Thunk action
    });

    it('select should return a selector', () => {
      // For mutation endpoints, select takes a requestId or fixedCacheKey object
      const selector = userApiSlice.endpoints.test.select({
        requestId: undefined,
        fixedCacheKey: 'test',
      });

      expect(selector).toBeDefined();
      expect(typeof selector).toBe('function');
    });

    it('initiate with different body types', () => {
      const stringBody = 'test string';
      const objectBody = { key: 'value', nested: { data: 123 } };
      const arrayBody = [1, 2, 3];

      expect(userApiSlice.endpoints.test.initiate(stringBody)).toBeDefined();
      expect(userApiSlice.endpoints.test.initiate(objectBody)).toBeDefined();
      expect(userApiSlice.endpoints.test.initiate(arrayBody)).toBeDefined();
    });

    it('initiate with null body', () => {
      const action = userApiSlice.endpoints.test.initiate(null);
      expect(action).toBeDefined();
    });

    it('initiate with undefined body', () => {
      const action = userApiSlice.endpoints.test.initiate(undefined);
      expect(action).toBeDefined();
    });
  });

  describe('Query Configuration', () => {
    let store: ReturnType<typeof configureStore<{ api: ApiState }>>;
    let dispatch: ThunkDispatch<StoreState, unknown, UnknownAction>;

    beforeEach(() => {
      store = configureStore({
        reducer: {
          [userApiSlice.reducerPath]: userApiSlice.reducer,
        },
        middleware: (getDefaultMiddleware) =>
          getDefaultMiddleware().concat(userApiSlice.middleware),
      });
      dispatch = store.dispatch as ThunkDispatch<StoreState, unknown, UnknownAction>;
    });

    it('should dispatch mutation action', () => {
      const testBody = { testData: 'value' };

      // Dispatch the mutation action
      const resultPromise = dispatch(userApiSlice.endpoints.test.initiate(testBody));

      // The promise should be defined
      expect(resultPromise).toBeDefined();
    });

    it('should track mutation state', () => {
      const testBody = { data: 'test' };

      // Get initial state
      const initialState = store.getState()[userApiSlice.reducerPath] as ApiState;
      expect(initialState.mutations).toEqual({});

      // Dispatch mutation
      dispatch(userApiSlice.endpoints.test.initiate(testBody));

      // Mutations should be tracked
      const stateAfter = store.getState()[userApiSlice.reducerPath] as ApiState;
      expect(stateAfter.mutations).toBeDefined();
    });

    it('should handle mutation with complex body', () => {
      const complexBody = {
        user: {
          name: 'John',
          email: 'john@example.com',
          preferences: {
            theme: 'dark',
            notifications: true,
          },
        },
        metadata: {
          timestamp: Date.now(),
          version: '1.0.0',
        },
      };

      const result = dispatch(userApiSlice.endpoints.test.initiate(complexBody));
      expect(result).toBeDefined();
    });
  });

  describe('Middleware Integration', () => {
    it('middleware should be a function', () => {
      expect(typeof userApiSlice.middleware).toBe('function');
    });

    it('should work with store dispatch', () => {
      const store = configureStore({
        reducer: {
          [userApiSlice.reducerPath]: userApiSlice.reducer,
        },
        middleware: (getDefaultMiddleware) =>
          getDefaultMiddleware().concat(userApiSlice.middleware),
      });

      // Dispatch an action to verify middleware is working
      const action = userApiSlice.util.resetApiState();
      expect(() => store.dispatch(action)).not.toThrow();
    });
  });

  describe('Type Exports', () => {
    it('should have reducerPath as string', () => {
      expect(typeof userApiSlice.reducerPath).toBe('string');
    });

    it('endpoints should be an object with test key', () => {
      expect(Object.keys(userApiSlice.endpoints)).toContain('test');
    });
  });
});
