import { configureStore, type AnyAction, type ThunkDispatch } from '@reduxjs/toolkit';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import axios, { AxiosError, AxiosHeaders } from 'axios';
import sampleDataReducer, { getSampleData, sampleDataSlice } from './sampleDataSlice';

// Define the state type
type SampleDataState = {
  items: unknown;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | undefined | unknown | null;
};

// Define store type
type RootState = {
  sampleData: SampleDataState;
};

// Mock axios
vi.mock('axios', async () => {
  const actual = await vi.importActual('axios');
  return {
    ...actual,
    default: {
      get: vi.fn(),
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
    GET_SAMPLE_DATA: '/get-sample-data',
  },
}));

// Create a typed mock for axios.get
const mockedAxiosGet = axios.get as ReturnType<typeof vi.fn>;

describe('sampleDataSlice', () => {
  // Mock data
  const mockRequestData = {
    id_token: 'test-token-123',
    fqn: 'bigquery:test-project.test-dataset.test-table',
  };

  const mockSampleDataResponse = {
    rows: [
      { id: 1, name: 'John Doe', email: 'john@example.com', created_at: '2024-01-15' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', created_at: '2024-01-16' },
      { id: 3, name: 'Bob Wilson', email: 'bob@example.com', created_at: '2024-01-17' },
    ],
    schema: [
      { name: 'id', type: 'INTEGER', mode: 'REQUIRED' },
      { name: 'name', type: 'STRING', mode: 'NULLABLE' },
      { name: 'email', type: 'STRING', mode: 'NULLABLE' },
      { name: 'created_at', type: 'DATE', mode: 'NULLABLE' },
    ],
    totalRows: 3,
  };

  let store: ReturnType<typeof configureStore<{ sampleData: SampleDataState }>>;

  beforeEach(() => {
    vi.clearAllMocks();
    store = configureStore({
      reducer: {
        sampleData: sampleDataReducer,
      },
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = store.getState().sampleData;

      expect(state.items).toEqual([]);
      expect(state.status).toBe('idle');
      expect(state.error).toBeNull();
    });

    it('should return initial state when called with undefined state', () => {
      const state = sampleDataReducer(undefined, { type: 'unknown' });

      expect(state.items).toEqual([]);
      expect(state.status).toBe('idle');
      expect(state.error).toBeNull();
    });
  });

  describe('Slice Configuration', () => {
    it('should have correct slice name', () => {
      expect(sampleDataSlice.name).toBe('sampleData');
    });

    it('should have empty reducers object', () => {
      expect(sampleDataSlice.caseReducers).toEqual({});
    });
  });

  describe('getSampleData Thunk', () => {
    describe('Pending State', () => {
      it('should set status to loading when pending', () => {
        const action = { type: getSampleData.pending.type };
        const state = sampleDataReducer(undefined, action);

        expect(state.status).toBe('loading');
      });

      it('should preserve items when pending', () => {
        const initialStateWithItems: SampleDataState = {
          items: mockSampleDataResponse,
          status: 'succeeded',
          error: null,
        };
        const action = { type: getSampleData.pending.type };
        const state = sampleDataReducer(initialStateWithItems, action);

        expect(state.items).toEqual(mockSampleDataResponse);
        expect(state.status).toBe('loading');
      });
    });

    describe('Fulfilled State', () => {
      it('should set status to succeeded and update items on fulfilled', () => {
        const action = {
          type: getSampleData.fulfilled.type,
          payload: mockSampleDataResponse,
        };
        const state = sampleDataReducer(undefined, action);

        expect(state.status).toBe('succeeded');
        expect(state.items).toEqual(mockSampleDataResponse);
      });

      it('should replace existing items on fulfilled', () => {
        const initialStateWithItems: SampleDataState = {
          items: { old: 'data' },
          status: 'loading',
          error: null,
        };
        const action = {
          type: getSampleData.fulfilled.type,
          payload: mockSampleDataResponse,
        };
        const state = sampleDataReducer(initialStateWithItems, action);

        expect(state.items).toEqual(mockSampleDataResponse);
        expect(state.items).not.toEqual({ old: 'data' });
      });

      it('should handle empty array payload on fulfilled', () => {
        const action = {
          type: getSampleData.fulfilled.type,
          payload: [],
        };
        const state = sampleDataReducer(undefined, action);

        expect(state.status).toBe('succeeded');
        expect(state.items).toEqual([]);
      });

      it('should handle null payload on fulfilled', () => {
        const action = {
          type: getSampleData.fulfilled.type,
          payload: null,
        };
        const state = sampleDataReducer(undefined, action);

        expect(state.status).toBe('succeeded');
        expect(state.items).toBeNull();
      });

      it('should handle empty rows in response', () => {
        const emptyRowsResponse = {
          rows: [],
          schema: mockSampleDataResponse.schema,
          totalRows: 0,
        };
        const action = {
          type: getSampleData.fulfilled.type,
          payload: emptyRowsResponse,
        };
        const state = sampleDataReducer(undefined, action);

        expect(state.status).toBe('succeeded');
        expect(state.items).toEqual(emptyRowsResponse);
      });
    });

    describe('Rejected State', () => {
      it('should set status to failed and store error on rejected', () => {
        const errorMessage = 'Network error occurred';
        const action = {
          type: getSampleData.rejected.type,
          payload: errorMessage,
        };
        const state = sampleDataReducer(undefined, action);

        expect(state.status).toBe('failed');
        expect(state.error).toBe(errorMessage);
      });

      it('should handle object error payload on rejected', () => {
        const errorPayload = { message: 'Sample data not found', code: 404 };
        const action = {
          type: getSampleData.rejected.type,
          payload: errorPayload,
        };
        const state = sampleDataReducer(undefined, action);

        expect(state.status).toBe('failed');
        expect(state.error).toEqual(errorPayload);
      });

      it('should preserve items on rejection', () => {
        const initialStateWithItems: SampleDataState = {
          items: mockSampleDataResponse,
          status: 'loading',
          error: null,
        };
        const action = {
          type: getSampleData.rejected.type,
          payload: 'Error occurred',
        };
        const state = sampleDataReducer(initialStateWithItems, action);

        expect(state.items).toEqual(mockSampleDataResponse);
        expect(state.status).toBe('failed');
      });
    });

    describe('Async Thunk Execution', () => {
      it('should make API call with correct URL and fqn parameter', async () => {
        mockedAxiosGet.mockResolvedValueOnce({ data: mockSampleDataResponse });

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          getSampleData(mockRequestData)
        );

        expect(mockedAxiosGet).toHaveBeenCalledWith(
          `http://localhost:3000/api/v1/get-sample-data?fqn=${mockRequestData.fqn}`
        );
      });

      it('should set Authorization header with token', async () => {
        mockedAxiosGet.mockResolvedValueOnce({ data: mockSampleDataResponse });

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          getSampleData(mockRequestData)
        );

        expect(axios.defaults.headers.common['Authorization']).toBe(
          `Bearer ${mockRequestData.id_token}`
        );
      });

      it('should set empty Authorization header when no token provided', async () => {
        mockedAxiosGet.mockResolvedValueOnce({ data: mockSampleDataResponse });

        const requestDataWithoutToken = {
          fqn: mockRequestData.fqn,
        };

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          getSampleData(requestDataWithoutToken)
        );

        expect(axios.defaults.headers.common['Authorization']).toBe('');
      });

      it('should set empty Authorization header when token is null', async () => {
        mockedAxiosGet.mockResolvedValueOnce({ data: mockSampleDataResponse });

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          getSampleData({ id_token: null, fqn: mockRequestData.fqn })
        );

        expect(axios.defaults.headers.common['Authorization']).toBe('');
      });

      it('should set empty Authorization header when token is empty string', async () => {
        mockedAxiosGet.mockResolvedValueOnce({ data: mockSampleDataResponse });

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          getSampleData({ id_token: '', fqn: mockRequestData.fqn })
        );

        expect(axios.defaults.headers.common['Authorization']).toBe('');
      });

      it('should update store state on successful API call', async () => {
        mockedAxiosGet.mockResolvedValueOnce({ data: mockSampleDataResponse });

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          getSampleData(mockRequestData)
        );

        const state = store.getState().sampleData;
        expect(state.status).toBe('succeeded');
        expect(state.items).toEqual(mockSampleDataResponse);
      });

      it('should handle AxiosError with response data', async () => {
        const errorResponse = { message: 'Table not found', code: 'NOT_FOUND' };

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

        mockedAxiosGet.mockRejectedValueOnce(axiosError);

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          getSampleData(mockRequestData)
        );

        const state = store.getState().sampleData;
        expect(state.status).toBe('failed');
        expect(state.error).toEqual(errorResponse);
      });

      it('should handle AxiosError without response data', async () => {
        const axiosError = new AxiosError('Network Error', 'ERR_NETWORK');

        mockedAxiosGet.mockRejectedValueOnce(axiosError);

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          getSampleData(mockRequestData)
        );

        const state = store.getState().sampleData;
        expect(state.status).toBe('failed');
        expect(state.error).toBe('Network Error');
      });

      it('should handle non-Axios error (unknown error)', async () => {
        const genericError = new Error('Something went wrong');

        mockedAxiosGet.mockRejectedValueOnce(genericError);

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          getSampleData(mockRequestData)
        );

        const state = store.getState().sampleData;
        expect(state.status).toBe('failed');
        expect(state.error).toBe('An unknown error occurred');
      });

      it('should handle string error', async () => {
        mockedAxiosGet.mockRejectedValueOnce('String error');

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          getSampleData(mockRequestData)
        );

        const state = store.getState().sampleData;
        expect(state.status).toBe('failed');
        expect(state.error).toBe('An unknown error occurred');
      });

      it('should handle null error', async () => {
        mockedAxiosGet.mockRejectedValueOnce(null);

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          getSampleData(mockRequestData)
        );

        const state = store.getState().sampleData;
        expect(state.status).toBe('failed');
        expect(state.error).toBe('An unknown error occurred');
      });

      it('should transition through loading state', async () => {
        let resolvePromise: (value: { data: typeof mockSampleDataResponse }) => void;
        const pendingPromise = new Promise<{ data: typeof mockSampleDataResponse }>((resolve) => {
          resolvePromise = resolve;
        });

        mockedAxiosGet.mockReturnValueOnce(pendingPromise);

        const dispatchPromise = (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          getSampleData(mockRequestData)
        );

        // Check loading state
        expect(store.getState().sampleData.status).toBe('loading');

        // Resolve the promise
        resolvePromise!({ data: mockSampleDataResponse });
        await dispatchPromise;

        // Check succeeded state
        expect(store.getState().sampleData.status).toBe('succeeded');
      });
    });

    describe('Different Request Data Scenarios', () => {
      it('should handle different fqn values', async () => {
        mockedAxiosGet.mockResolvedValueOnce({ data: mockSampleDataResponse });

        const differentFqn = 'bigquery:other-project.other-dataset.other-table';
        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          getSampleData({ id_token: 'token', fqn: differentFqn })
        );

        expect(mockedAxiosGet).toHaveBeenCalledWith(
          `http://localhost:3000/api/v1/get-sample-data?fqn=${differentFqn}`
        );
      });

      it('should handle fqn with special characters', async () => {
        mockedAxiosGet.mockResolvedValueOnce({ data: mockSampleDataResponse });

        const fqnWithSpecialChars = 'bigquery:project-123.dataset_name.table-name';
        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          getSampleData({ id_token: 'token', fqn: fqnWithSpecialChars })
        );

        expect(mockedAxiosGet).toHaveBeenCalledWith(
          `http://localhost:3000/api/v1/get-sample-data?fqn=${fqnWithSpecialChars}`
        );
      });

      it('should handle undefined fqn', async () => {
        mockedAxiosGet.mockResolvedValueOnce({ data: mockSampleDataResponse });

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          getSampleData({ id_token: 'token' })
        );

        expect(mockedAxiosGet).toHaveBeenCalledWith(
          'http://localhost:3000/api/v1/get-sample-data?fqn=undefined'
        );
      });
    });

    describe('Response Data Variations', () => {
      it('should handle response with many rows', async () => {
        const manyRowsResponse = {
          rows: Array.from({ length: 100 }, (_, i) => ({
            id: i + 1,
            name: `User ${i + 1}`,
            email: `user${i + 1}@example.com`,
          })),
          schema: mockSampleDataResponse.schema,
          totalRows: 100,
        };

        mockedAxiosGet.mockResolvedValueOnce({ data: manyRowsResponse });

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          getSampleData(mockRequestData)
        );

        const state = store.getState().sampleData;
        expect(state.items).toEqual(manyRowsResponse);
        expect((state.items as typeof manyRowsResponse).rows.length).toBe(100);
      });

      it('should handle response with complex nested data', async () => {
        const complexResponse = {
          rows: [
            {
              id: 1,
              metadata: {
                created_by: 'admin',
                tags: ['important', 'reviewed'],
                attributes: { level: 1, category: 'A' },
              },
              json_field: { nested: { deeply: { value: 'test' } } },
            },
          ],
          schema: [
            { name: 'id', type: 'INTEGER' },
            { name: 'metadata', type: 'RECORD' },
            { name: 'json_field', type: 'JSON' },
          ],
          totalRows: 1,
        };

        mockedAxiosGet.mockResolvedValueOnce({ data: complexResponse });

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          getSampleData(mockRequestData)
        );

        const state = store.getState().sampleData;
        expect(state.items).toEqual(complexResponse);
      });

      it('should handle empty object response', async () => {
        mockedAxiosGet.mockResolvedValueOnce({ data: {} });

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          getSampleData(mockRequestData)
        );

        const state = store.getState().sampleData;
        expect(state.status).toBe('succeeded');
        expect(state.items).toEqual({});
      });

      it('should handle undefined response data', async () => {
        mockedAxiosGet.mockResolvedValueOnce({ data: undefined });

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          getSampleData(mockRequestData)
        );

        const state = store.getState().sampleData;
        expect(state.status).toBe('succeeded');
        expect(state.items).toBeUndefined();
      });

      it('should handle response with different data types in rows', async () => {
        const mixedTypesResponse = {
          rows: [
            {
              integer_col: 42,
              float_col: 3.14159,
              string_col: 'hello',
              boolean_col: true,
              null_col: null,
              date_col: '2024-01-15',
              timestamp_col: '2024-01-15T10:30:00Z',
              array_col: [1, 2, 3],
            },
          ],
          schema: [
            { name: 'integer_col', type: 'INTEGER' },
            { name: 'float_col', type: 'FLOAT' },
            { name: 'string_col', type: 'STRING' },
            { name: 'boolean_col', type: 'BOOLEAN' },
            { name: 'null_col', type: 'STRING' },
            { name: 'date_col', type: 'DATE' },
            { name: 'timestamp_col', type: 'TIMESTAMP' },
            { name: 'array_col', type: 'ARRAY' },
          ],
          totalRows: 1,
        };

        mockedAxiosGet.mockResolvedValueOnce({ data: mixedTypesResponse });

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          getSampleData(mockRequestData)
        );

        const state = store.getState().sampleData;
        expect(state.items).toEqual(mixedTypesResponse);
      });
    });
  });

  describe('State Transitions', () => {
    it('should handle complete flow: idle -> loading -> succeeded', async () => {
      mockedAxiosGet.mockResolvedValueOnce({ data: mockSampleDataResponse });

      // Initial state
      expect(store.getState().sampleData.status).toBe('idle');

      const promise = (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
        getSampleData(mockRequestData)
      );

      // Loading state
      expect(store.getState().sampleData.status).toBe('loading');

      await promise;

      // Succeeded state
      expect(store.getState().sampleData.status).toBe('succeeded');
      expect(store.getState().sampleData.items).toEqual(mockSampleDataResponse);
    });

    it('should handle complete flow: idle -> loading -> failed', async () => {
      mockedAxiosGet.mockRejectedValueOnce(new Error('Failed'));

      // Initial state
      expect(store.getState().sampleData.status).toBe('idle');

      const promise = (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
        getSampleData(mockRequestData)
      );

      // Loading state
      expect(store.getState().sampleData.status).toBe('loading');

      await promise;

      // Failed state
      expect(store.getState().sampleData.status).toBe('failed');
      expect(store.getState().sampleData.error).toBe('An unknown error occurred');
    });

    it('should handle retry after failure', async () => {
      // First call fails
      mockedAxiosGet.mockRejectedValueOnce(new Error('Failed'));
      await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
        getSampleData(mockRequestData)
      );
      expect(store.getState().sampleData.status).toBe('failed');

      // Second call succeeds
      mockedAxiosGet.mockResolvedValueOnce({ data: mockSampleDataResponse });
      await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
        getSampleData(mockRequestData)
      );

      expect(store.getState().sampleData.status).toBe('succeeded');
      expect(store.getState().sampleData.items).toEqual(mockSampleDataResponse);
    });

    it('should handle multiple successful calls', async () => {
      const firstResponse = { rows: [{ id: 1 }], totalRows: 1 };
      const secondResponse = { rows: [{ id: 2 }, { id: 3 }], totalRows: 2 };

      // First call
      mockedAxiosGet.mockResolvedValueOnce({ data: firstResponse });
      await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
        getSampleData(mockRequestData)
      );
      expect(store.getState().sampleData.items).toEqual(firstResponse);

      // Second call should replace items
      mockedAxiosGet.mockResolvedValueOnce({ data: secondResponse });
      await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
        getSampleData(mockRequestData)
      );
      expect(store.getState().sampleData.items).toEqual(secondResponse);
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
          data: { message: 'Invalid or expired token' },
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config: { headers: new AxiosHeaders() },
        }
      );

      mockedAxiosGet.mockRejectedValueOnce(axiosError);

      await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
        getSampleData(mockRequestData)
      );

      const state = store.getState().sampleData;
      expect(state.status).toBe('failed');
      expect(state.error).toEqual({ message: 'Invalid or expired token' });
    });

    it('should handle AxiosError with status 403 Forbidden', async () => {
      const axiosError = new AxiosError(
        'Forbidden',
        'ERR_FORBIDDEN',
        undefined,
        undefined,
        {
          data: { message: 'Access denied to this table' },
          status: 403,
          statusText: 'Forbidden',
          headers: {},
          config: { headers: new AxiosHeaders() },
        }
      );

      mockedAxiosGet.mockRejectedValueOnce(axiosError);

      await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
        getSampleData(mockRequestData)
      );

      const state = store.getState().sampleData;
      expect(state.status).toBe('failed');
      expect(state.error).toEqual({ message: 'Access denied to this table' });
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

      mockedAxiosGet.mockRejectedValueOnce(axiosError);

      await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
        getSampleData(mockRequestData)
      );

      const state = store.getState().sampleData;
      expect(state.status).toBe('failed');
      expect(state.error).toEqual({ message: 'Server error', details: 'Database connection failed' });
    });

    it('should handle timeout error', async () => {
      const axiosError = new AxiosError('timeout of 30000ms exceeded', 'ECONNABORTED');

      mockedAxiosGet.mockRejectedValueOnce(axiosError);

      await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
        getSampleData(mockRequestData)
      );

      const state = store.getState().sampleData;
      expect(state.status).toBe('failed');
      expect(state.error).toBe('timeout of 30000ms exceeded');
    });

    it('should handle connection refused error', async () => {
      const axiosError = new AxiosError('connect ECONNREFUSED', 'ECONNREFUSED');

      mockedAxiosGet.mockRejectedValueOnce(axiosError);

      await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
        getSampleData(mockRequestData)
      );

      const state = store.getState().sampleData;
      expect(state.status).toBe('failed');
      expect(state.error).toBe('connect ECONNREFUSED');
    });
  });
});
