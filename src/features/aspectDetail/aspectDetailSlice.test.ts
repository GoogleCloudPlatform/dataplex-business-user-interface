import { configureStore, type AnyAction, type ThunkDispatch } from '@reduxjs/toolkit';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import axios, { AxiosError, AxiosHeaders } from 'axios';
import aspectDetailReducer, { getAspectDetail, aspectDetailSlice } from './aspectDetailSlice';

// Define the state type
type AspectDetailState = {
  items: unknown;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | undefined | unknown | null;
};

// Define store type
type RootState = {
  aspectDetail: AspectDetailState;
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
    GET_ASPECT_DETAIL: '/get-aspect-detail',
  },
}));

// Create a typed mock for axios.post
const mockedAxiosPost = axios.post as ReturnType<typeof vi.fn>;

describe('aspectDetailSlice', () => {
  // Mock data
  const mockRequestData = {
    id_token: 'test-token-123',
    resource: 'projects/test-project/locations/us-central1/entryGroups/test-group/entries/test-entry',
  };

  const mockAspectDetailResponse = {
    aspectType: 'schema',
    aspectData: {
      fields: [
        { name: 'id', type: 'INTEGER', mode: 'REQUIRED' },
        { name: 'name', type: 'STRING', mode: 'NULLABLE' },
        { name: 'created_at', type: 'TIMESTAMP', mode: 'REQUIRED' },
      ],
    },
    createTime: '2024-01-15T10:30:00Z',
    updateTime: '2024-01-16T14:45:00Z',
  };

  let store: ReturnType<typeof configureStore<{ aspectDetail: AspectDetailState }>>;

  beforeEach(() => {
    vi.clearAllMocks();
    store = configureStore({
      reducer: {
        aspectDetail: aspectDetailReducer,
      },
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = store.getState().aspectDetail;

      expect(state.items).toEqual([]);
      expect(state.status).toBe('idle');
      expect(state.error).toBeNull();
    });

    it('should return initial state when called with undefined state', () => {
      const state = aspectDetailReducer(undefined, { type: 'unknown' });

      expect(state.items).toEqual([]);
      expect(state.status).toBe('idle');
      expect(state.error).toBeNull();
    });
  });

  describe('Slice Configuration', () => {
    it('should have correct slice name', () => {
      expect(aspectDetailSlice.name).toBe('aspectDetail');
    });

    it('should have empty reducers object', () => {
      expect(aspectDetailSlice.caseReducers).toEqual({});
    });
  });

  describe('getAspectDetail Thunk', () => {
    describe('Pending State', () => {
      it('should set status to loading when pending', () => {
        const action = { type: getAspectDetail.pending.type };
        const state = aspectDetailReducer(undefined, action);

        expect(state.status).toBe('loading');
      });

      it('should preserve items when pending', () => {
        const initialStateWithItems: AspectDetailState = {
          items: mockAspectDetailResponse,
          status: 'succeeded',
          error: null,
        };
        const action = { type: getAspectDetail.pending.type };
        const state = aspectDetailReducer(initialStateWithItems, action);

        expect(state.items).toEqual(mockAspectDetailResponse);
        expect(state.status).toBe('loading');
      });
    });

    describe('Fulfilled State', () => {
      it('should set status to succeeded and update items on fulfilled', () => {
        const action = {
          type: getAspectDetail.fulfilled.type,
          payload: mockAspectDetailResponse,
        };
        const state = aspectDetailReducer(undefined, action);

        expect(state.status).toBe('succeeded');
        expect(state.items).toEqual(mockAspectDetailResponse);
      });

      it('should replace existing items on fulfilled', () => {
        const initialStateWithItems: AspectDetailState = {
          items: { old: 'data' },
          status: 'loading',
          error: null,
        };
        const action = {
          type: getAspectDetail.fulfilled.type,
          payload: mockAspectDetailResponse,
        };
        const state = aspectDetailReducer(initialStateWithItems, action);

        expect(state.items).toEqual(mockAspectDetailResponse);
        expect(state.items).not.toEqual({ old: 'data' });
      });

      it('should handle empty payload on fulfilled', () => {
        const action = {
          type: getAspectDetail.fulfilled.type,
          payload: null,
        };
        const state = aspectDetailReducer(undefined, action);

        expect(state.status).toBe('succeeded');
        expect(state.items).toBeNull();
      });

      it('should handle array payload on fulfilled', () => {
        const arrayPayload = [mockAspectDetailResponse, mockAspectDetailResponse];
        const action = {
          type: getAspectDetail.fulfilled.type,
          payload: arrayPayload,
        };
        const state = aspectDetailReducer(undefined, action);

        expect(state.status).toBe('succeeded');
        expect(state.items).toEqual(arrayPayload);
      });
    });

    describe('Rejected State', () => {
      it('should set status to failed and store error on rejected', () => {
        const errorMessage = 'Network error occurred';
        const action = {
          type: getAspectDetail.rejected.type,
          payload: errorMessage,
        };
        const state = aspectDetailReducer(undefined, action);

        expect(state.status).toBe('failed');
        expect(state.error).toBe(errorMessage);
      });

      it('should handle object error payload on rejected', () => {
        const errorPayload = { message: 'Not found', code: 404 };
        const action = {
          type: getAspectDetail.rejected.type,
          payload: errorPayload,
        };
        const state = aspectDetailReducer(undefined, action);

        expect(state.status).toBe('failed');
        expect(state.error).toEqual(errorPayload);
      });

      it('should preserve items on rejection', () => {
        const initialStateWithItems: AspectDetailState = {
          items: mockAspectDetailResponse,
          status: 'loading',
          error: null,
        };
        const action = {
          type: getAspectDetail.rejected.type,
          payload: 'Error occurred',
        };
        const state = aspectDetailReducer(initialStateWithItems, action);

        expect(state.items).toEqual(mockAspectDetailResponse);
        expect(state.status).toBe('failed');
      });
    });

    describe('Async Thunk Execution', () => {
      it('should make API call with correct parameters on success', async () => {
        mockedAxiosPost.mockResolvedValueOnce({ data: mockAspectDetailResponse });

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(getAspectDetail(mockRequestData));

        expect(mockedAxiosPost).toHaveBeenCalledWith(
          'http://localhost:3000/api/v1/get-aspect-detail',
          { name: mockRequestData.resource }
        );
      });

      it('should set Authorization header with token', async () => {
        mockedAxiosPost.mockResolvedValueOnce({ data: mockAspectDetailResponse });

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(getAspectDetail(mockRequestData));

        expect(axios.defaults.headers.common['Authorization']).toBe(
          `Bearer ${mockRequestData.id_token}`
        );
      });

      it('should set empty Authorization header when no token provided', async () => {
        mockedAxiosPost.mockResolvedValueOnce({ data: mockAspectDetailResponse });

        const requestDataWithoutToken = {
          resource: mockRequestData.resource,
        };

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(getAspectDetail(requestDataWithoutToken));

        expect(axios.defaults.headers.common['Authorization']).toBe('');
      });

      it('should update store state on successful API call', async () => {
        mockedAxiosPost.mockResolvedValueOnce({ data: mockAspectDetailResponse });

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(getAspectDetail(mockRequestData));

        const state = store.getState().aspectDetail;
        expect(state.status).toBe('succeeded');
        expect(state.items).toEqual(mockAspectDetailResponse);
      });

      it('should handle AxiosError with response data', async () => {
        const errorResponse = { message: 'Aspect not found', code: 'NOT_FOUND' };

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

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(getAspectDetail(mockRequestData));

        const state = store.getState().aspectDetail;
        expect(state.status).toBe('failed');
        expect(state.error).toEqual(errorResponse);
      });

      it('should handle AxiosError without response data', async () => {
        const axiosError = new AxiosError('Network Error', 'ERR_NETWORK');

        mockedAxiosPost.mockRejectedValueOnce(axiosError);

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(getAspectDetail(mockRequestData));

        const state = store.getState().aspectDetail;
        expect(state.status).toBe('failed');
        expect(state.error).toBe('Network Error');
      });

      it('should handle non-Axios error (unknown error)', async () => {
        const genericError = new Error('Something went wrong');

        mockedAxiosPost.mockRejectedValueOnce(genericError);

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(getAspectDetail(mockRequestData));

        const state = store.getState().aspectDetail;
        expect(state.status).toBe('failed');
        expect(state.error).toBe('An unknown error occurred');
      });

      it('should handle string error', async () => {
        mockedAxiosPost.mockRejectedValueOnce('String error');

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(getAspectDetail(mockRequestData));

        const state = store.getState().aspectDetail;
        expect(state.status).toBe('failed');
        expect(state.error).toBe('An unknown error occurred');
      });

      it('should transition through loading state', async () => {
        let resolvePromise: (value: { data: typeof mockAspectDetailResponse }) => void;
        const pendingPromise = new Promise<{ data: typeof mockAspectDetailResponse }>((resolve) => {
          resolvePromise = resolve;
        });

        mockedAxiosPost.mockReturnValueOnce(pendingPromise);

        const dispatchPromise = (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(getAspectDetail(mockRequestData));

        // Check loading state
        expect(store.getState().aspectDetail.status).toBe('loading');

        // Resolve the promise
        resolvePromise!({ data: mockAspectDetailResponse });
        await dispatchPromise;

        // Check succeeded state
        expect(store.getState().aspectDetail.status).toBe('succeeded');
      });
    });

    describe('Different Request Data Scenarios', () => {
      it('should handle request with null id_token', async () => {
        mockedAxiosPost.mockResolvedValueOnce({ data: mockAspectDetailResponse });

        const requestWithNullToken = {
          id_token: null,
          resource: mockRequestData.resource,
        };

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(getAspectDetail(requestWithNullToken));

        expect(axios.defaults.headers.common['Authorization']).toBe('');
      });

      it('should handle request with empty string id_token', async () => {
        mockedAxiosPost.mockResolvedValueOnce({ data: mockAspectDetailResponse });

        const requestWithEmptyToken = {
          id_token: '',
          resource: mockRequestData.resource,
        };

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(getAspectDetail(requestWithEmptyToken));

        expect(axios.defaults.headers.common['Authorization']).toBe('');
      });

      it('should handle different resource paths', async () => {
        mockedAxiosPost.mockResolvedValueOnce({ data: mockAspectDetailResponse });

        const differentResource = {
          id_token: 'token',
          resource: 'projects/other-project/locations/eu-west1/entryGroups/other-group/entries/other-entry',
        };

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(getAspectDetail(differentResource));

        expect(mockedAxiosPost).toHaveBeenCalledWith(
          'http://localhost:3000/api/v1/get-aspect-detail',
          { name: differentResource.resource }
        );
      });
    });

    describe('Response Data Variations', () => {
      it('should handle complex nested response data', async () => {
        const complexResponse = {
          aspectType: 'dataQuality',
          aspectData: {
            rules: [
              { name: 'nullCheck', passed: true },
              { name: 'rangeCheck', passed: false, details: { min: 0, max: 100 } },
            ],
            summary: {
              totalRules: 2,
              passedRules: 1,
              score: 0.5,
            },
          },
          metadata: {
            source: 'bigquery',
            table: 'test_table',
          },
        };

        mockedAxiosPost.mockResolvedValueOnce({ data: complexResponse });

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(getAspectDetail(mockRequestData));

        const state = store.getState().aspectDetail;
        expect(state.items).toEqual(complexResponse);
      });

      it('should handle empty object response', async () => {
        mockedAxiosPost.mockResolvedValueOnce({ data: {} });

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(getAspectDetail(mockRequestData));

        const state = store.getState().aspectDetail;
        expect(state.status).toBe('succeeded');
        expect(state.items).toEqual({});
      });

      it('should handle undefined response data', async () => {
        mockedAxiosPost.mockResolvedValueOnce({ data: undefined });

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(getAspectDetail(mockRequestData));

        const state = store.getState().aspectDetail;
        expect(state.status).toBe('succeeded');
        expect(state.items).toBeUndefined();
      });
    });
  });

  describe('State Transitions', () => {
    it('should handle complete flow: idle -> loading -> succeeded', async () => {
      mockedAxiosPost.mockResolvedValueOnce({ data: mockAspectDetailResponse });

      // Initial state
      expect(store.getState().aspectDetail.status).toBe('idle');

      const promise = (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(getAspectDetail(mockRequestData));

      // Loading state
      expect(store.getState().aspectDetail.status).toBe('loading');

      await promise;

      // Succeeded state
      expect(store.getState().aspectDetail.status).toBe('succeeded');
      expect(store.getState().aspectDetail.items).toEqual(mockAspectDetailResponse);
    });

    it('should handle complete flow: idle -> loading -> failed', async () => {
      mockedAxiosPost.mockRejectedValueOnce(new Error('Failed'));

      // Initial state
      expect(store.getState().aspectDetail.status).toBe('idle');

      const promise = (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(getAspectDetail(mockRequestData));

      // Loading state
      expect(store.getState().aspectDetail.status).toBe('loading');

      await promise;

      // Failed state
      expect(store.getState().aspectDetail.status).toBe('failed');
      expect(store.getState().aspectDetail.error).toBe('An unknown error occurred');
    });

    it('should handle retry after failure', async () => {
      // First call fails
      mockedAxiosPost.mockRejectedValueOnce(new Error('Failed'));
      await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(getAspectDetail(mockRequestData));
      expect(store.getState().aspectDetail.status).toBe('failed');

      // Second call succeeds
      mockedAxiosPost.mockResolvedValueOnce({ data: mockAspectDetailResponse });
      await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(getAspectDetail(mockRequestData));

      expect(store.getState().aspectDetail.status).toBe('succeeded');
      expect(store.getState().aspectDetail.items).toEqual(mockAspectDetailResponse);
    });
  });
});
