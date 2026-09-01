import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios, { AxiosError } from 'axios';
import { URLS } from '../../constants/urls';

const getProjectNumber = (projectId: string, appConfig: any) => {
  let projects:any[] = appConfig?.projects ?? [];
  let projectName:string = projects.find((p) => p.projectId === projectId)?.name || '';
  return projectName.split('/').length > 0 ? projectName.split('/')[1] : '';
}

// Replace the project number segment in a resource path with its project id.
// appConfig.projects maps each project as { projectId, name: 'projects/{projectNumber}' },
// so we look up the projectNumber found in the resource and swap it for the projectId.
// e.g. projects/123456789/... -> projects/my-project-id/...
const replaceProjectNumberWithProjectId = (resource: string, appConfig: any): string => {
  if (!resource) return resource;
  const projects: any[] = appConfig?.projects ?? [];
  const match = resource.match(/projects\/([^/]+)/);
  if (!match) return resource;
  const projectNumber = match[1];
  const projectId = projects.find((p) => p.name === `projects/${projectNumber}`)?.projectId;
  return projectId ? resource.replace(`projects/${projectNumber}`, `projects/${projectId}`) : resource;
}

// Map a search entry (dataplexEntry) into the same shape as an API data product.
// Fields that are not available from search are defaulted to null, and list
// fields (e.g. ownerEmails) to an empty array.
const mapSearchEntryToDataProduct = (searchEntry: any) => {
  const entry = searchEntry?.dataplexEntry ?? {};
  const source = entry.entrySource ?? {};
  return {
    // Use the resource path as the name so it matches the API data products list.
    name: source.resource ?? null,
    displayName: source.displayName ?? null,
    description: source.description ?? null,
    createTime: entry.createTime ?? null,
    updateTime: entry.updateTime ?? null,
    labels: source.labels ?? null,
    ownerEmails: [],
    assetCount: null,
    icon: null,
    accessGroups: null,
    accessApprovalConfig: null,
    etag:"",
    label:"",
  };
}

// createAsyncThunk is used for asynchronous actions.
// It will automatically dispatch pending, fulfilled, and rejected actions.
export const fetchDataProductsList = createAsyncThunk('dataProducts/fetchDataProductsList', async (requestData: any , { rejectWithValue, getState }) => {
  // If the requestData is empty, we are returning an empty list.
  if (!requestData) {
    return [];
  }

  try {
    // fetching data products from API endpoint
    axios.defaults.headers.common['Authorization'] = requestData.id_token ? `Bearer ${requestData.id_token}` : '';
    const appConfig = (getState() as any).user?.userData?.appConfig;
    const params: Record<string, string> = {};
    if (appConfig?.projectsRestricted && appConfig?.configuredProjectIds?.length > 0) {
      params.projectIds = appConfig.configuredProjectIds.join(',');
    }
    const response = await axios.get(URLS.API_URL + URLS.DATA_PRODUCTS, { params });
    console.log("API response", response);
    const searchDataProducts =  async () => {
      const result = await axios.post(
        URLS.API_URL + URLS.SEARCH_ENTRIES,
        { project: import.meta.env.VITE_GOOGLE_PROJECT_ID, location: 'global', query: '(type=DATA_PRODUCT)', orderBy: 'relevance', pageSize: 1000 },
      );

      if (result.status === 200) {
        const results = result.data.results || [];
        // Normalize each entry's resource path: replace projects/{projectNumber}
        // with projects/{projectId} using the appConfig.projects mapping.
        return results.map((entry: any) => {
          const resource = entry?.dataplexEntry?.entrySource?.resource;
          if (resource) {
            entry.dataplexEntry.entrySource.resource = replaceProjectNumberWithProjectId(resource, appConfig);
          }
          return entry;
        });
      } else {
        return [];
      }
    };

    if(response.status === 200 || response.status !== 401) {
      const searchResults = await searchDataProducts();
      console.log("Search Results:", searchResults);
      // Merge the search results with the API response dataProducts based on resource path.
      const projectDataProducts = response.data.dataProducts || [];
      // Set of API data product resource names for quick lookup.
      const projectDataProductNames = new Set(projectDataProducts.map((p: any) => p?.name).filter(Boolean));

      // Find search entries that are NOT present in the API data products list,
      // matched by dataplexEntry.entrySource.resource === dataProduct.name.
      const searchOnlyProducts = searchResults
        .filter((searchEntry: any) => {
          const searchResource = searchEntry?.dataplexEntry?.entrySource?.resource;
          return searchResource && !projectDataProductNames.has(searchResource);
        })
        .map(mapSearchEntryToDataProduct);
      console.log("Search-only Data Products (not in API list):", searchOnlyProducts);

      const mergedDataProducts = [...projectDataProducts, ...searchOnlyProducts];
      return mergedDataProducts;
    } else {
      return rejectWithValue('Token expired');
    }
    
    
    // return response.status === 200 || response.status !== 401 ? [
    //   ...response.data.dataProducts
    //  ] : rejectWithValue('Token expired');
    //return mockSearchData; // For testing, we return mock data

  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.response?.status === 403) {
        return rejectWithValue({ type: 'PERMISSION_DENIED' });
      }
      return rejectWithValue(error.response?.data || error.message);
    }
    return rejectWithValue('An unknown error occurred');
  }
});

