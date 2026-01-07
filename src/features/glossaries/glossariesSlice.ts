import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios, { AxiosError } from 'axios';
import { type GlossaryItem, type GlossaryRelation } from '../../component/Glossaries/GlossaryDataType';

// --- Helpers ---
// Helper to extract Project ID from resource name if needed
const extractProject = (resourceName: string) => {
  const parts = resourceName.split('/');
  const projectIndex = parts.indexOf('projects');
  return (projectIndex !== -1 && parts[projectIndex + 1]) 
    ? parts[projectIndex + 1] 
    : '-';
};

const extractProjectLocation = (resourceName: string) => {
  const parts = resourceName.split('/');
  
  const projectIndex = parts.indexOf('projects');
  const locationIndex = parts.indexOf('locations');

  const project = (projectIndex !== -1 && parts[projectIndex + 1]) 
    ? parts[projectIndex + 1] 
    : import.meta.env.VITE_GOOGLE_PROJECT_ID;

  const location = (locationIndex !== -1 && parts[locationIndex + 1]) 
    ? parts[locationIndex + 1] 
    : 'global';

  return { project, location };
};

// Helper to update a specific node with term relationships (Linked Assets, Synonyms, Related)
const updateTermDataInTree = (nodes: GlossaryItem[], targetId: string, data: any): boolean => {
  for (const node of nodes) {
    if (node.id === targetId) {
      node.linkedAssets = data.linkedAssets;
      node.relations = data.relations;
      return true;
    }
    if (node.children) {
      if (updateTermDataInTree(node.children, targetId, data)) return true;
    }
  }
  return false;
};

const updateChildrenInTree = (nodes: GlossaryItem[], parentId: string, newChildren: GlossaryItem[]): boolean => {
  for (const node of nodes) {
    if (node.id === parentId) {
      node.children = [...newChildren];
      return true;
    }
    if (node.children && node.children.length > 0) {
      const found = updateChildrenInTree(node.children, parentId, newChildren);
      if (found) return true;
    }
  }
  return false;
};

const updateDetailsInTree = (nodes: GlossaryItem[], targetId: string, details: any): boolean => {
  for (const node of nodes) {
    if (node.id === targetId) {
      // 1. Update basic description
      const basicDesc = details.entrySource?.description || details.description || node.description;
      node.description = basicDesc;

      // 2. Find Overview Aspect
      const overviewKey = Object.keys(details.aspects || {}).find(key => key.endsWith('overview'));
      
      // 3. Set longDescription
      if (overviewKey && details.aspects[overviewKey]?.data?.content) {
        node.longDescription = details.aspects[overviewKey].data.content;
      } else {
        node.longDescription = basicDesc;
      }

      // 4. Map Contacts 
      const contactsKey = Object.keys(details.aspects || {}).find(key => key.endsWith('contacts'));
      if (contactsKey && details.aspects[contactsKey]?.data?.identities) {
        // Map the 'id' field (email) from the identities array to the contacts string array
        node.contacts = details.aspects[contactsKey].data.identities.map((identity: any) => identity.id || identity.name);
      }
      
      node.aspects = details.aspects;
      return true;
    }
    if (node.children) {
      const found = updateDetailsInTree(node.children, targetId, details);
      if (found) return true;
    }
  }
  return false;
};


