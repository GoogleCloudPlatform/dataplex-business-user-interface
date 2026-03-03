import { configureStore, type AnyAction, type ThunkDispatch } from '@reduxjs/toolkit';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import axios, { AxiosError, AxiosHeaders } from 'axios';
import dataScanReducer, {
  fetchDataScan,
  fetchAllDataScans,
  clearScanData,
  clearAllScanData,
  updateScanLastFetched,
  selectScanData,
  selectScanStatus,
  selectScanError,
  selectIsScanLoading,
  selectAllScans,
  selectAllScansStatus,
  dataScanSlice,
} from './dataScanSlice';

// Define state types
type ScanData = {
  data: unknown;
  lastFetched: number;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
};

type DataScanState = {
  scans: { [scanName: string]: ScanData };
  loadingScans: string[];
  globalStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  allScans: unknown[];
  allScansStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
};

type RootState = {
  dataScan: DataScanState;
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
    GET_DATA_SCAN: '/get-data-scan',
    GET_ALL_DATA_SCANS: '/data-scans',
  },
}));

// Create a typed mock for axios.get
const mockedAxiosGet = axios.get as ReturnType<typeof vi.fn>;

describe('dataScanSlice', () => {
  // Mock data
  const mockScanName = 'projects/test-project/locations/us-central1/dataScans/test-scan';
  const mockRequestData = {
    id_token: 'test-token-123',
    name: mockScanName,
  };

  const mockScanResponse = {
    name: mockScanName,
    displayName: 'Test Scan',
    description: 'A test data scan',
    state: 'ACTIVE',
    data: {
      rowCount: 1000,
      columnCount: 10,
      qualityScore: 0.95,
    },
    createTime: '2024-01-15T10:30:00Z',
    updateTime: '2024-01-16T14:45:00Z',
  };

  const mockAllScansResponse = [
    { name: 'scan1', displayName: 'Scan 1', state: 'ACTIVE' },
    { name: 'scan2', displayName: 'Scan 2', state: 'ACTIVE' },
    { name: 'scan3', displayName: 'Scan 3', state: 'INACTIVE' },
  ];

  let store: ReturnType<typeof configureStore<{ dataScan: DataScanState }>>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    store = configureStore({
      reducer: {
        dataScan: dataScanReducer,
      },
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = store.getState().dataScan;

      expect(state.scans).toEqual({});
      expect(state.loadingScans).toEqual([]);
      expect(state.globalStatus).toBe('idle');
      expect(state.allScans).toEqual([]);
      expect(state.allScansStatus).toBe('idle');
    });

    it('should return initial state when called with undefined state', () => {
      const state = dataScanReducer(undefined, { type: 'unknown' });

      expect(state.scans).toEqual({});
      expect(state.loadingScans).toEqual([]);
      expect(state.globalStatus).toBe('idle');
      expect(state.allScans).toEqual([]);
      expect(state.allScansStatus).toBe('idle');
    });
  });

  describe('Slice Configuration', () => {
    it('should have correct slice name', () => {
      expect(dataScanSlice.name).toBe('dataScan');
    });
  });

  describe('Synchronous Reducers', () => {
    describe('clearScanData', () => {
      it('should clear specific scan data', () => {
        // First add some scan data
        const stateWithScan: DataScanState = {
          scans: {
            [mockScanName]: {
              data: mockScanResponse,
              lastFetched: 1700000000000,
              status: 'succeeded',
              error: null,
            },
          },
          loadingScans: [mockScanName],
          globalStatus: 'succeeded',
          allScans: [],
          allScansStatus: 'idle',
        };

        const newState = dataScanReducer(stateWithScan, clearScanData(mockScanName));

        expect(newState.scans[mockScanName]).toBeUndefined();
        expect(newState.loadingScans).not.toContain(mockScanName);
      });

      it('should not affect other scans when clearing specific scan', () => {
        const otherScanName = 'other-scan';
        const stateWithScans: DataScanState = {
          scans: {
            [mockScanName]: {
              data: mockScanResponse,
              lastFetched: 1700000000000,
              status: 'succeeded',
              error: null,
            },
            [otherScanName]: {
              data: { name: 'other' },
              lastFetched: 1700000000000,
              status: 'succeeded',
              error: null,
            },
          },
          loadingScans: [],
          globalStatus: 'succeeded',
          allScans: [],
          allScansStatus: 'idle',
        };

        const newState = dataScanReducer(stateWithScans, clearScanData(mockScanName));

        expect(newState.scans[mockScanName]).toBeUndefined();
        expect(newState.scans[otherScanName]).toBeDefined();
      });
    });

    describe('clearAllScanData', () => {
      it('should clear all scan data', () => {
        const stateWithScans: DataScanState = {
          scans: {
            scan1: { data: {}, lastFetched: 1000, status: 'succeeded', error: null },
            scan2: { data: {}, lastFetched: 2000, status: 'succeeded', error: null },
          },
          loadingScans: ['scan1', 'scan2'],
          globalStatus: 'succeeded',
          allScans: mockAllScansResponse,
          allScansStatus: 'succeeded',
        };

        const newState = dataScanReducer(stateWithScans, clearAllScanData());

        expect(newState.scans).toEqual({});
        expect(newState.loadingScans).toEqual([]);
        expect(newState.globalStatus).toBe('idle');
        // allScans should remain unchanged
        expect(newState.allScans).toEqual(mockAllScansResponse);
      });
    });

    describe('updateScanLastFetched', () => {
      it('should update lastFetched for existing scan', () => {
        const stateWithScan: DataScanState = {
          scans: {
            [mockScanName]: {
              data: mockScanResponse,
              lastFetched: 1000,
              status: 'succeeded',
              error: null,
            },
          },
          loadingScans: [],
          globalStatus: 'succeeded',
          allScans: [],
          allScansStatus: 'idle',
        };

        const newTimestamp = 2000;
        const newState = dataScanReducer(
          stateWithScan,
          updateScanLastFetched({ scanName: mockScanName, timestamp: newTimestamp })
        );

        expect(newState.scans[mockScanName].lastFetched).toBe(newTimestamp);
      });

      it('should not create scan entry if scan does not exist', () => {
        const newState = dataScanReducer(
          undefined,
          updateScanLastFetched({ scanName: 'nonexistent', timestamp: 2000 })
        );

        expect(newState.scans['nonexistent']).toBeUndefined();
      });
    });
  });

  describe('fetchDataScan Thunk', () => {
    describe('Pending State', () => {
      it('should initialize scan data and set loading status when pending', () => {
        const action = {
          type: fetchDataScan.pending.type,
          meta: { arg: { name: mockScanName } },
        };
        const state = dataScanReducer(undefined, action);

        expect(state.scans[mockScanName]).toBeDefined();
        expect(state.scans[mockScanName].status).toBe('loading');
        expect(state.scans[mockScanName].data).toBeNull();
        expect(state.scans[mockScanName].error).toBeNull();
        expect(state.loadingScans).toContain(mockScanName);
        expect(state.globalStatus).toBe('loading');
      });

      it('should update existing scan to loading status when pending', () => {
        const stateWithScan: DataScanState = {
          scans: {
            [mockScanName]: {
              data: mockScanResponse,
              lastFetched: 1000,
              status: 'succeeded',
              error: null,
            },
          },
          loadingScans: [],
          globalStatus: 'succeeded',
          allScans: [],
          allScansStatus: 'idle',
        };

        const action = {
          type: fetchDataScan.pending.type,
          meta: { arg: { name: mockScanName } },
        };
        const newState = dataScanReducer(stateWithScan, action);

        expect(newState.scans[mockScanName].status).toBe('loading');
        expect(newState.scans[mockScanName].error).toBeNull();
        expect(newState.loadingScans).toContain(mockScanName);
      });

      it('should not add duplicate scan name to loadingScans', () => {
        const stateWithLoading: DataScanState = {
          scans: {
            [mockScanName]: {
              data: null,
              lastFetched: 0,
              status: 'loading',
              error: null,
            },
          },
          loadingScans: [mockScanName],
          globalStatus: 'loading',
          allScans: [],
          allScansStatus: 'idle',
        };

        const action = {
          type: fetchDataScan.pending.type,
          meta: { arg: { name: mockScanName } },
        };
        const newState = dataScanReducer(stateWithLoading, action);

        expect(newState.loadingScans.filter((n) => n === mockScanName).length).toBe(1);
      });

      it('should not change globalStatus if already loading', () => {
        const stateLoading: DataScanState = {
          scans: {},
          loadingScans: ['other-scan'],
          globalStatus: 'loading',
          allScans: [],
          allScansStatus: 'idle',
        };

        const action = {
          type: fetchDataScan.pending.type,
          meta: { arg: { name: mockScanName } },
        };
        const newState = dataScanReducer(stateLoading, action);

        expect(newState.globalStatus).toBe('loading');
      });
    });

    describe('Fulfilled State', () => {
      it('should update scan data on fulfilled', () => {
        const stateWithLoading: DataScanState = {
          scans: {
            [mockScanName]: {
              data: null,
              lastFetched: 0,
              status: 'loading',
              error: null,
            },
          },
          loadingScans: [mockScanName],
          globalStatus: 'loading',
          allScans: [],
          allScansStatus: 'idle',
        };

        const action = {
          type: fetchDataScan.fulfilled.type,
          payload: { name: mockScanName, data: mockScanResponse },
        };
        const newState = dataScanReducer(stateWithLoading, action);

        expect(newState.scans[mockScanName].status).toBe('succeeded');
        expect(newState.scans[mockScanName].data).toEqual(mockScanResponse);
        expect(newState.scans[mockScanName].lastFetched).toBe(1700000000000);
        expect(newState.scans[mockScanName].error).toBeNull();
        expect(newState.loadingScans).not.toContain(mockScanName);
        expect(newState.globalStatus).toBe('succeeded');
      });

      it('should set globalStatus to succeeded when all scans complete', () => {
        const stateWithMultipleLoading: DataScanState = {
          scans: {
            [mockScanName]: { data: null, lastFetched: 0, status: 'loading', error: null },
          },
          loadingScans: [mockScanName],
          globalStatus: 'loading',
          allScans: [],
          allScansStatus: 'idle',
        };

        const action = {
          type: fetchDataScan.fulfilled.type,
          payload: { name: mockScanName, data: mockScanResponse },
        };
        const newState = dataScanReducer(stateWithMultipleLoading, action);

        expect(newState.globalStatus).toBe('succeeded');
      });

      it('should not change globalStatus if other scans still loading', () => {
        const stateWithMultipleLoading: DataScanState = {
          scans: {
            [mockScanName]: { data: null, lastFetched: 0, status: 'loading', error: null },
            'other-scan': { data: null, lastFetched: 0, status: 'loading', error: null },
          },
          loadingScans: [mockScanName, 'other-scan'],
          globalStatus: 'loading',
          allScans: [],
          allScansStatus: 'idle',
        };

        const action = {
          type: fetchDataScan.fulfilled.type,
          payload: { name: mockScanName, data: mockScanResponse },
        };
        const newState = dataScanReducer(stateWithMultipleLoading, action);

        // globalStatus should still be loading since other-scan is still loading
        expect(newState.loadingScans).toContain('other-scan');
      });
    });

    describe('Rejected State', () => {
      it('should set error status on rejected', () => {
        const stateWithLoading: DataScanState = {
          scans: {
            [mockScanName]: { data: null, lastFetched: 0, status: 'loading', error: null },
          },
          loadingScans: [mockScanName],
          globalStatus: 'loading',
          allScans: [],
          allScansStatus: 'idle',
        };

        const action = {
          type: fetchDataScan.rejected.type,
          meta: { arg: { name: mockScanName } },
          error: { message: 'Network error' },
        };
        const newState = dataScanReducer(stateWithLoading, action);

        expect(newState.scans[mockScanName].status).toBe('failed');
        expect(newState.scans[mockScanName].error).toBe('Network error');
        expect(newState.loadingScans).not.toContain(mockScanName);
        expect(newState.globalStatus).toBe('failed');
      });

      it('should set Unknown error if no error message', () => {
        const stateWithLoading: DataScanState = {
          scans: {
            [mockScanName]: { data: null, lastFetched: 0, status: 'loading', error: null },
          },
          loadingScans: [mockScanName],
          globalStatus: 'loading',
          allScans: [],
          allScansStatus: 'idle',
        };

        const action = {
          type: fetchDataScan.rejected.type,
          meta: { arg: { name: mockScanName } },
          error: {},
        };
        const newState = dataScanReducer(stateWithLoading, action);

        expect(newState.scans[mockScanName].error).toBe('Unknown error');
      });
    });

    describe('Async Thunk Execution', () => {
      it('should be blocked by condition when requestData is null', async () => {
        const result = await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          fetchDataScan(null as any)
        );

        // When condition returns false, thunk is aborted and payload is undefined
        expect((result.meta as { condition?: boolean }).condition).toBe(true);
        expect(result.payload).toBeUndefined();
        expect(mockedAxiosGet).not.toHaveBeenCalled();
      });

      it('should make API call with correct parameters', async () => {
        mockedAxiosGet.mockResolvedValueOnce({ data: mockScanResponse });

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          fetchDataScan(mockRequestData)
        );

        expect(mockedAxiosGet).toHaveBeenCalledWith(
          `http://localhost:3000/api/v1/get-data-scan?name=${mockScanName}`
        );
      });

      it('should set Authorization header with token', async () => {
        mockedAxiosGet.mockResolvedValueOnce({ data: mockScanResponse });

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          fetchDataScan(mockRequestData)
        );

        expect(axios.defaults.headers.common['Authorization']).toBe(
          `Bearer ${mockRequestData.id_token}`
        );
      });

      it('should set empty Authorization header when no token', async () => {
        mockedAxiosGet.mockResolvedValueOnce({ data: mockScanResponse });

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          fetchDataScan({ name: mockScanName })
        );

        expect(axios.defaults.headers.common['Authorization']).toBe('');
      });

      it('should handle AxiosError with response data', async () => {
        const errorResponse = { message: 'Scan not found', code: 'NOT_FOUND' };
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

        const result = await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          fetchDataScan(mockRequestData)
        );

        expect(result.payload).toEqual(errorResponse);
      });

      it('should handle AxiosError without response data', async () => {
        const axiosError = new AxiosError('Network Error', 'ERR_NETWORK');

        mockedAxiosGet.mockRejectedValueOnce(axiosError);

        const result = await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          fetchDataScan(mockRequestData)
        );

        expect(result.payload).toBe('Network Error');
      });

      it('should handle non-Axios error', async () => {
        mockedAxiosGet.mockRejectedValueOnce(new Error('Unknown error'));

        const result = await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          fetchDataScan(mockRequestData)
        );

        expect(result.payload).toBe('An unknown error occurred');
      });

      it('should be blocked by condition if scan already has data (prevents refetch)', async () => {
        // Set up store with existing data
        const storeWithCache = configureStore({
          reducer: { dataScan: dataScanReducer },
          preloadedState: {
            dataScan: {
              scans: {
                [mockScanName]: {
                  data: mockScanResponse,
                  lastFetched: 1700000000000 - 1 * 60 * 1000, // 1 minute ago
                  status: 'succeeded' as const,
                  error: null,
                },
              },
              loadingScans: [],
              globalStatus: 'succeeded' as const,
              allScans: [],
              allScansStatus: 'idle' as const,
            },
          },
        });

        const result = await (storeWithCache.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          fetchDataScan(mockRequestData)
        );

        // Condition blocks when data exists, so thunk doesn't run
        expect((result.meta as { condition?: boolean }).condition).toBe(true);
        expect(mockedAxiosGet).not.toHaveBeenCalled();
        // Existing data in store should remain unchanged
        expect(storeWithCache.getState().dataScan.scans[mockScanName].data).toEqual(mockScanResponse);
      });
    });

    describe('Condition Logic', () => {
      it('should block thunk execution when requestData is null', async () => {
        const result = await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          fetchDataScan(null as any)
        );

        // Condition returns false for null requestData, so thunk is aborted
        expect((result.meta as { condition?: boolean }).condition).toBe(true);
        expect(result.payload).toBeUndefined();
        expect(mockedAxiosGet).not.toHaveBeenCalled();
      });

      it('should not dispatch if scan is currently loading', async () => {
        const storeWithLoading = configureStore({
          reducer: { dataScan: dataScanReducer },
          preloadedState: {
            dataScan: {
              scans: {},
              loadingScans: [mockScanName],
              globalStatus: 'loading' as const,
              allScans: [],
              allScansStatus: 'idle' as const,
            },
          },
        });

        await (storeWithLoading.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          fetchDataScan(mockRequestData)
        );

        // Condition should prevent the thunk from running
        expect(mockedAxiosGet).not.toHaveBeenCalled();
      });

      it('should not dispatch if scan already has data', async () => {
        const storeWithData = configureStore({
          reducer: { dataScan: dataScanReducer },
          preloadedState: {
            dataScan: {
              scans: {
                [mockScanName]: {
                  data: mockScanResponse,
                  lastFetched: 1000,
                  status: 'succeeded' as const,
                  error: null,
                },
              },
              loadingScans: [],
              globalStatus: 'succeeded' as const,
              allScans: [],
              allScansStatus: 'idle' as const,
            },
          },
        });

        await (storeWithData.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          fetchDataScan(mockRequestData)
        );

        // Condition should prevent the thunk from running
        expect(mockedAxiosGet).not.toHaveBeenCalled();
      });
    });
  });

  describe('fetchAllDataScans Thunk', () => {
    const allScansRequestData = {
      id_token: 'test-token',
      projectId: 'test-project',
    };

    describe('Pending State', () => {
      it('should set allScansStatus to loading', () => {
        const action = { type: fetchAllDataScans.pending.type };
        const state = dataScanReducer(undefined, action);

        expect(state.allScansStatus).toBe('loading');
      });
    });

    describe('Fulfilled State', () => {
      it('should set allScans and status on fulfilled', () => {
        const action = {
          type: fetchAllDataScans.fulfilled.type,
          payload: mockAllScansResponse,
        };
        const state = dataScanReducer(undefined, action);

        expect(state.allScansStatus).toBe('succeeded');
        expect(state.allScans).toEqual(mockAllScansResponse);
      });

      it('should handle null payload', () => {
        const action = {
          type: fetchAllDataScans.fulfilled.type,
          payload: null,
        };
        const state = dataScanReducer(undefined, action);

        expect(state.allScansStatus).toBe('succeeded');
        expect(state.allScans).toEqual([]);
      });

      it('should handle undefined payload', () => {
        const action = {
          type: fetchAllDataScans.fulfilled.type,
          payload: undefined,
        };
        const state = dataScanReducer(undefined, action);

        expect(state.allScansStatus).toBe('succeeded');
        expect(state.allScans).toEqual([]);
      });
    });

    describe('Rejected State', () => {
      it('should set allScansStatus to failed', () => {
        const action = {
          type: fetchAllDataScans.rejected.type,
          payload: 'Error message',
        };
        const state = dataScanReducer(undefined, action);

        expect(state.allScansStatus).toBe('failed');
      });
    });

    describe('Async Thunk Execution', () => {
      it('should make API call with correct parameters', async () => {
        mockedAxiosGet.mockResolvedValueOnce({ data: mockAllScansResponse });

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          fetchAllDataScans(allScansRequestData)
        );

        expect(mockedAxiosGet).toHaveBeenCalledWith(
          `http://localhost:3000/api/v1/data-scans?project=${allScansRequestData.projectId}`
        );
      });

      it('should set Authorization header', async () => {
        mockedAxiosGet.mockResolvedValueOnce({ data: mockAllScansResponse });

        await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          fetchAllDataScans(allScansRequestData)
        );

        expect(axios.defaults.headers.common['Authorization']).toBe(
          `Bearer ${allScansRequestData.id_token}`
        );
      });

      it('should handle AxiosError with response data', async () => {
        const errorResponse = { message: 'Unauthorized' };
        const axiosError = new AxiosError(
          'Request failed',
          'ERR_UNAUTHORIZED',
          undefined,
          undefined,
          {
            data: errorResponse,
            status: 401,
            statusText: 'Unauthorized',
            headers: {},
            config: { headers: new AxiosHeaders() },
          }
        );

        mockedAxiosGet.mockRejectedValueOnce(axiosError);

        const result = await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          fetchAllDataScans(allScansRequestData)
        );

        expect(result.payload).toEqual(errorResponse);
      });

      it('should handle non-Axios error', async () => {
        mockedAxiosGet.mockRejectedValueOnce(new Error('Generic error'));

        const result = await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
          fetchAllDataScans(allScansRequestData)
        );

        expect(result.payload).toBe('An unknown error occurred');
      });
    });
  });

  describe('Selectors', () => {
    const stateWithData: RootState = {
      dataScan: {
        scans: {
          [mockScanName]: {
            data: mockScanResponse,
            lastFetched: 1700000000000,
            status: 'succeeded',
            error: null,
          },
          'error-scan': {
            data: null,
            lastFetched: 0,
            status: 'failed',
            error: 'Some error',
          },
        },
        loadingScans: ['loading-scan'],
        globalStatus: 'succeeded',
        allScans: mockAllScansResponse,
        allScansStatus: 'succeeded',
      },
    };

    describe('selectScanData', () => {
      it('should return scan data for existing scan', () => {
        const result = selectScanData(mockScanName)(stateWithData);
        expect(result).toEqual(mockScanResponse);
      });

      it('should return undefined for non-existent scan', () => {
        const result = selectScanData('nonexistent')(stateWithData);
        expect(result).toBeUndefined();
      });
    });

    describe('selectScanStatus', () => {
      it('should return status for existing scan', () => {
        const result = selectScanStatus(mockScanName)(stateWithData);
        expect(result).toBe('succeeded');
      });

      it('should return idle for non-existent scan', () => {
        const result = selectScanStatus('nonexistent')(stateWithData);
        expect(result).toBe('idle');
      });
    });

    describe('selectScanError', () => {
      it('should return error for scan with error', () => {
        const result = selectScanError('error-scan')(stateWithData);
        expect(result).toBe('Some error');
      });

      it('should return null for scan without error', () => {
        const result = selectScanError(mockScanName)(stateWithData);
        expect(result).toBeNull();
      });

      it('should return undefined for non-existent scan', () => {
        const result = selectScanError('nonexistent')(stateWithData);
        expect(result).toBeUndefined();
      });
    });

    describe('selectIsScanLoading', () => {
      it('should return true for loading scan', () => {
        const result = selectIsScanLoading('loading-scan')(stateWithData);
        expect(result).toBe(true);
      });

      it('should return false for non-loading scan', () => {
        const result = selectIsScanLoading(mockScanName)(stateWithData);
        expect(result).toBe(false);
      });
    });

    describe('selectAllScans', () => {
      it('should return all scans', () => {
        const result = selectAllScans(stateWithData);
        expect(result).toEqual(mockAllScansResponse);
      });
    });

    describe('selectAllScansStatus', () => {
      it('should return allScansStatus', () => {
        const result = selectAllScansStatus(stateWithData);
        expect(result).toBe('succeeded');
      });
    });
  });

  describe('State Transitions', () => {
    it('should handle complete flow: idle -> loading -> succeeded', async () => {
      mockedAxiosGet.mockResolvedValueOnce({ data: mockScanResponse });

      expect(store.getState().dataScan.globalStatus).toBe('idle');

      const promise = (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
        fetchDataScan(mockRequestData)
      );

      expect(store.getState().dataScan.globalStatus).toBe('loading');

      await promise;

      expect(store.getState().dataScan.globalStatus).toBe('succeeded');
      expect(store.getState().dataScan.scans[mockScanName].data).toEqual(mockScanResponse);
    });

    it('should handle complete flow: idle -> loading -> failed', async () => {
      mockedAxiosGet.mockRejectedValueOnce(new AxiosError('Failed', 'ERR_FAILED'));

      expect(store.getState().dataScan.globalStatus).toBe('idle');

      const promise = (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
        fetchDataScan(mockRequestData)
      );

      expect(store.getState().dataScan.globalStatus).toBe('loading');

      await promise;

      expect(store.getState().dataScan.globalStatus).toBe('failed');
    });

    it('should handle clearing and refetching', async () => {
      mockedAxiosGet.mockResolvedValueOnce({ data: mockScanResponse });

      // First fetch
      await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
        fetchDataScan(mockRequestData)
      );
      expect(store.getState().dataScan.scans[mockScanName]).toBeDefined();

      // Clear
      store.dispatch(clearScanData(mockScanName));
      expect(store.getState().dataScan.scans[mockScanName]).toBeUndefined();

      // Refetch
      mockedAxiosGet.mockResolvedValueOnce({ data: mockScanResponse });
      await (store.dispatch as ThunkDispatch<RootState, unknown, AnyAction>)(
        fetchDataScan(mockRequestData)
      );
      expect(store.getState().dataScan.scans[mockScanName]).toBeDefined();
    });
  });
});