export const getDataProductDetails = createAsyncThunk('dataProducts/getDataProductDetails', async (requestData: any , { rejectWithValue, getState }) => {
  // If the requestData is empty, we are returning an empty list.
  if (!requestData) {
    return [];
  }

  try {
    // fetching data products from API endpoint 
    axios.defaults.headers.common['Authorization'] = requestData.id_token ? `Bearer ${requestData.id_token}` : '';
    
    const project = requestData.dataProductId.split('/')[1];
    const location = requestData.dataProductId.split('/')[3];
    let appConfig = (getState() as any).user?.userData?.appConfig;
    // appConfig.projects is only populated when Home.tsx mounts and fetches APP_CONFIG.
    // On deep-link login that bypasses /home, the projects list is empty and
    // getProjectNumber returns '' — producing a malformed entry name → PERMISSION_DENIED.
    // Fetch appConfig inline when it is not yet available.
    if (!appConfig?.projects?.length) {
      try {
        const configRes = await axios.get(URLS.API_URL + URLS.APP_CONFIG);
        appConfig = configRes.data;
      } catch {
        // fall through — getProjectNumber will return '' and the API will 403 with a clear error
      }
    }
    const finalEntryName = `projects/${project}/locations/${location}/entryGroups/@dataplex/entries/projects/${getProjectNumber(project, appConfig)}/locations/${location}/dataProducts/${requestData.dataProductId.split('/')[5]}`;

    const response = await axios.get(URLS.API_URL + URLS.DATA_PRODUCT_DETAILS, {
    params: {
        project,
        location,
        entry: finalEntryName
    }
    });

    console.log("API response", response);
    return response.status === 200 || response.status !== 401 ? response.data
    : rejectWithValue('Token expired');
    //return mockSearchData; // For testing, we return mock data

  } catch (error) {
    if (error instanceof AxiosError) {
      const axiosError = error as AxiosError;
      // Handle 403 Forbidden separately - don't trigger global logout
      console.log("axiosError.response?.status", axiosError.response);
      if (axiosError.response?.status === 403) {
        return rejectWithValue(JSON.stringify({
          type: "PERMISSION_DENIED",
          message: "You don't have access to this resource",
          itemId: requestData.dataProductId,
        }));
      }
      return rejectWithValue(axiosError.response?.data || axiosError.message);
    }
    return rejectWithValue('An unknown error occurred');
  }
});

