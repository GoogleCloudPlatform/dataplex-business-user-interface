import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  List,
  Tabs,
  Tab,
  Button,
} from "@mui/material";
import NothingImage from "../../assets/images/nothing-image.png";

import { ArrowBack } from "@mui/icons-material";
import { type GlossaryItem, type FilterChip } from "./GlossaryDataType";
import PreviewAnnotation from "../Annotation/PreviewAnnotation";
import AnnotationFilter from "../Annotation/AnnotationFilter";
import ResourcePreview from "../Common/ResourcePreview";
import { hasValidAnnotationData } from "../../utils/resourceUtils";
import { useDispatch, useSelector } from "react-redux";
import { type AppDispatch } from "../../app/store";
import {
  fetchGlossaries,
  fetchGlossaryChildren,
  fetchTermRelationships,
  fetchGlossaryEntryDetails,
  filterGlossaries,
  setActiveFilters,
  clearFilters,
} from "../../features/glossaries/glossariesSlice";
import { getProjects } from "../../features/projects/projectsSlice";
import { useAuth } from "../../auth/AuthProvider";
import ShimmerLoader from "../Shimmer/ShimmerLoader";
import {
  extractGlossaryId,
  normalizeId,
  getAllAncestorIds,
  findItem,
  getBreadcrumbs,
  collectAllIds,
  collectAncestorIdsOfMatches,
} from "../../utils/glossaryUtils";
import { getIcon } from "./glossaryUIHelpers";
import SidebarItem from "./SidebarItem";
import GlossariesCategoriesTerms from "./GlossariesCategoriesTerms";
import GlossariesSynonyms from "./GlossariesSynonyms";
import GlossariesLinkedAssets from "./GlossariesLinkedAssets";
import GlossaryFilterInput from "./GlossaryFilterInput";
import DetailPageOverview from "../DetailPageOverview/DetailPageOverview";
import DetailPageOverviewSkeleton from "../DetailPageOverview/DetailPageOverviewSkeleton";
import GlossariesCategoriesTermsSkeleton from "./GlossariesCategoriesTermsSkeleton";
import GlossariesSynonymsSkeleton from "./GlossariesSynonymsSkeleton";

/**
 * Transforms a GlossaryItem into the entry format expected by DetailPageOverview.
 * Maps glossary-specific fields to the standard entry structure.
 */
