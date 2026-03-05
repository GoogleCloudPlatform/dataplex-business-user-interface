import { configureStore, type AnyAction, type ThunkDispatch } from '@reduxjs/toolkit';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import axios, { AxiosError, AxiosHeaders } from 'axios';
import lineageReducer, { fetchLineageSearchLinks, lineageSlice } from './lineageSlice';

// Define the state type
type LineageState = {
  items: unknown;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | undefined | unknown | null;
};

// Define store type
type RootState = {
  lineage: LineageState;
};

// Mock axios
vi.mock('axios', async () => {
  const actual = await vi.importActual('axios');
  return {
    ...actual,
    default: {
      post: vi.fn(),
      defaults: {
        headers: {
          common: {} as Record<string, string>,
        },
      },
    },
  };
});

// Mock URLS
vi.mock('../../constants/urls', () => ({
  URLS: {
    API_URL: 'http://localhost:3000/api/v1',
    LINEAGE_SEARCH: '/lineage',
  },
}));

// Create a typed mock for axios.post
const mockedAxiosPost = axios.post as ReturnType<typeof vi.fn>;

describe('lineageSlice', () => {
  // Mock data
  const mockRequestData = {
    id_token: 'test-token-123',
    parent: 'projects/test-project/locations/us-central1',
    fqn: 'bigquery:test-project.test-dataset.test-table',
  };

  const mockLineageResponse = {
    links: [
      {
        name: 'link1',
        source: {
          fullyQualifiedName: 'bigquery:test-project.source-dataset.source-table',
        },
        target: {
          fullyQualifiedName: 'bigquery:test-project.target-dataset.target-table',
        },
      },
      {
        name: 'link2',
        source: {
          fullyQualifiedName: 'bigquery:test-project.source-dataset.source-table-2',
        },
        target: {
          fullyQualifiedName: 'bigquery:test-project.target-dataset.target-table-2',
        },
      },
    ],
    processes: [
      {
        name: 'process1',
        displayName: 'ETL Process',
        attributes: {
          path: '/path/to/process',
        },
      },
    ],
  };

  let store: ReturnType<typeof configureStore<{ lineage: LineageState }>>;

  beforeEach(() => {
    vi.clearAllMocks();
    store = configureStore({
      reducer: {
        lineage: lineageReducer,
      },
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = store.getState().lineage;

      expect(state.items).toEqual([]);
      expect(state.status).toBe('idle');
      expect(state.error).toBeNull();
    });

    it('should return initial state when called with undefined state', () => {
      const state = lineageReducer(undefined, { type: 'unknown' });

      expect(state.items).toEqual([]);
      expect(state.status).toBe('idle');
      expect(state.error).toBeNull();
    });
  });

  describe('Slice Configuration', () => {
    it('should have correct slice name', () => {
      expect(lineageSlice.name).toBe('lineage');
    });

    it('should have empty reducers object', () => {
      expect(lineageSlice.caseReducers).toEqual({});
    });
  });

  describe('fetchLineageSearchLinks Thunk', () => {
    describe('Pending State', () => {
      it('should set status to loading when pending', () => {
        const action = { type: fetchLineageSearchLinks.pending.type };
        const state = lineageReducer(undefined, action);

        expect(state.status).toBe('loading');
      });

      it('should preserve items when pending', () => {
        const initialStateWithItems: LineageState = {
          items: mockLineageResponse,
          status: 'succeeded',
          error: null,
        };
        const action = { type: fetchLineageSearchLinks.pending.type };
        const state = lineageReducer(initialStateWithItems, action);

        expect(state.items).toEqual(mockLineageResponse);
        expect(state.status).toBe('loading');
      });
    });

    describe('Fulfilled State', () => {
      it('should set status to succeeded and update items on fulfilled', () => {
        const action = {
          type: fetchLineageSearchLinks.fulfilled.type,
          payload: mockLineageResponse,
        };
        const state = lineageReducer(undefined, action);

        expect(state.status).toBe('succeeded');
        expect(state.items).toEqual(mockLineageResponse);
      });

      it('should replace existing items on fulfilled', () => {
        const initialStateWithItems: LineageState = {
          items: { old: 'data' },
          status: 'loading',
          error: null,
        };
        const action = {
          type: fetchLineageSearchLinks.fulfilled.type,
          payload: mockLineageResponse,
        };
        const state = lineageReducer(initialStateWithItems, action);

        expect(state.items).toEqual(mockLineageResponse);
        expect(state.items).not.toEqual({ old: 'data' });
      });

      it('should handle empty array payload on fulfilled', () => {
        const action = {
          type: fetchLineageSearchLinks.fulfilled.type,
          payload: [],
        };
        const state = lineageReducer(undefined, action);

        expect(state.status).toBe('succeeded');
        expect(state.items).toEqual([]);
      });

      it('should handle null payload on fulfilled', () => {
        const action = {
          type: fetchLineageSearchLinks.fulfilled.type,
          payload: null,
        };
        const state = lineageReducer(undefined, action);

        expect(state.status).toBe('succeeded');
        expect(state.items).toBeNull();
      });
    });

    describe('Rejected State', () => {
      it('should set status to failed and store error on rejected', () => {
        const errorMessage = 'Network error occurred';
        const action = {
          type: fetchLineageSearchLinks.rejected.type,
          payload: errorMessage,
        };
        const state = lineageReducer(undefined, action);

        expect(state.status).toBe('failed');
        expect(state.error).toBe(errorMessage);
      });

      it('should handle object error payload on rejected', () => {
        const errorPayload = { message: 'Lineage not found', code: 404 };
        const action = {
          type: fetchLineageSearchLinks.rejected.type,
          payload: errorPayload,
        };
        const state = lineageReducer(undefined, action);

        expect(state.status).toBe('failed');
        expect(state.error).toEqual(errorPayload);
      });

      it('should preserve items on rejection', () => {
        const initialStateWithItems: LineageState = {
          items: mockLineageResponse,
          status: 'loading',
          error: null,
        };
        const action = {
          type: fetchLineageSearchLinks.rejected.type,
          payload: 'Error occurred',
        };
        const state = lineageReducer(initialStateWithItems, action);

        expect(state.items).toEqual(mockLineageResponse);
        expect(state.status).toBe('failed');
      });
    });

    describe('Async Thunk Execution', () => {
      it('should return empty array when requestData is null', async () => {
        const result = await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          fetchLineageSearchLinks(null)
        );

        expect(result.payload).toEqual([]);
        expect(mockedAxiosPost).not.toHaveBeenCalled();
      });

      it('should return empty array when requestData is undefined', async () => {
        const result = await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          fetchLineageSearchLinks(undefined)
        );

        expect(result.payload).toEqual([]);
        expect(mockedAxiosPost).not.toHaveBeenCalled();
      });

      it('should return empty array when requestData is empty string', async () => {
        const result = await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          fetchLineageSearchLinks('')
        );

        expect(result.payload).toEqual([]);
        expect(mockedAxiosPost).not.toHaveBeenCalled();
      });

      it('should make API call with correct parameters on success', async () => {
        mockedAxiosPost.mockResolvedValueOnce({ data: mockLineageResponse });

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          fetchLineageSearchLinks(mockRequestData)
        );

        expect(mockedAxiosPost).toHaveBeenCalledWith(
          'http://localhost:3000/api/v1/lineage',
          {
            parent: mockRequestData.parent,
            fqn: mockRequestData.fqn,
          }
        );
      });

      it('should set Authorization header with token', async () => {
        mockedAxiosPost.mockResolvedValueOnce({ data: mockLineageResponse });

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          fetchLineageSearchLinks(mockRequestData)
        );

        expect(axios.defaults.headers.common['Authorization']).toBe(
          `Bearer ${mockRequestData.id_token}`
        );
      });

      it('should set empty Authorization header when no token provided', async () => {
        mockedAxiosPost.mockResolvedValueOnce({ data: mockLineageResponse });

        const requestDataWithoutToken = {
          parent: mockRequestData.parent,
          fqn: mockRequestData.fqn,
        };

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          fetchLineageSearchLinks(requestDataWithoutToken)
        );

        expect(axios.defaults.headers.common['Authorization']).toBe('');
      });

      it('should update store state on successful API call', async () => {
        mockedAxiosPost.mockResolvedValueOnce({ data: mockLineageResponse });

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          fetchLineageSearchLinks(mockRequestData)
        );

        const state = store.getState().lineage;
        expect(state.status).toBe('succeeded');
        expect(state.items).toEqual(mockLineageResponse);
      });

      it('should handle AxiosError with response data', async () => {
        const errorResponse = { message: 'Lineage not found', code: 'NOT_FOUND' };

        const axiosError = new AxiosError(
          'Request failed',
          'ERR_BAD_REQUEST',
          undefined,
          undefined,
          {
            data: errorResponse,
            status: 404,
            statusText: 'Not Found',
            headers: {},
            config: { headers: new AxiosHeaders() },
          }
        );

        mockedAxiosPost.mockRejectedValueOnce(axiosError);

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          fetchLineageSearchLinks(mockRequestData)
        );

        const state = store.getState().lineage;
        expect(state.status).toBe('failed');
        expect(state.error).toEqual(errorResponse);
      });

      it('should handle AxiosError without response data', async () => {
        const axiosError = new AxiosError('Network Error', 'ERR_NETWORK');

        mockedAxiosPost.mockRejectedValueOnce(axiosError);

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          fetchLineageSearchLinks(mockRequestData)
        );

        const state = store.getState().lineage;
        expect(state.status).toBe('failed');
        expect(state.error).toBe('Network Error');
      });

      it('should handle non-Axios error (unknown error)', async () => {
        const genericError = new Error('Something went wrong');

        mockedAxiosPost.mockRejectedValueOnce(genericError);

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          fetchLineageSearchLinks(mockRequestData)
        );

        const state = store.getState().lineage;
        expect(state.status).toBe('failed');
        expect(state.error).toBe('An unknown error occurred');
      });

      it('should handle string error', async () => {
        mockedAxiosPost.mockRejectedValueOnce('String error');

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          fetchLineageSearchLinks(mockRequestData)
        );

        const state = store.getState().lineage;
        expect(state.status).toBe('failed');
        expect(state.error).toBe('An unknown error occurred');
      });

      it('should transition through loading state', async () => {
        let resolvePromise: (value: { data: typeof mockLineageResponse }) => void;
        const pendingPromise = new Promise<{ data: typeof mockLineageResponse }>((resolve) => {
          resolvePromise = resolve;
        });

        mockedAxiosPost.mockReturnValueOnce(pendingPromise);

        const dispatchPromise = (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          fetchLineageSearchLinks(mockRequestData)
        );

        // Check loading state
        expect(store.getState().lineage.status).toBe('loading');

        // Resolve the promise
        resolvePromise!({ data: mockLineageResponse });
        await dispatchPromise;

        // Check succeeded state
        expect(store.getState().lineage.status).toBe('succeeded');
      });
    });

    describe('Different Request Data Scenarios', () => {
      it('should handle request with null id_token', async () => {
        mockedAxiosPost.mockResolvedValueOnce({ data: mockLineageResponse });

        const requestWithNullToken = {
          id_token: null,
          parent: mockRequestData.parent,
          fqn: mockRequestData.fqn,
        };

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          fetchLineageSearchLinks(requestWithNullToken)
        );

        expect(axios.defaults.headers.common['Authorization']).toBe('');
      });

      it('should handle request with empty string id_token', async () => {
        mockedAxiosPost.mockResolvedValueOnce({ data: mockLineageResponse });

        const requestWithEmptyToken = {
          id_token: '',
          parent: mockRequestData.parent,
          fqn: mockRequestData.fqn,
        };

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          fetchLineageSearchLinks(requestWithEmptyToken)
        );

        expect(axios.defaults.headers.common['Authorization']).toBe('');
      });

      it('should handle different parent and fqn values', async () => {
        mockedAxiosPost.mockResolvedValueOnce({ data: mockLineageResponse });

        const differentRequest = {
          id_token: 'different-token',
          parent: 'projects/other-project/locations/eu-west1',
          fqn: 'bigquery:other-project.other-dataset.other-table',
        };

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          fetchLineageSearchLinks(differentRequest)
        );

        expect(mockedAxiosPost).toHaveBeenCalledWith(
          'http://localhost:3000/api/v1/lineage',
          {
            parent: differentRequest.parent,
            fqn: differentRequest.fqn,
          }
        );
      });

      it('should handle undefined parent and fqn', async () => {
        mockedAxiosPost.mockResolvedValueOnce({ data: mockLineageResponse });

        const requestWithUndefinedFields = {
          id_token: 'token',
        };

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          fetchLineageSearchLinks(requestWithUndefinedFields)
        );

        expect(mockedAxiosPost).toHaveBeenCalledWith(
          'http://localhost:3000/api/v1/lineage',
          {
            parent: undefined,
            fqn: undefined,
          }
        );
      });
    });

    describe('Response Data Variations', () => {
      it('should handle response with empty links array', async () => {
        const emptyLinksResponse = { links: [], processes: [] };

        mockedAxiosPost.mockResolvedValueOnce({ data: emptyLinksResponse });

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          fetchLineageSearchLinks(mockRequestData)
        );

        const state = store.getState().lineage;
        expect(state.items).toEqual(emptyLinksResponse);
      });

      it('should handle response with complex nested data', async () => {
        const complexResponse = {
          links: [
            {
              name: 'link1',
              source: {
                fullyQualifiedName: 'bigquery:project.dataset.table',
                attributes: {
                  schema: [
                    { name: 'id', type: 'INTEGER' },
                    { name: 'name', type: 'STRING' },
                  ],
                },
              },
              target: {
                fullyQualifiedName: 'bigquery:project.dataset2.table2',
                attributes: {
                  schema: [
                    { name: 'id', type: 'INTEGER' },
                    { name: 'full_name', type: 'STRING' },
                  ],
                },
              },
            },
          ],
          processes: [
            {
              name: 'etl-process',
              displayName: 'ETL Process',
              query: 'SELECT * FROM source_table',
              attributes: {
                type: 'DATAFLOW',
                jobId: 'job-123',
              },
            },
          ],
        };

        mockedAxiosPost.mockResolvedValueOnce({ data: complexResponse });

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          fetchLineageSearchLinks(mockRequestData)
        );

        const state = store.getState().lineage;
        expect(state.items).toEqual(complexResponse);
      });

      it('should handle empty object response', async () => {
        mockedAxiosPost.mockResolvedValueOnce({ data: {} });

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          fetchLineageSearchLinks(mockRequestData)
        );

        const state = store.getState().lineage;
        expect(state.status).toBe('succeeded');
        expect(state.items).toEqual({});
      });

      it('should handle undefined response data', async () => {
        mockedAxiosPost.mockResolvedValueOnce({ data: undefined });

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          fetchLineageSearchLinks(mockRequestData)
        );

        const state = store.getState().lineage;
        expect(state.status).toBe('succeeded');
        expect(state.items).toBeUndefined();
      });
    });
  });

  describe('State Transitions', () => {
    it('should handle complete flow: idle -> loading -> succeeded', async () => {
      mockedAxiosPost.mockResolvedValueOnce({ data: mockLineageResponse });

      // Initial state
      expect(store.getState().lineage.status).toBe('idle');

      const promise = (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
        fetchLineageSearchLinks(mockRequestData)
      );

      // Loading state
      expect(store.getState().lineage.status).toBe('loading');

      await promise;

      // Succeeded state
      expect(store.getState().lineage.status).toBe('succeeded');
      expect(store.getState().lineage.items).toEqual(mockLineageResponse);
    });

    it('should handle complete flow: idle -> loading -> failed', async () => {
      mockedAxiosPost.mockRejectedValueOnce(new Error('Failed'));

      // Initial state
      expect(store.getState().lineage.status).toBe('idle');

      const promise = (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
        fetchLineageSearchLinks(mockRequestData)
      );

      // Loading state
      expect(store.getState().lineage.status).toBe('loading');

      await promise;

      // Failed state
      expect(store.getState().lineage.status).toBe('failed');
      expect(store.getState().lineage.error).toBe('An unknown error occurred');
    });

    it('should handle retry after failure', async () => {
      // First call fails
      mockedAxiosPost.mockRejectedValueOnce(new Error('Failed'));
      await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
        fetchLineageSearchLinks(mockRequestData)
      );
      expect(store.getState().lineage.status).toBe('failed');

      // Second call succeeds
      mockedAxiosPost.mockResolvedValueOnce({ data: mockLineageResponse });
      await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
        fetchLineageSearchLinks(mockRequestData)
      );

      expect(store.getState().lineage.status).toBe('succeeded');
      expect(store.getState().lineage.items).toEqual(mockLineageResponse);
    });

    it('should handle multiple successful calls', async () => {
      const firstResponse = { links: [{ name: 'link1' }] };
      const secondResponse = { links: [{ name: 'link2' }, { name: 'link3' }] };

      // First call
      mockedAxiosPost.mockResolvedValueOnce({ data: firstResponse });
      await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
        fetchLineageSearchLinks(mockRequestData)
      );
      expect(store.getState().lineage.items).toEqual(firstResponse);

      // Second call should replace items
      mockedAxiosPost.mockResolvedValueOnce({ data: secondResponse });
      await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
        fetchLineageSearchLinks(mockRequestData)
      );
      expect(store.getState().lineage.items).toEqual(secondResponse);
    });

    it('should not make API call when requestData is falsy but still update state', async () => {
      // Call with null
      await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
        fetchLineageSearchLinks(null)
      );

      expect(mockedAxiosPost).not.toHaveBeenCalled();
      expect(store.getState().lineage.status).toBe('succeeded');
      expect(store.getState().lineage.items).toEqual([]);
    });
  });

  describe('Error Handling Edge Cases', () => {
    it('should handle AxiosError with status 401 Unauthorized', async () => {
      const axiosError = new AxiosError(
        'Unauthorized',
        'ERR_UNAUTHORIZED',
        undefined,
        undefined,
        {
          data: { message: 'Invalid token' },
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config: { headers: new AxiosHeaders() },
        }
      );

      mockedAxiosPost.mockRejectedValueOnce(axiosError);

      await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
        fetchLineageSearchLinks(mockRequestData)
      );

      const state = store.getState().lineage;
      expect(state.status).toBe('failed');
      expect(state.error).toEqual({ message: 'Invalid token' });
    });

    it('should handle AxiosError with status 500 Internal Server Error', async () => {
      const axiosError = new AxiosError(
        'Internal Server Error',
        'ERR_SERVER',
        undefined,
        undefined,
        {
          data: { message: 'Server error', details: 'Database connection failed' },
          status: 500,
          statusText: 'Internal Server Error',
          headers: {},
          config: { headers: new AxiosHeaders() },
        }
      );

      mockedAxiosPost.mockRejectedValueOnce(axiosError);

      await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
        fetchLineageSearchLinks(mockRequestData)
      );

      const state = store.getState().lineage;
      expect(state.status).toBe('failed');
      expect(state.error).toEqual({ message: 'Server error', details: 'Database connection failed' });
    });

    it('should handle timeout error', async () => {
      const axiosError = new AxiosError('timeout exceeded', 'ECONNABORTED');

      mockedAxiosPost.mockRejectedValueOnce(axiosError);

      await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
        fetchLineageSearchLinks(mockRequestData)
      );

      const state = store.getState().lineage;
      expect(state.status).toBe('failed');
      expect(state.error).toBe('timeout exceeded');
    });

    it('should handle null error', async () => {
      mockedAxiosPost.mockRejectedValueOnce(null);

      await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
        fetchLineageSearchLinks(mockRequestData)
      );

      const state = store.getState().lineage;
      expect(state.status).toBe('failed');
      expect(state.error).toBe('An unknown error occurred');
    });
  });
});
