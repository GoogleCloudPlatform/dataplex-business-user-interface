import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from './api/apiSlice';
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import userReducer from '../features/user/userSlice';
import searchReducer from '../features/search/searchSlice';
import resourcesReducer from '../features/resources/resourcesSlice';
import entryReducer from '../features/entry/entrySlice';
import sampleDataReducer from '../features/sample-data/sampleDataSlice';
import dataScanReducer from '../features/dataScan/dataScanSlice';
import lineageReducer from '../features/lineage/lineageSlice';
import projectsReducer from '../features/projects/projectsSlice';
import glossariesReducer from '../features/glossaries/glossariesSlice';
import dataProductsReducer from '../features/dataProducts/dataProductsSlice';
import { loadStateFromStorage, saveStateToStorage } from '../utils/persistence';
import { authMiddleware } from '../middleware/authMiddleware';


// Load persisted state from localStorage
const persistedState = loadStateFromStorage();

const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    // Add your reducers here
    user: userReducer,
    search:searchReducer,
    resources: resourcesReducer,
    entry: entryReducer,
    sampleData: sampleDataReducer,
    dataScan: dataScanReducer,
    lineage:lineageReducer,
    projects:projectsReducer,
    glossaries: glossariesReducer,
    dataProducts: dataProductsReducer,
  },
  preloadedState: persistedState,
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware().concat(apiSlice.middleware, authMiddleware),
});

// Subscribe to store changes and save to localStorage
store.subscribe(() => {
  const state = store.getState();
  saveStateToStorage(state);
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
