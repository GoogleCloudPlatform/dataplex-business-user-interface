import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import SideNav from './SideNav';
import MainComponent from './MainComponent';
import { Box, CircularProgress, Typography, useMediaQuery } from '@mui/material';
import { useAuth } from '../../auth/AuthProvider';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { URLS } from '../../constants/urls';
import { extractProjectNumberFromEntryName } from '../../utils/resourceUtils';
import { browseResourcesByAspects, setAspectBrowseCache, setBrowseSelectedItemName, setBrowseSelectedSubItem, setBrowseTabValue, setBrowseDynamicAnnotationsData, setBrowseSubTypesWithCache, setAccessDeniedItemId, clearAccessDeniedItemId } from '../../features/resources/resourcesSlice';
import { getAspectDetail } from '../../features/aspectDetail/aspectDetailSlice';
import { fetchEntry } from '../../features/entry/entrySlice';
import type { AppDispatch, RootState } from '../../app/store';
import type { ActiveFilter } from '../Common/FilterBar';
import { setSideNavOpen } from '../../features/search/searchSlice';

/**
 * @file BrowseByAnnotation.tsx
 * @summary Orchestrates the "Browse by Aspect" (Annotation) page.
 *
 * @description
 * This component serves as the main controller for the "Browse by Aspect"
 * experience. It renders a `SideNav` and a `MainComponent`.
 *
 * On initialization, it:
 * 1.  Reads the administrator-configured "Browse by Aspect" settings from the
 * `useAuth` context (`user.appConfig.browseByAspectTypes`).
 * 2.  Constructs the initial `dynamicAnnotationsData` state based on this
 * configuration. This data populates the `SideNav` and `MainComponent`.
 * 3.  Displays a `CircularProgress` loader while this initial data is processed.
 * 4.  Displays a "No Aspects" message if no browse-by-aspects are configured
 * in the `appConfig`.
 *
 * It manages the UI state for:
 * -   `selectedItem`: The top-level aspect category clicked by the user.
 * -   `selectedSubItem`: The nested sub-item clicked by the user.
 *
 * When a `selectedItem` is chosen (and no `selectedSubItem` is active), it
 * triggers a `useEffect` to *lazily load* the resource counts for all
 * sub-items under that category. It does this by dispatching the
 * `browseResourcesByAspects` Redux action for each sub-item and updating
 * the state with the results.
 *
 * @param {object} props - This component accepts no props. It derives all
 * state and configuration from React hooks (`useState`, `useEffect`) and
 * context (`useAuth`, `useDispatch`).
 *
 * @returns {JSX.Element} The rendered React component.
 * - If `loader` is true, it returns a `CircularProgress` spinner.
 * - If `loader` is false and no aspects are configured, it returns a
 * "No Aspects" message.
 * - Otherwise, it returns the `SideNav` and `MainComponent` layout.
 */