export const fetchGlossaryChildren = createAsyncThunk(
  'glossaries/fetchChildren',
  async ({ parentId, id_token }: { parentId: string, id_token: any }, { rejectWithValue }) => {
    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${id_token}`;
      
      const baseUrl = `https://dataplex.googleapis.com/v1/${parentId}`;

      // 1. Fetch Categories and Terms
      const [categoriesRes, termsRes] = await Promise.all([
        axios.get(`${baseUrl}/categories`).catch(() => ({ data: { categories: [] } })),
        axios.get(`${baseUrl}/terms`).catch(() => ({ data: { terms: [] } }))
      ]);

      const rawCategories = categoriesRes.data.categories || [];
      const rawTerms = termsRes.data.terms || [];

      // 2. Map raw API data to GlossaryItem
      // Use 'any' temporarily in map to allow adding 'parent' property which might not be in GlossaryItem interface
      const allCategoryItems = rawCategories.map((c: any) => ({
        id: c.name,
        type: 'category',
        displayName: c.displayName || 'Untitled',
        description: c.description || '', 
        longDescription: '',
        lastModified: c.updateTime ? new Date(c.updateTime).getTime() / 1000 : 0,
        labels: c.labels ? Object.keys(c.labels).map(k => `${k}:${c.labels[k]}`) : [],
        children: [], 
        contacts: [],
        parent: c.parent // Store parent to rebuild tree
      }));

      const allTermItems = rawTerms.map((t: any) => ({
        id: t.name,
        type: 'term',
        displayName: t.displayName || 'Untitled',
        description: t.description || '',
        longDescription: '',
        lastModified: t.updateTime ? new Date(t.updateTime).getTime() / 1000 : 0,
        labels: t.labels ? Object.keys(t.labels).map(k => `${k}:${t.labels[k]}`) : [],
        children: [],
        contacts: [],
        parent: t.parent // Store parent to rebuild tree
      }));

      // 3. Build Hierarchy (Reconstruct Tree)
      const categoryMap = new Map();
      allCategoryItems.forEach((cat: any) => categoryMap.set(cat.id, cat));

      const rootChildren: any[] = [];

      // A. Process Categories
      allCategoryItems.forEach((cat: any) => {
          // If this category has a parent that is ALSO in our map, nest it there.
          // Otherwise, it belongs to the Glossary (root).
          if (cat.parent && categoryMap.has(cat.parent)) {
              categoryMap.get(cat.parent).children.push(cat);
          } else {
              rootChildren.push(cat); 
          }
      });

      // B. Process Terms
      allTermItems.forEach((term: any) => {
          // If this term has a parent that is in our category map, nest it there.
          if (term.parent && categoryMap.has(term.parent)) {
               categoryMap.get(term.parent).children.push(term);
          } else {
               // Otherwise it belongs to the Glossary (root).
               rootChildren.push(term);
          }
      });

      return { parentId, children: rootChildren };

    } catch (error) {
       console.error("Error fetching children:", error);
       return rejectWithValue('Failed to fetch children');
    }
  }
);

export const fetchItemDetails = createAsyncThunk(
  'glossaries/fetchItemDetails',
  async ({ entryName, id_token }: { entryName: string, id_token: any }, { rejectWithValue }) => {
    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${id_token}`;
      
      // extractProjectLocation helper assumed to exist in file
      const { project, location } = extractProjectLocation(entryName);
      
      let finalEntryName = entryName;
      if (!entryName.includes('/entryGroups/')) {
         finalEntryName = `projects/${project}/locations/${location}/entryGroups/@dataplex/entries/${entryName}`;
      }
      
      const lookupUrl = `https://dataplex.googleapis.com/v1/projects/${project}/locations/${location}:lookupEntry`;
      
      const response = await axios.get(lookupUrl, { 
        params: { 
            entry: finalEntryName, 
            view: 'ALL' 
        } 
      });
      
      // We return 'entryName' (the original Resource ID) so the reducer can find it in the tree
      return { entryName, details: response.data };
    } catch (error) {
      return rejectWithValue('Failed to fetch item details');
    }
  }
);

export const fetchTermRelationships = createAsyncThunk(
  'glossaries/fetchTermRelationships',
  async ({ termId, id_token }: { termId: string, id_token: any }, { rejectWithValue }) => {
    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${id_token}`;
      
      // Use the project/location from the term ID for the search scope
      const { project, location } = extractProjectLocation(termId);
      const searchUrl = `https://dataplex.googleapis.com/v1/projects/${project}/locations/${location}:searchEntries`;
      
      const commonBody = { pageSize: 100, orderBy: 'relevance' };

      // Parallelize the 3 search calls
      const [linkedRes, synonymRes, relatedRes] = await Promise.all([
        // 1. Linked Assets
        axios.post(searchUrl, { 
          ...commonBody, 
          query: `term:${termId} EXP:SEMANTIC` 
        }),
        // 2. Synonyms
        axios.post(searchUrl, { 
          ...commonBody, 
          query: `synonym=${termId} type=glossary_term EXP:SEMANTIC` 
        }),
        // 3. Related Terms
        axios.post(searchUrl, { 
          ...commonBody, 
          query: `related=${termId} type=glossary_term EXP:SEMANTIC` 
        })
      ]);

      // Process Relations (Synonyms + Related)
      const mapRelation = (res: any, type: 'synonym' | 'related'): GlossaryRelation => ({
        id: res.dataplexEntry.name,
        type: type,
        displayName: res.dataplexEntry.entrySource.displayName,
        description: res.dataplexEntry.entrySource.description || '',
        lastModified: res.dataplexEntry.updateTime ? new Date(res.dataplexEntry.updateTime).getTime() / 1000 : 0
      });

      const synonyms = (synonymRes.data.results || []).map((r: any) => mapRelation(r, 'synonym'));
      const related = (relatedRes.data.results || []).map((r: any) => mapRelation(r, 'related'));

      return {
        termId,
        linkedAssets: linkedRes.data.results || [],
        relations: [...synonyms, ...related]
      };

    } catch (error) {
      return rejectWithValue('Failed to fetch term relationships');
    }
  }
);