const transformGlossaryToEntry = (item: GlossaryItem) => {
  // Build labels object from array (e.g., ["key:value"] -> { key: "value" })
  const labelsObject = (item.labels || []).reduce((acc, label) => {
    const [key, ...valueParts] = label.split(':');
    const value = valueParts.join(':');
    if (key && value) acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  // Build contacts array in the format expected by DetailPageOverview
  const contactsArray = (item.contacts || []).map(contact => ({
    structValue: {
      fields: {
        name: { stringValue: contact, kind: 'stringValue' },
        role: { stringValue: 'Contact', kind: 'stringValue' }
      }
    }
  }));

  return {
    name: item.id,
    entryType: `glossary/${item.type}`,
    fullyQualifiedName: item.id,
    createTime: null,
    updateTime: item.lastModified ? { seconds: item.lastModified } : null,
    entrySource: {
      description: item.description || '',
      system: item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : '',
      location: item.location || '-',
      resource: item.id,
      displayName: item.displayName,
      labels: labelsObject
    },
    aspects: {
      [`${item.type}.global.overview`]: {
        data: {
          fields: {
            content: {
              stringValue: item.longDescription || 'No Documentation Available',
              kind: 'stringValue'
            }
          }
        }
      },
      [`${item.type}.global.contacts`]: {
        data: {
          fields: {
            identities: {
              listValue: {
                values: contactsArray
              }
            }
          }
        }
      }
    }
  };
};

/**
 * @file Glossaries.tsx
 * @description
 * This component renders the main interface for the Business Glossary module,
 * utilizing a split-pane layout to manage and view hierarchical business data.
 *
 * It is a smart container deeply integrated with the Redux `glossaries` and `projects`
 * slices to handle asynchronous data fetching, caching, and state management.
 *
 * Key functionalities include:
 * 1.  Hierarchical Sidebar: Displays a searchable, recursive tree structure
 * (Glossary -> Category -> Term). It handles lazy loading of children nodes
 * upon expansion to optimize performance.
 * 2.  Polymorphic Detail View: The main content area adapts based on the
 * selected item type (Glossary, Category, or Term), rendering specific tabs
 * such as Overview, Categories, Terms, Linked Assets, Synonyms, and Aspects.
 * 3.  Linked Asset Management: For 'Term' items, it integrates the
 * `ResourceViewer` and `ResourcePreview` components to display and filter
 * associated data assets from the catalog.
 * 4.  Search & Filtering: Implements local filtering for content lists
 * (Categories/Terms) and specific relationship filtering (Synonyms/Related),
 * along with global search capabilities within the sidebar.
 * 5.  Navigation Handling: Manages breadcrumb navigation, automatic tree
 * expansion based on selection, and deep-linking logic via URL or internal IDs.
 *
 * @returns {React.ReactElement} A React element rendering the complete Business
 * Glossaries page layout including the sidebar, main content tabs, and asset preview panels.
 */

const Glossaries = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();

  const {
    glossaryItems,
    status,
    filteredTreeItems,
    filterStatus,
    activeFilters,
    accessDeniedItemId,
  } = useSelector((state: any) => state.glossaries);
  const projectsLoaded = useSelector((state: any) => state.projects.isloaded);

  const [selectedId, setSelectedId] = useState<string>("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [tabValue, setTabValue] = useState(0);
  const [contentSearchTerm, setContentSearchTerm] = useState("");
  const [relationFilter, setRelationFilter] = useState<
    "all" | "synonym" | "related"
  >("all");
  const [filteredAnnotationEntry, setFilteredAnnotationEntry] =
    useState<any>(null);
  const [expandedAnnotations, setExpandedAnnotations] = useState<Set<string>>(
    new Set()
  );
  const [assetPreviewData, setAssetPreviewData] = useState<any | null>(null);
  const [isAssetPreviewOpen, setIsAssetPreviewOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [sortBy, setSortBy] = useState<"name" | "lastModified">("lastModified");
  const fetchedParentIds = React.useRef(new Set<string>());
  const manualSelectionId = React.useRef<string | null>(null);
  const wasSearching = React.useRef(false);
  const initialFilterExpansionSet = React.useRef(false);
  const [isSidebarLoading, setIsSidebarLoading] = useState(false);
  const [isContentLoading, setIsContentLoading] = useState(false);

  // Use filtered tree when filters are active, otherwise use all glossary items
  const displayGlossaries = useMemo(() => {
    if (activeFilters.length > 0) {
      return filteredTreeItems; // Return filtered items (empty or not) when filters are active
    }
    return glossaryItems;
  }, [activeFilters, filteredTreeItems, glossaryItems]);

  useEffect(() => {
    if (!projectsLoaded && user?.token) {
      dispatch(getProjects({ id_token: user?.token }));
    }
  }, [dispatch, projectsLoaded, user?.token]);

  useEffect(() => {
    if (glossaryItems.length === 0 && status === "idle" && user?.token) {
      dispatch(fetchGlossaries({ id_token: user?.token }));
    }
  }, [dispatch, glossaryItems.length, status, user?.token]);

  useEffect(() => {
    if (displayGlossaries.length > 0 && !selectedId) {
      setSelectedId(displayGlossaries[0].id);
    }
  }, [displayGlossaries, selectedId]);

  useEffect(() => {
    if (glossaryItems.length > 0 && !selectedId) {
      const firstId = glossaryItems[0].id;
      setSelectedId(firstId);
      // Also fetch details for the first item immediately
      setIsContentLoading(true);
      dispatch(fetchGlossaryEntryDetails({ entryName: firstId, id_token: user?.token }))
        .unwrap()
        .finally(() => setIsContentLoading(false));
    }
  }, [glossaryItems, selectedId, dispatch, user?.token]);

  // Clear filters when navigating away from Glossaries
  useEffect(() => {
    return () => {
      dispatch(clearFilters());
    };
  }, [dispatch]);

  // --- Sort Handlers ---
  const handleSortDirectionToggle = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const sortItems = (items: any[]) => {
    return [...items].sort((a, b) => {
      if (sortBy === "name") {
        const nameA = a.displayName.toLowerCase();
        const nameB = b.displayName.toLowerCase();
        if (sortOrder === "asc") return nameA.localeCompare(nameB);
        return nameB.localeCompare(nameA);
      } else {
        // Last Modified (Number)
        const dateA = a.lastModified || 0;
        const dateB = b.lastModified || 0;
        if (sortOrder === "asc") return dateA - dateB; // Oldest first
        return dateB - dateA; // Newest first
      }
    });
  };

  // filteredGlossaries is now the same as displayGlossaries since server-side filtering is used
  const filteredGlossaries = displayGlossaries;

  const getAllTerms = (node: GlossaryItem): GlossaryItem[] => {
    let allTerms: GlossaryItem[] = [];
    if (node.children) {
      node.children.forEach((child) => {
        if (child.type === "term") {
          allTerms.push(child);
        }
        allTerms = [...allTerms, ...getAllTerms(child)];
      });
    }
    return allTerms;
  };

  const selectedItem = useMemo(() => {
    if (!selectedId) return null;
    return findItem(glossaryItems, selectedId);
  }, [selectedId, glossaryItems]);

  const breadcrumbs = useMemo(() => {
    if (!selectedId) return [];
    return getBreadcrumbs(glossaryItems, selectedId) || []; // Use glossaryItems
  }, [selectedId, glossaryItems]);

  const categories =
    selectedItem?.children?.filter((c) => c.type === "category") || [];
  const terms = useMemo(
    () => (selectedItem ? getAllTerms(selectedItem) : []),
    [selectedItem]
  );
  const relations = useMemo(
    () => selectedItem?.relations || [],
    [selectedItem]
  );
  const isTerm = selectedItem?.type === "term";

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setContentSearchTerm("");
  };

  const handleToggle = (id: string) => {
    const newExpanded = new Set(expandedIds);
    const item = findItem(displayGlossaries, id);

    if (!newExpanded.has(id)) {
      // Opening logic
      const isRootGlossary = glossaryItems.some(
        (g: GlossaryItem) => g.id === id
      );

      if (isRootGlossary && activeFilters.length === 0) {
        // Collapse all other root glossaries
        glossaryItems.forEach((g: GlossaryItem) => {
          if (g.id !== id && newExpanded.has(g.id)) {
            newExpanded.delete(g.id);
          }
        });
      }

      // If expanding and no children, fetch them
      if (item && (!item.children || item.children.length === 0)) {
        dispatch(
          fetchGlossaryChildren({
            parentId: id,
            id_token: user?.token,
          })
        );
      }
      newExpanded.add(id);
    } else {
      // Closing logic
      newExpanded.delete(id);

      if (item && item.children) {
        const descendantIds = collectAllIds(item.children);
        descendantIds.forEach((childId) => newExpanded.delete(childId));
      }
    }
    setExpandedIds(newExpanded);
  };

  const handleNavigate = async (rawTargetId: string) => {
    // 0. Normalize ID to ensure it matches the Sidebar Tree format (Resource Name)
    const targetId = normalizeId(rawTargetId);

    // 1. Try to find the item in the current tree
    const targetItem = findItem(displayGlossaries, targetId);

    // 2. If not found, it might be in a collapsed glossary we haven't fetched yet
    if (!targetItem) {
      const parentGlossaryId = extractGlossaryId(targetId);

      if (parentGlossaryId) {
        setIsSidebarLoading(true);
        try {
          // Fetch the children of the parent glossary
          await dispatch(
            fetchGlossaryChildren({
              parentId: parentGlossaryId,
              id_token: user?.token,
            })
          ).unwrap();

          const newExpanded = new Set(expandedIds);
          newExpanded.add(parentGlossaryId);
          setExpandedIds(newExpanded);
        } catch (error) {
          console.error("Failed to load parent glossary children", error);
        } finally {
          setIsSidebarLoading(false);
        }
      }
    }

    // 3. Proceed with standard navigation logic
    setSelectedId(targetId);
    setTabValue(0);
    setContentSearchTerm("");

    setIsContentLoading(true);

    // Fetch entry details
    dispatch(
      fetchGlossaryEntryDetails({
        entryName: targetId,
        id_token: user?.token,
      })
    )
      .unwrap()
      .catch((err) => {
        console.warn(
          "Failed to fetch details for navigation target",
          targetId,
          err
        );
      })
      .finally(() => {
        setIsContentLoading(false);
      });

    // If it's a TERM, fetch relationships
    if (targetId.includes("/terms/")) {
      dispatch(
        fetchTermRelationships({
          termId: targetId,
          id_token: user?.token,
        })
      );
    }
  };


  useEffect(() => {
    if (glossaryItems.length > 0 && user?.token) {
      glossaryItems.forEach((item: GlossaryItem, index: number) => {
        // Only target top-level Glossaries
        if (item.type === "glossary") {
          // Check if we haven't fetched this one yet
          if (!fetchedParentIds.current.has(item.id)) {
            // Mark as fetched immediately to prevent re-entry
            fetchedParentIds.current.add(item.id);

            // If children are empty, fetch them
            if (!item.children || item.children.length === 0) {
              // Only trigger loading state for the first item to control sidebar shimmer
              if (index === 0) setIsSidebarLoading(true);

              dispatch(
                fetchGlossaryChildren({
                  parentId: item.id,
                  id_token: user?.token,
                })
              )
                .unwrap() // Unwrap allows us to chain .finally/then on the thunk result
                .finally(() => {
                  if (index === 0) setIsSidebarLoading(false);
                });
            }
          }
        }
      });
    }
  }, [glossaryItems, dispatch, user?.token]);

  // --- Filter & Sort ---
  const filteredCategories = useMemo(() => {
    const filtered = categories.filter((c) =>
      c.displayName.toLowerCase().includes(contentSearchTerm.toLowerCase())
    );
    return sortItems(filtered);
  }, [categories, contentSearchTerm, sortOrder]);

  const filteredTerms = useMemo(() => {
    const filtered = terms.filter((t) =>
      t.displayName.toLowerCase().includes(contentSearchTerm.toLowerCase())
    );
    return sortItems(filtered);
  }, [terms, contentSearchTerm, sortOrder]);

  const hasVisibleAspects = useMemo(() => {
    const aspects = selectedItem?.aspects;
    if (!aspects) return false;

    return Object.keys(aspects).some((key) => {
      const isSchema = key.endsWith(".global.schema");
      const isOverview = key.endsWith(".global.overview");
      const isContacts = key.endsWith(".global.contacts");
      const isUsage = key.endsWith(".global.usage");
      const isGlossaryTermAspect = key.endsWith(".global.glossary-term-aspect");

      if (
        isSchema ||
        isOverview ||
        isContacts ||
        isUsage ||
        isGlossaryTermAspect
      ) {
        return false;
      }

      return hasValidAnnotationData(aspects[key]);
    });
  }, [selectedItem]);

  const handleAnnotationCollapseAll = () => {
    setExpandedAnnotations(new Set());
  };

  const handleAnnotationExpandAll = () => {
    const aspects = selectedItem?.aspects;

    if (aspects) {
      const annotationKeys = Object.keys(aspects).filter((key) => {
        const isSchema = key.endsWith(".global.schema");
        const isOverview = key.endsWith(".global.overview");
        const isContacts = key.endsWith(".global.contacts");
        const isUsage = key.endsWith(".global.usage");
        const isGlossaryTermAspect = key.endsWith(
          ".global.glossary-term-aspect"
        );

        if (
          isSchema ||
          isOverview ||
          isContacts ||
          isUsage ||
          isGlossaryTermAspect
        ) {
          return false;
        }

        return hasValidAnnotationData(aspects[key]);
      });

      setExpandedAnnotations(new Set(annotationKeys));
    }
  };

  useEffect(() => {
    setAssetPreviewData(null);
    setIsAssetPreviewOpen(false);
  }, [selectedId]);

  // Expand only ancestors of matched items when filters are active (not the matched items themselves)
  useEffect(() => {
    if (activeFilters.length > 0) {
      wasSearching.current = true;
      // Only set initial expansion when filters are first applied, not on every filteredGlossaries change
      if (!initialFilterExpansionSet.current && filteredGlossaries.length > 0) {
        const ancestorIds = collectAncestorIdsOfMatches(filteredGlossaries);
        setExpandedIds(new Set(ancestorIds));
        initialFilterExpansionSet.current = true;
      }
    } else if (wasSearching.current) {
      // Filters were just cleared - collapse all except path to selected item
      wasSearching.current = false;
      initialFilterExpansionSet.current = false; // Reset for next filter session
      if (selectedId) {
        const ancestors = getAllAncestorIds(glossaryItems, selectedId);
        const newExpanded = new Set(ancestors);
        const currentItem = findItem(glossaryItems, selectedId);
        if (currentItem && (currentItem.type === "glossary" || currentItem.type === "category")) {
          newExpanded.add(selectedId);
        }
        setExpandedIds(newExpanded);
      } else {
        setExpandedIds(new Set());
      }
    }
  }, [activeFilters, filteredGlossaries, selectedId, glossaryItems]);

  useEffect(() => {
    if (activeFilters.length === 0 && selectedId) {
      if (manualSelectionId.current === selectedId && !wasSearching.current) {
        return;
      }

      wasSearching.current = false;
      const ancestors = getAllAncestorIds(glossaryItems, selectedId);
      const newExpanded = new Set(ancestors);

      const currentItem = findItem(glossaryItems, selectedId);
      if (
        currentItem &&
        (currentItem.type === "glossary" || currentItem.type === "category")
      ) {
        newExpanded.add(selectedId);
      }
      setExpandedIds(newExpanded);
    }
  }, [selectedId, glossaryItems, activeFilters]);

  const shouldShowSidebarShimmer =
    status === "loading" ||
    isSidebarLoading ||
    filterStatus === "loading" ||
    (glossaryItems.length > 0 &&
      glossaryItems[0].type === "glossary" &&
      (!glossaryItems[0].children || glossaryItems[0].children.length === 0) &&
      !fetchedParentIds.current.has(glossaryItems[0].id));

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        px: 0,
        pb: 2,
        pt: 0,
        backgroundColor: "#F8FAFD",
        height: "calc(100vh - 64px)",
        width: "100%",
        overflow: "hidden",
      }}
    >
      {/* SIDEBAR CARD */}
      <Paper
        elevation={0}
        sx={{
          width: "18%",
          minWidth: "240px",
          height: "calc(100vh - 80px)",
          borderRadius: "24px",
          backgroundColor: "#fff",
          border: "transparent",
          mr: "2%",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          overflow: "hidden",
          py: "20px",
          gap: "8px",
        }}
      >
        <Box sx={{ mb: 1 }}>
          <Typography
            variant="h6"
            sx={{
              fontFamily: "Google Sans Text",
              fontSize: "16px",
              fontWeight: 500,
              lineHeight: "24px",
              color: "#000000",
              mb: 2,
              px: 2.5,
            }}
          >
            Business Glossaries
          </Typography>
          <GlossaryFilterInput
            filters={activeFilters}
            onFiltersChange={(newFilters: FilterChip[]) => {
              dispatch(setActiveFilters(newFilters));
              if (newFilters.length > 0 && user?.token) {
                dispatch(
                  filterGlossaries({
                    filters: newFilters,
                    id_token: user.token,
                  })
                );
              } else {
                dispatch(clearFilters());
              }
            }}
            isLoading={filterStatus === "loading"}
            placeholder="Filter Glossaries"
          />
        </Box>
        <List sx={{ overflowY: "auto", flex: 1, pt: 0, px: 0 }}>
          {shouldShowSidebarShimmer ? (
            <Box sx={{ px: 2, pt: 1 }}>
              <ShimmerLoader count={6} type="simple-list" />
            </Box>
          ) : (
            <>
              {filteredGlossaries.map((item: GlossaryItem) => (
                <SidebarItem
                  key={item.id}
                  item={item}
                  selectedId={selectedId}
                  expandedIds={expandedIds}
                  onSelect={(id) => {
                    manualSelectionId.current = id;
                    handleNavigate(id);
                    handleToggle(id);
                  }}
                  onToggle={handleToggle}
                />
              ))}
              {filteredGlossaries.length === 0 && (
                <Box sx={{ p: 3, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    No results found
                  </Typography>
                </Box>
              )}
            </>
          )}
        </List>
      </Paper>

      {/* MAIN CONTENT CARD */}
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          height: "calc(100vh - 80px)",
          borderRadius: "24px",
          backgroundColor: "#fff",
          border: "transparent",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* HEADER SECTION */}
        <Box
          sx={{
            height: "102px",
            borderBottom: "1px solid #DADCE0",
            position: "relative",
            flexShrink: 0,
          }}
        >
          {/* Breadcrumbs/Title Row */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              position: "absolute",
              top: "20px",
              left: "20px",
            }}
          >
            {status === "loading" && !selectedItem ? (
              // Title Shimmer: Used only on initial load when title is unknown
              <Box sx={{ width: "300px" }}>
                <ShimmerLoader count={1} type="header" />
              </Box>
            ) : (
              <>
                {breadcrumbs.length > 1 && (
                  <Button
                    sx={{ minWidth: "auto", p: 0.5, mr: 0.5, color: "#5f6368" }}
                    onClick={() => {
                      setSelectedId(breadcrumbs[breadcrumbs.length - 2].id);
                      setTabValue(0);
                    }}
                  >
                    <ArrowBack fontSize="small" />
                  </Button>
                )}
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {getIcon(selectedItem?.type || "term", "medium")}
                </Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontFamily: '"Google Sans", sans-serif',
                    fontWeight: 500,
                    fontSize: "18px",
                    lineHeight: "24px",
                    color: "#1F1F1F",
                  }}
                >
                  {selectedItem?.displayName}
                </Typography>
              </>
            )}
          </Box>

          {/* Tabs */}
          {(status === "loading" && !selectedItem) ||
          isContentLoading ||
          (selectedItem && !selectedItem.aspects) ||
          (selectedItem?.type === "term" && !selectedItem.relations) ? (
            // Tabs Shimmer: Horizontal row of placeholders to prevent layout jump
            <Box
              sx={{
                position: "absolute",
                bottom: "8px",
                left: "20px",
                display: "flex",
                gap: "40px",
              }}
            >
              <Box sx={{ width: "100px" }}>
                <ShimmerLoader count={1} type="title" />
              </Box>
            </Box>
          ) : (
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons={false}
              sx={{
                position: "absolute",
                bottom: 0,
                left: "20px",
                right: "20px",
                minHeight: "44px",
                height: "44px",
                "& .MuiTabs-scrollableX": {
                  overflowX: "auto",
                  "::-webkit-scrollbar": { display: "none" },
                },
                "& .MuiTabs-indicator": {
                  backgroundColor: "#0E4DCA",
                  height: "3px",
                  borderTopLeftRadius: "2.5px",
                  borderTopRightRadius: "2.5px",
                  bottom: 0,
                },
                "& .MuiTabs-flexContainer": {
                  gap: "40px",
                },
              }}
            >
              {[
                { label: "Overview", hide: false },
                // Show Categories for Glossary & Category types
                { label: "Categories", hide: isTerm },
                // Show Terms for Glossary & Category types
                { label: "Terms", hide: isTerm },
                // Show Linked Assets only for Terms
                { label: "Linked Assets", hide: !isTerm },
                // Show Synonyms only for Terms
                { label: "Synonyms & Related Terms", hide: !isTerm },
                // Show Aspects only for Terms
                { label: "Aspects", hide: !isTerm },
              ].map((tab, index) => {
                if (tab.hide) return null;
                return (
                  <Tab
                    key={index}
                    value={index}
                    label={tab.label}
                    disableRipple
                    sx={{
                      textTransform: "none",
                      fontFamily: '"Google Sans Text", sans-serif',
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      lineHeight: "20px",
                      minWidth: "auto",
                      padding: "8px 0 0 0",
                      color: "#575757",
                      "&.Mui-selected": { color: "#0E4DCA" },
                      "&.Mui-disabled": { color: "#BDBDBD" },
                      alignItems: "flex-start",
                      justifyContent: "flex-start",
                    }}
                  />
                );
              })}
            </Tabs>
          )}
        </Box>

        {/* CONTENT BODY */}
        {(status === "loading" && !selectedItem) ? (
          <Box
            sx={{
              p: "20px",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}
          >
            <DetailPageOverviewSkeleton />
          </Box>
        ) : selectedItem ? (
          <Box sx={{ p: "20px", overflowY: "hidden", flex: 1 }}>
            {tabValue === 0 && (
              isContentLoading ? (
                <DetailPageOverviewSkeleton />
              ) : (
                <Box
                  sx={{
                    height: "100%",
                    overflowY: "auto",
                    minHeight: 0,
                  }}
                >
                  <DetailPageOverview
                    entry={transformGlossaryToEntry(selectedItem)}
                    css={{ width: "100%" }}
                    accessDenied={accessDeniedItemId === selectedId}
                  />
                </Box>
              )
            )}

            {!isTerm && tabValue === 1 && (
              isContentLoading ? (
                <GlossariesCategoriesTermsSkeleton />
              ) : (
                <GlossariesCategoriesTerms
                  mode="categories"
                  items={filteredCategories}
                  searchTerm={contentSearchTerm}
                  onSearchTermChange={setContentSearchTerm}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSortByChange={setSortBy}
                  onSortOrderToggle={handleSortDirectionToggle}
                  onItemClick={handleNavigate}
                />
              )
            )}

            {!isTerm && tabValue === 2 && (
              isContentLoading ? (
                <GlossariesCategoriesTermsSkeleton />
              ) : (
                <GlossariesCategoriesTerms
                  mode="terms"
                  items={filteredTerms}
                  searchTerm={contentSearchTerm}
                  onSearchTermChange={setContentSearchTerm}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSortByChange={setSortBy}
                  onSortOrderToggle={handleSortDirectionToggle}
                  onItemClick={handleNavigate}
                />
              )
            )}
            {/* TAB 3: LINKED ASSETS */}
            {isTerm && tabValue === 3 && (
              <GlossariesLinkedAssets
                linkedAssets={selectedItem.linkedAssets || []}
                searchTerm={contentSearchTerm}
                onSearchTermChange={setContentSearchTerm}
                idToken={user?.token || ""}
                onAssetPreviewChange={(data) => {
                  setAssetPreviewData(data);
                  setIsAssetPreviewOpen(!!data);
                }}
              />
            )}
            {isTerm && tabValue === 4 && (
              isContentLoading ? (
                <GlossariesSynonymsSkeleton />
              ) : (
                <GlossariesSynonyms
                  relations={relations}
                  searchTerm={contentSearchTerm}
                  onSearchTermChange={setContentSearchTerm}
                  relationFilter={relationFilter}
                  onRelationFilterChange={setRelationFilter}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSortByChange={setSortBy}
                  onSortOrderToggle={handleSortDirectionToggle}
                  onItemClick={handleNavigate}
                />
              )
            )}
            {/* TAB 5: ASPECTS */}
            {isTerm && tabValue === 5 && (
              <Box sx={{ height: "100%" }}>
                {hasVisibleAspects ? (
                  <Box
                    sx={{
                      border: "1px solid #e0e0e0",
                      borderRadius: "8px",
                      background: "#ffffff",
                      overflow: "hidden",
                      maxHeight: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    {/* Aspect Filter Component */}
                    <Box
                      sx={{
                        flexShrink: 0,
                        "& > div": {
                          marginTop: "0px !important",
                          border: "none",
                        },
                      }}
                    >
                      <AnnotationFilter
                        entry={selectedItem}
                        onFilteredEntryChange={setFilteredAnnotationEntry}
                        onCollapseAll={handleAnnotationCollapseAll}
                        onExpandAll={handleAnnotationExpandAll}
                      />
                    </Box>

                    {/* Aspect List Component */}
                    <Box sx={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
                      <PreviewAnnotation
                        entry={filteredAnnotationEntry || selectedItem}
                        css={{
                          border: "none",
                          margin: 0,
                          background: "transparent",
                          borderRadius: "0px",
                          borderTop: "1px solid #E0E0E0",
                          height: "auto",
                          overflow: "visible",
                        }}
                        expandedItems={expandedAnnotations}
                        setExpandedItems={setExpandedAnnotations}
                      />
                    </Box>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                      opacity: 1,
                      gap: 2,
                    }}
                  >
                    <Typography variant="body1" color="text.secondary">
                      No aspects available for this term
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        ) : (
          <Box sx={{ p: 5, textAlign: "center", opacity: 1 }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <img
                src={NothingImage}
                alt="Select an item"
                style={{ width: "200px", marginBottom: "16px" }}
              />
            </Box>
          </Box>
        )}
      </Paper>
      {/* 3. RESOURCE PREVIEW CARD */}
      {isTerm && tabValue === 3 && (
        <Paper
          elevation={0}
          sx={{
            width: isAssetPreviewOpen ? "clamp(300px, 22vw, 360px)" : "0px",
            minWidth: isAssetPreviewOpen ? "clamp(300px, 22vw, 360px)" : "0px",

            height: "calc(100vh - 80px)",
            borderRadius: "24px",
            backgroundColor: "#fff",
            border: "transparent",
            display: "flex",
            flexDirection: "column",
            overflow: "visible",
            flexShrink: 0,
            transition:
              "width 0.3s ease-in-out, min-width 0.3s ease-in-out, opacity 0.3s ease-in-out, margin-left 0.3s ease-in-out",
            marginLeft: isAssetPreviewOpen ? "2%" : 0,
            opacity: isAssetPreviewOpen ? 1 : 0,
            borderWidth: isAssetPreviewOpen ? undefined : 0,
          }}
        >
          <ResourcePreview
            previewData={assetPreviewData}
            onPreviewDataChange={(data) => {
              if (data) {
                setAssetPreviewData(data);
                setIsAssetPreviewOpen(true);
              } else {
                setIsAssetPreviewOpen(false);
              }
            }}
            id_token={user?.token || ""}
            isGlossary={true}
          />
        </Paper>
      )}
    </Box>
  );
};

export default Glossaries;