const BrowseByAnnotation = () => {

  const { user, updateUser } = useAuth();
  const id_token = user?.token || '';
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Guards so the deep-link bootstrap effects fire exactly once each, even across
  // re-renders/StrictMode double-invocation (mirrors Glossaries.tsx's urlEntryHandled).
  const aspectParamHandled = useRef(false);
  const subTypeParamHandled = useRef(false);
  // Guards the inline APP_CONFIG fetch (see below) so it fires at most once per mount.
  const appConfigFetchAttempted = useRef(false);

  // Redux-backed state for navigation preservation
  const reduxSelectedItemName = useSelector((state: RootState) => state.resources.browseSelectedItemName);
  const reduxSelectedSubItem = useSelector((state: RootState) => state.resources.browseSelectedSubItem);
  const reduxTabValue = useSelector((state: RootState) => state.resources.browseTabValue);
  const reduxDynamicAnnotationsData = useSelector((state: RootState) => state.resources.browseDynamicAnnotationsData) as any[];
  const reduxSubTypesWithCache = useSelector((state: RootState) => state.resources.browseSubTypesWithCache) as Record<string, boolean>;
  const accessDeniedItemId = useSelector((state: RootState) => state.resources.accessDeniedItemId);

  const [loader, setLoader] = useState<boolean>(reduxDynamicAnnotationsData.length === 0);
  const [selectedItemName, _setSelectedItemName] = useState<string | null>(reduxSelectedItemName);
  const [selectedSubItem, _setSelectedSubItem] = useState<any | null>(reduxSelectedSubItem);
  const [dynamicAnnotationsData, _setDynamicAnnotationsData] = useState<any>(reduxDynamicAnnotationsData.length > 0 ? reduxDynamicAnnotationsData : []);
  const [subTypesWithCache, _setSubTypesWithCache] = useState<Record<string, boolean>>(reduxSubTypesWithCache);
  const [tabValue, _setTabValue] = useState<number>(reduxTabValue);

  // Wrapper functions that sync local state to Redux
  const setSelectedItemName = useCallback((val: string | null) => {
    _setSelectedItemName(val);
    dispatch(setBrowseSelectedItemName(val));
  }, [dispatch]);
  const setSelectedSubItem = useCallback((val: any | null) => {
    _setSelectedSubItem(val);
    dispatch(setBrowseSelectedSubItem(val));
  }, [dispatch]);
  const setTabValue = useCallback((val: number) => {
    _setTabValue(val);
    dispatch(setBrowseTabValue(val));
  }, [dispatch]);
  const setDynamicAnnotationsData = useCallback((val: any) => {
    // Support both direct value and updater function pattern
    if (typeof val === 'function') {
      _setDynamicAnnotationsData((prev: any) => {
        const next = val(prev);
        dispatch(setBrowseDynamicAnnotationsData(next));
        return next;
      });
    } else {
      _setDynamicAnnotationsData(val);
      dispatch(setBrowseDynamicAnnotationsData(val));
    }
  }, [dispatch]);
  const setSubTypesWithCache = useCallback((val: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => {
    if (typeof val === 'function') {
      _setSubTypesWithCache((prev) => {
        const next = val(prev);
        dispatch(setBrowseSubTypesWithCache(next));
        return next;
      });
    } else {
      _setSubTypesWithCache(val);
      dispatch(setBrowseSubTypesWithCache(val));
    }
  }, [dispatch]);

  const [aspectFilters, setAspectFilters] = useState<ActiveFilter[]>([]);

  // State variables for tab-based view
  const [contentSearchTerm, setContentSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'assets' | 'type'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loadingAspectName, setLoadingAspectName] = useState<string | null>(null);
  const isSidebarOpen = useSelector((state: any) => state.search.isSideNavOpen);
  const projectsList = useSelector((state: any) => state.projects?.items ?? []);
  const isSmallScreen = useMediaQuery('(max-width: 1280px)');
  // NEW: AbortController for Phase 2
  const abortControllerRef = useRef<AbortController | null>(null);

  // Extract appConfig properties for useEffect dependencies
  const aspects = user?.appConfig?.aspects;
  const browseByAspectTypes = user?.appConfig?.browseByAspectTypes;

  // Access Redux cache
  const aspectBrowseCache = useSelector((state: RootState) => state.resources.aspectBrowseCache);

  // Derive selectedItem from dynamicAnnotationsData (single source of truth)
  // This eliminates state desynchronization issues between selectedItem and dynamicAnnotationsData
  const selectedItem = dynamicAnnotationsData.find(
    (item: any) => item.name === selectedItemName
  ) || null;

  // Reverse map from FilterBar property labels to field keys
  const LABEL_TO_FIELD: Record<string, string> = {
    'Name contains': 'name_contains',
    'Name prefix': 'name_prefix',
    'Location': 'location',
    'Created on': 'created_on',
    'Created before': 'created_before',
    'Created after': 'created_after',
  };

  // Client-side filtering of aspects based on active filter chips
  const filteredAnnotationsData = useMemo(() => {
    if (aspectFilters.length === 0) return dynamicAnnotationsData;

    // Split filters into groups by isOr flag
    const filterGroups: ActiveFilter[][] = [];
    let currentGroup: ActiveFilter[] = [];
    for (const filter of aspectFilters) {
      if (filter.isOr && currentGroup.length > 0) {
        filterGroups.push(currentGroup);
        currentGroup = [filter];
      } else {
        currentGroup.push(filter);
      }
    }
    if (currentGroup.length > 0) filterGroups.push(currentGroup);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const matchesGroup = (item: any, group: ActiveFilter[]): boolean => {
      return group.every((filter) => {
        const val = (filter.values[0] || '').toLowerCase();
        const field = LABEL_TO_FIELD[filter.property] || 'name_contains';
        switch (field) {
          case "name_contains":
            return (item.title || "").toLowerCase().includes(val) ||
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (item.subItems || []).some((sub: any) =>
                (sub.title || "").toLowerCase().includes(val) ||
                (sub.displayName || "").toLowerCase().includes(val));
          case "name_prefix":
            return (item.title || "").toLowerCase().startsWith(val) ||
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (item.subItems || []).some((sub: any) =>
                (sub.title || "").toLowerCase().startsWith(val) ||
                (sub.displayName || "").toLowerCase().startsWith(val));
          case "location":
            return (item.location || "").toLowerCase().includes(val);
          case "created_on": {
            if (!item.createTime) return false;
            const itemDate = new Date(item.createTime.seconds ? item.createTime.seconds * 1000 : item.createTime);
            const filterDate = new Date(filter.values[0]);
            return itemDate.toISOString().slice(0, 10) === filterDate.toISOString().slice(0, 10);
          }
          case "created_before": {
            if (!item.createTime) return false;
            const itemDate = new Date(item.createTime.seconds ? item.createTime.seconds * 1000 : item.createTime);
            const filterDate = new Date(filter.values[0]);
            return itemDate < filterDate;
          }
          case "created_after": {
            if (!item.createTime) return false;
            const itemDate = new Date(item.createTime.seconds ? item.createTime.seconds * 1000 : item.createTime);
            const filterDate = new Date(filter.values[0]);
            filterDate.setDate(filterDate.getDate() + 1); // Include the filter date
            return itemDate >= filterDate;
          }
          default:
            return true;
        }
      });
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return dynamicAnnotationsData.filter((item: any) =>
      // OR between groups: item matches if it matches ANY group
      filterGroups.some((group) => matchesGroup(item, group))
    );
  }, [dynamicAnnotationsData, aspectFilters]);

  // Cache key generator helper
  const generateCacheKey = (aspectTitle: string, subTypeName: string) => {
    return `${aspectTitle}__${subTypeName}`;
  };

  useEffect(() => {
    const fetchSubItemCounts = async (item: any) => {
      // Guard: skip if already loaded subtypes or counts (prevents infinite loop)
      if (!item || item.countsFetched || item.subTypesLoaded) {
        return;
      }

      setLoadingAspectName(item.name);

      try {
        // Convert entry path to aspect type path for getAspectDetail API
        const aspectTypePath = item.name
          .replace('/entryGroups/@dataplex/entries/', '/aspectTypes/')
          .replace('_aspectType', '');

        // PHASE 1: Fetch aspect details and entry in parallel
        const [aspectDetailResponse, entryResponse] = await Promise.all([
          dispatch(
            getAspectDetail({
              id_token,
              resource: aspectTypePath,
            })
          ).unwrap(),
          dispatch(
            fetchEntry({
              id_token,
              entryName: item.name,
            })
          ).unwrap(),
        ]);

        // Both calls succeeded — clear any stale access-denied flag for this aspect
        dispatch(clearAccessDeniedItemId());

        // Extract recordFields from the aspect detail response
        const recordFields = aspectDetailResponse?.metadataTemplate?.recordFields || [];
        const system = entryResponse?.entrySource?.system || '';
        const fullyQualifiedName = entryResponse?.fullyQualifiedName || '';
        const labels = entryResponse?.entrySource?.labels || {};

        // Apply configData whitelist: if browseByAspectTypes has a non-empty entry for this aspect,
        // show only those fields; otherwise fall back to the full Dataplex list
        const allowedFields: string[] | undefined = (browseByAspectTypes as Record<string, string[]>)?.[item.name];
        const filteredRecordFields =
          allowedFields && allowedFields.length > 0
            ? recordFields.filter((field: { name: string }) => allowedFields.includes(field.name))
            : recordFields;

        // Create initial subItems with loading state for counts
        // Check cache to avoid showing loader for already-fetched data
        const initialSubItems = filteredRecordFields.map((field: { name: string; annotations?: { displayName?: string; description?: string; stringType?: string }; type?: string }) => {
          const cacheKey = generateCacheKey(item.title, field.name);
          const cachedData = aspectBrowseCache[cacheKey];
          const hasCachedData = !!cachedData;

          // Update cache tracking if cached data exists
          if (hasCachedData) {
            setSubTypesWithCache(prev => ({ ...prev, [cacheKey]: true }));
          }

          return {
            title: field.name,
            fieldValues: hasCachedData ? cachedData.totalSize : 0,
            assets: hasCachedData ? cachedData.totalSize : 0,
            displayName: field.annotations?.displayName || field.name,
            description: field.annotations?.description || '',
            type: field.type || 'string',
            stringType: field.annotations?.stringType || '',
            isCountLoading: !hasCachedData, // Only show loading if not cached
            hasCachedData: hasCachedData,
          };
        });

        // Update state immediately with subtypes (Phase 1 complete)
        setDynamicAnnotationsData((prevData: any) =>
          prevData.map((annotation: any) =>
            annotation.name === item.name
              ? {
                  ...annotation,
                  subItems: initialSubItems,
                  subTypesLoaded: true, // Phase 1 complete
                  countsFetched: false,
                  createTime: aspectDetailResponse?.createTime,
                  updateTime: aspectDetailResponse?.updateTime,
                  description: aspectDetailResponse?.description || '',
                  system: system,
                  fullyQualifiedName: fullyQualifiedName,
                  labels: labels,
                }
              : annotation
          )
        );

        // Clear loading state for overview tab (only if still loading same aspect)
        setLoadingAspectName((prev) => (prev === item.name ? null : prev));

        // PHASE 2: Fetch asset counts AND linked assets for each sub-type in parallel
        // Create new AbortController for this fetch cycle
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        const countAndDataPromises = filteredRecordFields.map(async (field: any, index: number) => {
          try {
            // Check if data already in cache
            const cacheKey = generateCacheKey(item.title, field.name);
            const cachedData = aspectBrowseCache[cacheKey];

            if (cachedData) {
              // Use cached data
              const count = cachedData.totalSize;

              // Update state with cached count
              setDynamicAnnotationsData((prevData: any) =>
                prevData.map((annotation: any) => {
                  if (annotation.name !== item.name) return annotation;
                  const updatedSubItems = annotation.subItems.map((subItem: any, subIndex: number) =>
                    subIndex === index
                      ? { ...subItem, fieldValues: count, assets: count, isCountLoading: false, hasCachedData: true }
                      : subItem
                  );
                  return { ...annotation, subItems: updatedSubItems };
                })
              );

              // Update cache tracking
              setSubTypesWithCache(prev => ({ ...prev, [cacheKey]: true }));

              return { field: field.name, count, success: true, cached: true };
            }

            // Check if request was aborted
            if (signal.aborted) {
              return { field: field.name, count: 0, success: false, aborted: true };
            }

            // Fetch fresh data
            const result = await dispatch(
              browseResourcesByAspects({
                id_token,
                annotationName: item.title,
                subAnnotationName: field.name,
                signal, // Pass signal for cancellation
              })
            ).unwrap();

            // Note: We intentionally do NOT check signal.aborted here after fetch completes
            // If the API returned successfully, we should always update the state to clear isCountLoading
            // The abort check before fetch (line 214) prevents initiating new requests

            const count = result?.results?.totalSize ?? 0;
            const linkedAssets = result?.data ?? [];

            // Cache the data in Redux
            dispatch(setAspectBrowseCache({
              cacheKey,
              data: linkedAssets,
              totalSize: count
            }));

            // Update cache tracking
            setSubTypesWithCache(prev => ({ ...prev, [cacheKey]: true }));

            // Update individual subItem with count and cache flag
            setDynamicAnnotationsData((prevData: any) =>
              prevData.map((annotation: any) => {
                if (annotation.name !== item.name) return annotation;
                const updatedSubItems = annotation.subItems.map((subItem: any, subIndex: number) =>
                  subIndex === index
                    ? { ...subItem, fieldValues: count, assets: count, isCountLoading: false, hasCachedData: true }
                    : subItem
                );
                return { ...annotation, subItems: updatedSubItems };
              })
            );

            return { field: field.name, count, success: true, cached: false };
          } catch (error: any) {
            // Don't update state if request was aborted
            if (error.name === 'AbortError' || error.name === 'CanceledError' || signal.aborted || error?.aborted) {
              return { field: field.name, count: 0, success: false, aborted: true };
            }

            console.error(`Failed to fetch count for ${field.name}:`, error);

            // Update with error state (show 0)
            setDynamicAnnotationsData((prevData: any) =>
              prevData.map((annotation: any) => {
                if (annotation.name !== item.name) return annotation;
                const updatedSubItems = annotation.subItems.map((subItem: any, subIndex: number) =>
                  subIndex === index
                    ? { ...subItem, fieldValues: 0, assets: 0, isCountLoading: false, hasCachedData: false }
                    : subItem
                );
                return { ...annotation, subItems: updatedSubItems };
              })
            );

            return { field: field.name, count: 0, success: false };
          }
        });

        // Wait for all counts and data to complete
        await Promise.allSettled(countAndDataPromises);

        // Only mark as complete if not aborted
        if (!signal.aborted) {
          setDynamicAnnotationsData((prevData: any) =>
            prevData.map((annotation: any) =>
              annotation.name === item.name
                ? { ...annotation, countsFetched: true }
                : annotation
            )
          );
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error("Failed to fetch aspect details:", error);
        setLoadingAspectName(null);
        // Surface a 403 on either the aspect-type or entry fetch as an inline
        // "Permission Required" state instead of leaving the tab spinning forever
        // (mirrors Glossaries' accessDeniedItemId — no global no-access modal).
        if (error?.type === 'PERMISSION_DENIED') {
          dispatch(setAccessDeniedItemId(item.name));
        }
        setDynamicAnnotationsData((prevData: any) =>
          prevData.map((annotation: any) =>
            annotation.name === item.name
              ? {
                  ...annotation,
                  subItems: [],
                  subTypesLoaded: true,
                  countsFetched: true
                }
              : annotation
          )
        );
      }
    };

    if (selectedItem && !selectedSubItem) {
      fetchSubItemCounts(selectedItem);
    }

  }, [selectedItemName, selectedSubItem, dispatch, id_token]);

  // Cleanup only on unmount (not on selectedItem change)
  // Note: Abort on aspect change is handled in Phase 2
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []); // Empty array = only run on unmount

  useEffect(()=> {
    // Skip rebuild if data already exists (back navigation)
    if (dynamicAnnotationsData.length > 0) {
      setLoader(false);
      return;
    }
    // A deep-link login (?continue=/browse-by-annotation...) navigates straight back
    // here, bypassing Home.tsx — the only place that normally fetches APP_CONFIG into
    // user.appConfig. Without this, `aspects` stays undefined forever and the loader
    // above never resolves (mirrors the fix in dataProductsSlice.ts's getDataProductDetails).
    // Object.keys(...).length === 0 (not just `!aspects`) distinguishes "config never
    // loaded" from "config loaded but this org has zero aspects configured" — the latter
    // is a legitimate empty state, not something to refetch.
    if (!aspects && Object.keys(user?.appConfig || {}).length === 0 && user?.token && !appConfigFetchAttempted.current) {
      appConfigFetchAttempted.current = true;
      axios.get(URLS.API_URL + URLS.APP_CONFIG)
        .then((res) => {
          // Updates user.appConfig — aspects/browseByAspectTypes will change on the
          // next render, re-firing this effect via its dependency array below.
          updateUser(user.token, { ...user, appConfig: res.data });
        })
        .catch((err) => {
          console.error('Failed to fetch APP_CONFIG for deep-linked Browse by Annotation:', err);
          // Fall through to the existing "No Aspects" empty state rather than spinning
          // forever. Deliberately not logging the user out here — unlike Home.tsx, this
          // is a supplementary fetch on a page that isn't the primary auth gate.
          setDynamicAnnotationsData([]);
          setLoader(false);
        });
      return;
    }
    if(aspects){
      // Filter aspects by configured project scope when restriction is active
      const appConfig = user?.appConfig;
      const configuredProjectIds: string[] = appConfig?.configuredProjectIds || [];
      const scopedAspects = (appConfig?.projectsRestricted && configuredProjectIds.length > 0)
        ? aspects.filter((a: any) => {
            const projectNumber = extractProjectNumberFromEntryName(a.dataplexEntry?.name);
            const project = (projectsList as any[]).find(p => p.name === `projects/${projectNumber}`);
            return project && configuredProjectIds.includes(project.projectId);
          })
        : aspects;

      const fullAspectList = scopedAspects || [];
      const aspectList: Record<string, string[]> = browseByAspectTypes || {};
      const generatedData: any[] = [];

      if(!fullAspectList || fullAspectList.length === 0){
        console.log('No aspects available.');
        setDynamicAnnotationsData([]);
      }else{
        fullAspectList.forEach((aspectInfo: any) => {
          const aspectName = aspectInfo?.dataplexEntry?.name;
          // Resolve project display name from the projects list
          const projectNumber = extractProjectNumberFromEntryName(aspectName);
          const project = (projectsList as any[]).find(p => p.name === `projects/${projectNumber}`);
          const projectLabel = project?.displayName || project?.projectId || '';
          // Get subItems from config if available, otherwise empty array
          const configuredSubItems = aspectList?.[aspectName] || [];
          const subItems = configuredSubItems.map((f: string) => {
            return { title: f, fieldValues: 0, assets: 0 };
          });
          generatedData.push({
            title: aspectInfo?.dataplexEntry?.entrySource?.displayName ||
                   (aspectName ? aspectName.split('/').pop() : 'Unknown Aspect'),
            fieldValues: subItems.length || 0,
            assets: 0,
            name: aspectName,
            subItems: subItems,
            location: aspectInfo?.dataplexEntry?.entrySource?.location || '',
            resource: aspectInfo?.dataplexEntry?.entrySource?.resource || '',
            createTime: aspectInfo?.dataplexEntry?.createTime || null,
            projectLabel,
          });
        });
        setDynamicAnnotationsData(generatedData);
      }

      setLoader(false);
      
      // setBrowseByAspectType(annotationsData);

      // let q = `name=${n.join('|')}`;

      // axios.post(URLS.API_URL+ URLS.BATCH_ASPECTS, {
      //     entryNames: n
      //   },
      //   {
      //     headers: {
      //       Authorization: `Bearer ${id_token}`,
      //       'Content-Type': 'application/json',
      //     },
      //   }
      // ).then(response => {
      //   console.log('name options:', response.data);
      //   setaspectTypeEditOptions(response.data);//.map((aspect:any) => (aspect.entry.entrySource.displayName));
      //   setloading(false);
      // }).catch(error => {
      //   console.error('Error saving configuration:', error);
      // });

    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aspects, browseByAspectTypes]);

  // Patch projectLabel onto existing annotation items whenever projectsList loads/changes.
  // Handles the race where aspects build before /get-projects resolves.
  useEffect(() => {
    if (!projectsList?.length || !dynamicAnnotationsData.length) return;
    setDynamicAnnotationsData((prev: any[]) =>
      prev.map((item: any) => {
        const projectNumber = extractProjectNumberFromEntryName(item.name);
        const project = (projectsList as any[]).find(p => p.name === `projects/${projectNumber}`);
        const projectLabel = project?.displayName || project?.projectId || item.projectLabel || '';
        return { ...item, projectLabel };
      })
    );
  }, [projectsList]);

  // Auto-select first aspect on load (skip Browse page) — but not when a deep
  // link (?aspect=) is present; the bootstrap effect below will own selection then.
  useEffect(() => {
    if (dynamicAnnotationsData.length > 0 && !selectedItemName && !searchParams.get('aspect')) {
      const firstAspectName = dynamicAnnotationsData[0]?.name || null;
      setSelectedItemName(firstAspectName);
      // Keep the URL in sync with the auto-selected aspect too (mirrors handleItemClick) —
      // otherwise the address bar stays bare while the page shows the first aspect.
      updateUrlForSelection(firstAspectName, null, 0);
    }
  }, [dynamicAnnotationsData, selectedItemName]); // eslint-disable-line react-hooks/exhaustive-deps

  const resolveTabName = (index: number): string => (index === 1 ? 'sub-types' : 'overview');
  const resolveTabIndex = (name: string | null): number => (name === 'sub-types' ? 1 : 0);

  // Keep the URL in sync with the current selection so it's always copy/reload-able
  // (mirrors Glossaries.tsx navigating on every selection/tab change).
  const updateUrlForSelection = useCallback((aspectName: string | null, subTypeTitle: string | null, tab: number) => {
    if (!aspectName) return;
    let url = `/browse-by-annotation?aspect=${encodeURIComponent(btoa(aspectName))}`;
    if (subTypeTitle) {
      url += `&subType=${encodeURIComponent(btoa(subTypeTitle))}`;
    } else {
      url += `&tab=${resolveTabName(tab)}`;
    }
    navigate(url, { replace: true });
  }, [navigate]);

  const handleItemClick = (item:any) => {
    setSelectedItemName(item?.name || null);  // Store only the name
    setSelectedSubItem(null);  // Clear sub-item when selecting a new aspect
    setTabValue(0);  // Reset to Overview tab
    updateUrlForSelection(item?.name || null, null, 0);
  };
  const handleSubItemClick = (subItem:any) => {
    setSelectedSubItem(subItem);
    updateUrlForSelection(selectedItemName, subItem?.title || null, tabValue);
  };
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    updateUrlForSelection(selectedItemName, null, newValue);
  };

  // Bootstrap from URL ?aspect= param (deep-link / page reload).
  // Waits for auth + the admin-configured aspect list before resolving, and is
  // guarded by a ref so it fires exactly once even if deps re-fire.
  useEffect(() => {
    const aspectParam = searchParams.get('aspect');
    if (!aspectParam || aspectParamHandled.current || !id_token || dynamicAnnotationsData.length === 0) return;
    aspectParamHandled.current = true;
    try {
      const decodedAspect = atob(aspectParam);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const target = dynamicAnnotationsData.find((a: any) => a.name === decodedAspect);
      if (!target) return; // unknown/stale id — fall through to default first-item select

      // Select the aspect directly (not via handleItemClick) so we don't clear a
      // pending ?subType= param or rewrite the URL before the sub-type bootstrap
      // effect below gets a chance to read it once this aspect's sub-items load.
      setSelectedItemName(target.name);

      const subTypeParam = searchParams.get('subType');
      if (!subTypeParam) {
        setSelectedSubItem(null);
        const tabParam = searchParams.get('tab');
        setTabValue(resolveTabIndex(tabParam));
      }
      // else: leave selectedSubItem/tab/URL untouched — the sub-type bootstrap
      // effect resolves it once this aspect's subItems have loaded.
    } catch {
      // malformed base64 — ignore, fall through to default first-item selection
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id_token, dynamicAnnotationsData]);

  // Resolve a pending ?subType= param once the target aspect's sub-items have
  // loaded (they aren't available until fetchSubItemCounts' Phase 1 completes).
  useEffect(() => {
    const subTypeParam = searchParams.get('subType');
    if (!subTypeParam || subTypeParamHandled.current || !selectedItem?.subTypesLoaded) return;
    subTypeParamHandled.current = true;
    try {
      const decodedSubType = atob(subTypeParam);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const target = selectedItem.subItems?.find((s: any) => s.title === decodedSubType);
      if (target) handleSubItemClick(target);
    } catch {
      // malformed base64 — ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItem?.subTypesLoaded]);
  const handleSortOrderToggle = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  return !loader ? (
    dynamicAnnotationsData.length > 0 ? (
      <Box sx={{
        display: 'flex',
        alignItems: 'flex-start',
        px: 0,
        pb: 0,
        pt: 0,
        backgroundColor: '#f8fafc',
        height: 'calc(100vh - 72px)',
        width: '100%',
        overflow: 'hidden',
      }}>
        {/* Side Navigation - Fixed Position */}
        <SideNav
          selectedItem={selectedItem}
          onItemClick={handleItemClick}
          selectedSubItem={selectedSubItem}
          onSubItemClick={handleSubItemClick}
          annotationsData={filteredAnnotationsData}
          loadingAspectName={loadingAspectName}
          filters={aspectFilters}
          onFiltersChange={setAspectFilters}
          isOpen={isSidebarOpen}
        />
        {/* Main Content - Shifted right to account for fixed sidebar */}
        <Box sx={{ marginLeft: isSidebarOpen ? '252px' : '0px', width: isSidebarOpen ? 'calc(100% - 252px)' : '100%', height: '100%', overflow: 'hidden', transition: 'margin-left 0.3s ease-in-out, width 0.3s ease-in-out' }}>
        <MainComponent
          selectedCard={selectedItem}
          onItemClick={handleItemClick}
          selectedSubItem={selectedSubItem}
          onSubItemClick={handleSubItemClick}
          annotationsData={filteredAnnotationsData}
          tabValue={tabValue}
          onTabChange={handleTabChange}
          contentSearchTerm={contentSearchTerm}
          onContentSearchTermChange={setContentSearchTerm}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          sortOrder={sortOrder}
          onSortOrderToggle={handleSortOrderToggle}
          loadingAspectName={loadingAspectName}
          subTypesWithCache={subTypesWithCache}
          isSidebarOpen={isSidebarOpen}
          onSidebarToggle={(open: boolean) => dispatch(setSideNavOpen(open))}
          isSmallScreen={isSmallScreen}
          accessDeniedItemId={accessDeniedItemId}
        />
        </Box>
      </Box>
    ) : (<Box sx={{ display: 'flex', height: '85vh', width: '100%', backgroundColor: '#F8FAFD', justifyContent: 'center', alignContent: 'center', alignItems: 'center' }}>
          <Typography 
            sx={{ 
              margin: 'auto',
              fontSize: '16px',
              fontWeight: 500,
              color: '#0C1226CC',
              fontFamily: '"Google Sans Text", sans-serif' 
          }}>
            No Aspects for browse by experience available
          </Typography>
        </Box>
    )
  ):(<Box sx={{ display: 'flex', height: '100vh', width: '100%', backgroundColor: '#F8FAFD' }}>
      <CircularProgress sx={{ margin: 'auto' }} />
    </Box>
  );
};

export default BrowseByAnnotation;
