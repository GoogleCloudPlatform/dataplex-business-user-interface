import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { URLS } from '../../constants/urls';
import axios, { AxiosError } from 'axios';
//import mockSearchData from '../../mocks/mockSearchData';

const getAspectName = (name: string) => {
  let session = localStorage.getItem('sessionUserData');
  let appConfig = session ? JSON.parse(session)?.appConfig : null;
  
  let resource:string[] = appConfig.aspects.find((a:any) => a.dataplexEntry?.entrySource?.displayName === name)?.dataplexEntry?.entrySource?.resource.split('/') ?? [];
  let projects:any[] = appConfig.projects;
  let projectId:string = resource.length == 6 
  ? projects.find((p) => p.name === `${resource[0]}/${resource[1]}`)?.projectId
  : '';
  return (projectId.length > 1 && resource.length == 6) ? `${projectId}.${resource[3]}.${resource[5]}` : resource.toString();
}
// Thunk for searching resources based on a search term
export const searchResourcesByTerm = createAsyncThunk('resources/searchResourcesByTerm', async (requestData: any , { rejectWithValue }) => {
  // If the search term is empty, we are returning an empty list.
  if (!requestData.term) {
    return [];
  }

  // If the term is not empty, we will perform a search.
  try {
    let requestResourceData = {};
    axios.defaults.headers.common['Authorization'] = requestData.id_token ? `Bearer ${requestData.id_token}` : '';
    if(requestData.requestResourceData) {
      requestResourceData = requestData.requestResourceData;
    }else{ 
      let searchString = '';
      // if(requestData.term.includes(':') || requestData.term.includes('=') 
      //   || requestData.term.includes('>') || requestData.term.includes('<')) {
      //   // If the search term contains ':', we assume it's a more complex query and use it directly.
      //   searchString = requestData.term;
      // }else{
      //   // search from your API endpoint 
      //   searchString += `name:${requestData.term}|description:${requestData.term}|`;
      //   searchString += `title:${requestData.term}|tags:${requestData.term}|fully_qualified_name:${requestData.term}|`;
      //   searchString += `category:${requestData.term}|displayName:${requestData.term}`;
      // }
      searchString = requestData.term;
      if( requestData.filters && requestData.filters.length > 0) {
        let aspectType = '';
        let system = '';
        let typeAliases = '';
        let project = '';

        requestData.filters.forEach((filter: any) => {
          if(filter.type === 'aspectType') {
            //let aspect = filter.name.replace(' ', '-');
            const name = getAspectName(filter.name);
            if(filter.subAnnotationData && filter.subAnnotationData.length > 0) {
              filter.subAnnotationData.forEach((subAspect:any) => {
                let subAspectName = `${name}.${subAspect.fieldName}`;
                let subAspectNameVal = subAspect.enabled ? (subAspect.filterType == 'include' ? `(aspect:${subAspectName}:${subAspect.value})` : `-(aspect:(${subAspectName}:${subAspect.value})`) : '';
                aspectType += (aspectType != '' ? '|' : '') + `aspect=(${subAspectName}) AND ${subAspectNameVal}`;
              });
            }else {
              aspectType += (aspectType != '' ? '|' : '') + `aspect=(${name})`;
            }
          }
          if(filter.type === 'system') {
            system += (system != '' ? '|' : '') + `${filter.name.replaceAll(' ', '_').replace('/','').toUpperCase()}`;
          }
          if(filter.type === 'typeAliases') {
            const filterName = filter.name.toLowerCase();
            let assetType = '';

            if (filterName === 'exchange') {
                assetType = 'data_exchange|exchange'; 
            } else {
                assetType = filter.name.replaceAll(' ', '_').replace('/','').toLowerCase();
            }
            
            typeAliases += (typeAliases != '' ? '|' : '') + assetType;
            }
          if(filter.type === 'project') {
            project += (project != '' ? '|' : '') + `${filter.name}`;
          }
        });
        // Example search string format: 
        // name:searchTerm|description:searchTerm|title:searchTerm|tags:searchTerm|
        // fully_qualified_name:searchTerm|category:searchTerm|displayName:searchTerm
        // (type=(DATASET|TABLE))
        // -(
        //     aspectType=(bigquery_dataset,bigquery_table)
        //     system=(ANALYTICS_HUB|CLOUD_SQL|CUSTOM|DATAFORM|DATAPLEX|DATAPROC_METASTORE|CLOUD_SPANNER|VERTEX_AI)
        //  )

        searchString += aspectType != '' ? ((searchString != '' ? ' ' : '') + `(${aspectType})`) : '';
        searchString += system != '' ? ((searchString != '' ? ',' : '') + `(system=(${system}))`) : '';
        searchString += typeAliases != '' ? ((searchString != '' ? ',' : '') + `(type=(${typeAliases}))`) : '';
        searchString += project != '' ? ((searchString != '' ? ',' : '') + `(project=(${project}))`) : '';
      }
      requestResourceData = {
        query: searchString,
        pageSize: requestData.semanticSearch ? 100 : 20,
        pageToken: requestData.nextPageToken ?? '', // Optional: for pagination
        //orderBy: '', // Optional: specify ordering  
        semanticSearch: requestData.semanticSearch || false,
      };
    }
    
    // const response = await axios.post(URLS.API_URL + URLS.SEARCH, requestResourceData);
    // const data = await response.data;
    // return data;

    const response = await axios.post(
      `https://dataplex.googleapis.com/v1/projects/${import.meta.env.VITE_GOOGLE_PROJECT_ID}/locations/global:searchEntries`,
      requestResourceData
      // },
      // {
      //   headers: {
      //     Authorization: `Bearer ${requestData.id_token}`,
      //     'Content-Type': 'application/json',
      //   },
      // }
    );

    //console.log(response);
    return response.status === 200 || response.status !== 401 ? {
      data : response.data.results,
      requestData: {...requestResourceData,pageToken: response.data.nextPageToken || ''},
      results : response.data,
    } : rejectWithValue('Token expired');
    //return mockSearchData; // For testing, we return mock data

  } catch (error) {
    if (error instanceof AxiosError) {
      return rejectWithValue(error.response?.data || error.message);
    }
    return rejectWithValue('An unknown error occurred');
  }
});