// Fetch Full Details (LookupEntry for Description/Overview)
export const fetchGlossaryEntryDetails = createAsyncThunk(
  'glossaries/fetchEntryDetails',
  async ({ entryName, id_token }: { entryName: string, id_token: any }, { rejectWithValue }) => {
    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${id_token}`;
      
      const { project, location } = extractProjectLocation(entryName);

      let finalEntryName = entryName;
      if (!entryName.includes('/entryGroups/')) {
         finalEntryName = `projects/${project}/locations/${location}/entryGroups/@dataplex/entries/${entryName}`;
      }

      const lookupUrl = `https://dataplex.googleapis.com/v1/projects/${project}/locations/${location}:lookupEntry`;

      const response = await axios.get(lookupUrl, {
        params: {
          entry: finalEntryName,
          view: 'ALL'
        }
      });

      return { entryName, details: response.data };

    } catch (error: any) {
       return rejectWithValue(error.response?.data || 'Failed to lookup entry details');
    }
  }
);

// Helper to map API Response to GlossaryItem
const mapEntryToGlossaryItem = (apiResult: any): GlossaryItem => {
  const entry = apiResult.dataplexEntry;
  const source = entry.entrySource;
  
  return {
    id: source.resource, // Using the full entry name as unique ID
    type: 'glossary',
    displayName: source.displayName || 'Untitled',
    description: source.description || '',
    longDescription: '',
    project: extractProject(source.resource || ''),
    location: source.location || 'global',
    // Convert ISO string to unix timestamp (seconds)
    lastModified: source.updateTime ? new Date(source.updateTime).getTime() / 1000 : 0, 
    labels: source.labels ? Object.keys(source.labels).map(k => `${k}:${source.labels[k]}`) : [],
    contacts: [],
    children: [], // Will be populated by subsequent API calls
    relations: [],
    entryType: entry.entryType
  };
};

export const fetchGlossaries = createAsyncThunk(
  'glossaries/fetchGlossaries',
  async (requestData: any, { rejectWithValue }) => {
    try {
      const url = `https://dataplex.googleapis.com/v1/projects/${import.meta.env.VITE_GOOGLE_PROJECT_ID}/locations/global:searchEntries`;
      
      // Set Auth Header
      axios.defaults.headers.common['Authorization'] = requestData.id_token ? `Bearer ${requestData.id_token}` : '';

      // Query specifically for Glossaries
      const response = await axios.post(url, {
        query: "type=GLOSSARY EXP:SEMANTIC", // Standard Dataplex syntax for finding glossaries
        pageSize: 100,
        ...requestData.options 
      });

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(error.response?.data || error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

interface GlossariesState {
  glossaryItems: GlossaryItem[];
  totalSize: number;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: any;
}

const initialState: GlossariesState = {
  glossaryItems: [],
  totalSize: 0,
  status: 'idle',
  error: null,
};

export const glossariesSlice = createSlice({
  name: 'glossaries',
  initialState,
  reducers: {
    clearGlossaries: (state) => {
      state.glossaryItems = [];
      state.status = 'idle';
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGlossaries.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchGlossaries.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.totalSize = action.payload.totalSize || 0;
        
        if (action.payload.results) {
          const newItems = action.payload.results.map((result: any) => mapEntryToGlossaryItem(result));
          

          const existingItemMap = new Map(state.glossaryItems.map(item => [item.id, item]));

          state.glossaryItems = newItems.map((newItem: any) => {
            const existingItem = existingItemMap.get(newItem.id);
            
            if (existingItem) {
              return {
                ...newItem,
                children: existingItem.children, 
                aspects: existingItem.aspects, 
                linkedAssets: existingItem.linkedAssets,
                relations: existingItem.relations
              };
            }
            
            return newItem;
          });
        }
      })
      .addCase(fetchGlossaries.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchGlossaryChildren.fulfilled, (state, action) => {
        const { parentId, children } = action.payload;
        updateChildrenInTree(state.glossaryItems, parentId, children);
      })
      .addCase(fetchGlossaryEntryDetails.fulfilled, (state, action) => {
        const { entryName, details } = action.payload;
        updateDetailsInTree(state.glossaryItems, entryName, details);
      })
      .addCase(fetchTermRelationships.fulfilled, (state, action) => {
        updateTermDataInTree(state.glossaryItems, action.payload.termId, action.payload);
      });
  },
});

export const { clearGlossaries } = glossariesSlice.actions;
export default glossariesSlice.reducer;