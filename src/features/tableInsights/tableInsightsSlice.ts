import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios, { AxiosError } from 'axios';
import { mockInsightsData, type InsightJob, type InsightsResponse } from '../../mocks/insightsMockData';
import { URLS } from '../../constants/urls';

// Flag to use mock data during development (set to false when backend is ready)
const USE_MOCK_DATA = false;

export interface InsightData {
  jobs: InsightJob[];
  lastFetched: number;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

interface InsightsState {
  insightsByResource: { [resourceId: string]: InsightData };
  loadingResources: string[];
  globalStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: InsightsState = {
  insightsByResource: {},
  loadingResources: [],
  globalStatus: 'idle',
  error: null,
};

// Async thunk to fetch insights for a specific resource
export const fetchInsights = createAsyncThunk(
  'insights/fetchInsights',
  async (
    requestData: { resourceId: string; id_token: string, scanName: string },
    { rejectWithValue, getState }
  ) => {
    if (!requestData?.resourceId || !requestData?.scanName || !requestData?.id_token) {
      return { resourceId: '', data: null };
    }

    // Check if we already have data and it's not stale (5 minutes TTL)
    const state = getState() as any;
    const existingData = state.insights.insightsByResource[requestData.resourceId];
    const lastFetched = existingData?.lastFetched;
    const currentTime = Date.now();

    // If we have data and it's less than 5 minutes old, return existing data
    if (
      existingData &&
      existingData.jobs &&
      lastFetched &&
      currentTime - lastFetched < 5 * 60 * 1000
    ) {
      return { resourceId: requestData.resourceId, data: existingData.jobs };
    }

    try {
      let data: InsightsResponse;

      if (USE_MOCK_DATA) {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        data = mockInsightsData;
      } else {
        // Real API call
        axios.defaults.headers.common['Authorization'] = requestData.id_token
          ? `Bearer ${requestData.id_token}`
          : '';

        //const finalEntryName = `projects/${project}/locations/${location}/dataProducts/${requestData.dataProductId.split('/').pop()}`;
    
        const response = await axios.get(
            URLS.API_URL + URLS.GET_SCAN_JOBS + `?parent=${requestData.scanName}`
            //`https://dataplex.googleapis.com/v1/${requestData.scanName}/jobs`
        );

        let res = response.data;
        console.log('API response for insights:', res);
        let insights = res.map((job: any) => {
          return job.full_details ? job.full_details : job;
        });

        data = { insights: insights };
      }

      return { resourceId: requestData.resourceId, data: data.insights };
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(error.response?.data || error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  },
  {
    // Prevent duplicate requests for the same resource
    condition: (requestData, { getState }) => {
      if (!requestData?.resourceId) return false;

      const state = getState() as any;
      const isCurrentlyLoading = state.insights.loadingResources.includes(
        requestData.resourceId
      );
      const existingData = state.insights.insightsByResource[requestData.resourceId];
      const lastFetched = existingData?.lastFetched;
      const currentTime = Date.now();

      // Don't make request if already loading or have recent data
      if (
        isCurrentlyLoading ||
        (existingData &&
          existingData.jobs &&
          lastFetched &&
          currentTime - lastFetched < 5 * 60 * 1000)
      ) {
        return false;
      }
      return true;
    },
  }
);

export const insightsSlice = createSlice({
  name: 'insights',
  initialState,
  reducers: {
    clearInsightsData: (state, action) => {
      const resourceId = action.payload;
      delete state.insightsByResource[resourceId];
      state.loadingResources = state.loadingResources.filter(
        (id) => id !== resourceId
      );
    },
    clearAllInsightsData: (state) => {
      state.insightsByResource = {};
      state.loadingResources = [];
      state.globalStatus = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInsights.pending, (state, action) => {
        const resourceId = action.meta.arg.resourceId;

        // Initialize resource data if it doesn't exist
        if (!state.insightsByResource[resourceId]) {
          state.insightsByResource[resourceId] = {
            jobs: [],
            lastFetched: 0,
            status: 'loading',
            error: null,
          };
        } else {
          state.insightsByResource[resourceId].status = 'loading';
          state.insightsByResource[resourceId].error = null;
        }

        // Add to loading resources if not already there
        if (!state.loadingResources.includes(resourceId)) {
          state.loadingResources.push(resourceId);
        }

        // Update global status
        if (state.globalStatus === 'idle') {
          state.globalStatus = 'loading';
        }
      })
      .addCase(fetchInsights.fulfilled, (state, action) => {
        const resourceId = action.payload.resourceId;
        const insightsData = action.payload.data;

        if (state.insightsByResource[resourceId]) {
          state.insightsByResource[resourceId].status = 'succeeded';
          state.insightsByResource[resourceId].jobs = insightsData || [];
          state.insightsByResource[resourceId].lastFetched = Date.now();
          state.insightsByResource[resourceId].error = null;
        }

        // Remove from loading resources
        state.loadingResources = state.loadingResources.filter(
          (id) => id !== resourceId
        );

        // Update global status
        if (state.loadingResources.length === 0) {
          state.globalStatus = 'succeeded';
        }
      })
      .addCase(fetchInsights.rejected, (state, action) => {
        const resourceId = action.meta.arg.resourceId;

        if (state.insightsByResource[resourceId]) {
          state.insightsByResource[resourceId].status = 'failed';
          state.insightsByResource[resourceId].error =
            action.error.message || 'Unknown error';
        }

        // Remove from loading resources
        state.loadingResources = state.loadingResources.filter(
          (id) => id !== resourceId
        );

        // Update global status
        if (state.loadingResources.length === 0) {
          state.globalStatus = 'failed';
        }
      });
  },
});

// Selectors
export const selectInsightsData = (resourceId: string) => (state: any) =>
  state.insights.insightsByResource[resourceId]?.jobs;

export const selectInsightsStatus = (resourceId: string) => (state: any) =>
  state.insights.insightsByResource[resourceId]?.status || 'idle';

export const selectInsightsError = (resourceId: string) => (state: any) =>
  state.insights.insightsByResource[resourceId]?.error;

export const selectIsInsightsLoading = (resourceId: string) => (state: any) =>
  state.insights.loadingResources.includes(resourceId);

export const selectInsightsGlobalStatus = (state: any) =>
  state.insights.globalStatus;

export const { clearInsightsData, clearAllInsightsData } = insightsSlice.actions;
export default insightsSlice.reducer;