export const fetchDataProductsAssetsList = createAsyncThunk('dataProducts/fetchDataProductsAssetsList', async (requestData: any , { rejectWithValue }) => {
  // If the requestData is empty, we are returning an empty list.
  if (!requestData) {
    return [];
  }

  try {
    // fetching data products from API endpoint 
    axios.defaults.headers.common['Authorization'] = requestData.id_token ? `Bearer ${requestData.id_token}` : '';
    const project = requestData.dataProductId.split('/')[1];
    const location = requestData.dataProductId.split('/')[3];
    const finalEntryName = `projects/${project}/locations/${location}/dataProducts/${requestData.dataProductId.split('/').pop()}`;

    const response = await axios.get(URLS.API_URL + URLS.DATA_PRODUCT_ASSETS, {
        params: { dataProduct: finalEntryName }
    });
    console.log("Data Products Assets API response", response);
    return response.status === 200 || response.status !== 401 ? [
      ...response.data.dataAssets
     ] : rejectWithValue('Token expired');
    //return mockSearchData; // For testing, we return mock data

  } catch (error) {
    if (error instanceof AxiosError) {
      return rejectWithValue(error.response?.data || error.message);
    }
    return rejectWithValue('An unknown error occurred');
  }
});


type DataProductsState = {
  dataProductsItems: unknown; // Replace 'unknown' with your actual resource type
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | undefined | unknown | null;
  selectedDataProductDetails?: unknown|any; // Replace 'unknown' with your actual resource type
  selectedDataProductStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  selectedDataProductError: string | undefined | unknown | null;
  dataProductAssets: unknown;
  dataProductAssetsStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  dataProductAssetsError: string | undefined | unknown | null;
  // UI state preserved across navigation
  viewMode: 'table' | 'list';
  detailTabValue: number;
};

const initialState: DataProductsState = {
  dataProductsItems: [],
  status: 'idle',
  error: null,
  selectedDataProductDetails: {},
  selectedDataProductStatus: 'idle',
  selectedDataProductError: null,
  dataProductAssets: [],
  dataProductAssetsStatus: 'idle',
  dataProductAssetsError: null,
  viewMode: 'list',
  detailTabValue: 0,
};

// createSlice generates actions and reducers for a slice of the Redux state.
export const dataproductsSlice = createSlice({
  name: 'dataproducts',
  initialState,
  reducers: {
    setDataProductsViewMode: (state, action: { payload: 'table' | 'list' }) => {
      state.viewMode = action.payload;
    },
    setDataProductsDetailTabValue: (state, action: { payload: number }) => {
      state.detailTabValue = action.payload;
    },
    resetDataProductsUIState: (state) => {
      state.viewMode = 'list';
      state.detailTabValue = 0;
    },
    resetSelectedDataProduct: (state) => {
      state.selectedDataProductStatus = 'idle';
      state.selectedDataProductDetails = {};
      state.selectedDataProductError = null;
    },
  },
  // The `extraReducers` field lets the slice handle actions defined elsewhere,
  // including actions generated by createAsyncThunk.
  extraReducers: (builder) => {
    builder
      .addCase(fetchDataProductsList.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchDataProductsList.fulfilled, (state, action) => {
        state.status = 'succeeded';
        console.log("Fetched Data Products:", action.payload);
        state.dataProductsItems = action.payload || [];
      })
      .addCase(fetchDataProductsList.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(getDataProductDetails.pending, (state) => {
        state.selectedDataProductStatus = 'loading';
      })
      .addCase(getDataProductDetails.fulfilled, (state, action) => {
        state.selectedDataProductStatus = 'succeeded';
        state.selectedDataProductDetails = action.payload;
      })
      .addCase(getDataProductDetails.rejected, (state, action) => {
        state.selectedDataProductStatus = 'failed';
        state.selectedDataProductError = action.payload;
      })
      .addCase(fetchDataProductsAssetsList.pending, (state) => {
        state.dataProductAssetsStatus = 'loading';
        state.dataProductAssets = [];  // Clear old assets when fetching new ones
      })
      .addCase(fetchDataProductsAssetsList.fulfilled, (state, action) => {
        state.dataProductAssetsStatus = 'succeeded';
        console.log("Fetched Data Products Assets:", action.payload);
        state.dataProductAssets = action.payload || [];
      })
      .addCase(fetchDataProductsAssetsList.rejected, (state, action) => {
        state.dataProductAssetsStatus = 'failed';
        state.dataProductAssetsError = action.payload;
      })
  },
});

export const { setDataProductsViewMode, setDataProductsDetailTabValue, resetDataProductsUIState, resetSelectedDataProduct } = dataproductsSlice.actions;
export default dataproductsSlice.reducer;