export const browseResourcesByAspects = createAsyncThunk('resources/browseResourcesByAspects', async (requestData: any , { rejectWithValue }) => {

  // If the term is not empty, we will perform a search.
  try {
    // search from your API endpoint 
    axios.defaults.headers.common['Authorization'] = requestData.id_token ? `Bearer ${requestData.id_token}` : '';
    let searchString = '';
    if(requestData.annotationName && requestData.annotationName != '') {
      let aspectType = getAspectName(requestData.annotationName);

      // let subAspect = '';
      // if(requestData.subAnnotationName && requestData.subAnnotationName != '') {
      //   subAspect += ` AND (aspect:${aspectType}.${requestData.subAnnotationName}:*)`;
      // }
      searchString += aspectType != '' ? (
        `(aspect=(${aspectType}${(requestData.subAnnotationName && requestData.subAnnotationName != '') ? '.' : ''}${requestData.subAnnotationName}))`) : '';
    }
    if(searchString != '') {
      const response = await axios.post(URLS.API_URL + URLS.SEARCH, {
        query: searchString,
      });
      const data = await response.data;
      return data;
    } else {
      return rejectWithValue('Invalid annotation name');
    }

  } catch (error) {
    if (error instanceof AxiosError) {
      return rejectWithValue(error.response?.data || error.message);
    }else if (error instanceof Error) {
      return rejectWithValue(error);
    }
    return rejectWithValue('An unknown error occurred');
  }
});
export const fetchEntriesByParent = createAsyncThunk('resources/fetchEntriesByParent', async (requestData: any , { rejectWithValue }) => {
  // If the search parent is empty, we are returning an empty list.
  if (!requestData.parent) {
    return [];
  }

  // If the term is not empty, we will perform a search.
  try {
    // search from your API endpoint 
    axios.defaults.headers.common['Authorization'] = requestData.id_token ? `Bearer ${requestData.id_token}` : '';
    let searchString = `parent=${requestData.parent}`;

    
    const response = await axios.post(URLS.API_URL + URLS.SEARCH, {
      query: searchString,
    });
    const data = await response.data;
    return data;

  } catch (error) {
    if (error instanceof AxiosError) {
      return rejectWithValue(error.response?.data || error.message);
    }
    return rejectWithValue('An unknown error occurred');
  }
});

// ResourcesState defines the shape of the resources slice of the Redux state.
// It includes an array of items, a status to track loading state, and an error message
type ResourcesState = {
  items: unknown; // Replace 'unknown' with your actual resource type
  itemsNextPageSize: number|null;
  itemsRequestData: any | null;
  totalItems?: number;
  itemsStore: unknown[]; // For storing all fetched items
  // For entry list in resource details page
  entryListData:unknown;
  entryListNextPageToken: string;
  totalEntryList?: number;
  entryListStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: any | string | undefined | unknown | null;
  entryListError: any | string | undefined | unknown | null;
};

const initialState: ResourcesState = {
  items: [],
  itemsNextPageSize: null,
  itemsRequestData: null,
  totalItems: 0,
  itemsStore:[],
  entryListData:[],
  entryListNextPageToken: '',
  totalEntryList: 0,
  entryListStatus:'idle',
  status: 'idle',
  error: null,
  entryListError: null,
};

// createSlice generates actions and reducers for a slice of the Redux state.
export const resourcesSlice = createSlice({
  name: 'resources',
  initialState,
  reducers: {
    setItems: (state, action) => {
      state.items = action.payload;
      state.status = 'succeeded';
    },
    setItemsStatus: (state, action) => {
      state.status = action.payload;
    },
    setItemsNextPageSize: (state, action) => {
      state.itemsNextPageSize = action.payload;
    },
    setItemsPageRequest: (state, action) => {
      state.itemsRequestData = action.payload;
    },
    setItemsRequestData: (state, action) => {
      state.itemsRequestData = action.payload;
    },
    setItemsStoreData: (state, action) => {
      state.itemsStore = action.payload;
    },
  }, // No synchronous reducers needed for this slice
  // The `extraReducers` field lets the slice handle actions defined elsewhere,
  // including actions generated by createAsyncThunk.
  extraReducers: (builder) => {
    builder
      .addCase(searchResourcesByTerm.pending, (state) => {
        state.items = [];
        state.status = 'loading';
      })
      .addCase(searchResourcesByTerm.fulfilled, (state, action) => {
        const payload = Array.isArray(action.payload) ? { data: [], requestData:{}, results:{} } : action.payload;
        state.totalItems = payload?.results?.totalSize ?? 0;
        state.itemsRequestData = payload?.requestData ?? {};
        state.itemsStore = [...state.itemsStore, ...(payload?.data ?? [])]; // Append new results to the store
        state.items = state.itemsNextPageSize != null 
        ? state.itemsStore.slice(state.itemsStore.length - state.itemsNextPageSize)
        : payload?.data ?? []; // Replace the list with search results
        state.status = 'succeeded';
      })
      .addCase(searchResourcesByTerm.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload; // Use payload from rejectWithValue
      })
      .addCase(browseResourcesByAspects.pending, (state) => {
        state.items = [];
        state.status = 'loading';
      })
      .addCase(browseResourcesByAspects.fulfilled, (state, action) => {
        state.totalItems = action.payload?.results?.totalSize ?? 0;
        state.itemsRequestData = action.payload?.requestData ?? {};
        state.itemsStore = [...state.itemsStore, ...(action.payload?.data ?? [])]; // Append new results to the store
        state.items = state.itemsNextPageSize != null 
        ? state.itemsStore.slice(state.itemsStore.length - state.itemsNextPageSize)
        : action.payload?.data ?? []; // Replace the list with search results
        state.status = 'succeeded';
      })
      .addCase(browseResourcesByAspects.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload; // Use payload from rejectWithValue
      })
      .addCase(fetchEntriesByParent.pending, (state) => {
        state.entryListStatus = 'loading';
      })
      .addCase(fetchEntriesByParent.fulfilled, (state, action) => {
        state.entryListData = action.payload?.data ?? []; // Replace the list with search results
        // state.totalItems = action.payload?.results?.totalSize ?? 0;
        // state.itemsRequestData = action.payload?.requestData ?? {};
        // state.itemsNextPageToken = action.payload?.results?.nextPageToken ?? '';
        state.entryListStatus = 'succeeded';
      })
      .addCase(fetchEntriesByParent.rejected, (state, action) => {
        state.entryListStatus = 'failed';
        state.entryListError = action.payload; // Use payload from rejectWithValue
      });
  },
});

export const { setItems, setItemsStatus, setItemsPageRequest, setItemsNextPageSize, setItemsRequestData, setItemsStoreData } = resourcesSlice.actions;

export default resourcesSlice.reducer;
