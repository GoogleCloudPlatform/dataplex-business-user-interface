import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Typography, Paper, InputBase, List, ListItemButton, 
  ListItemIcon, ListItemText, Tabs, Tab, Chip, Grid, 
  Collapse, Card, CardContent, Button,
  Tooltip, Menu, MenuItem, Skeleton
} from '@mui/material';
import GlossaryIcon from '../../assets/svg/glossary.svg';
import TermIcon  from '../../assets/svg/glossary_term.svg';
import CategoryIcon  from '../../assets/svg/glossary_category.svg';
import NothingImage from '../../assets/images/nothing-image.png';
import ParentCategoryIcon from '../../assets/svg/parent_category.svg';
import ParentGlossaryIcon from '../../assets/svg/parent_glossary.svg';

import { 
  Search, DescriptionOutlined, AccessTime,
  ExpandMore, ArrowBack
} from '@mui/icons-material';
import { type GlossaryItem, type ItemType } from './GlossaryData';
import PreviewAnnotation from '../Annotation/PreviewAnnotation';
import AnnotationFilter from '../Annotation/AnnotationFilter';
import ResourceViewer from '../Common/ResourceViewer';
import ResourcePreview from '../Common/ResourcePreview';
import { typeAliases, hasValidAnnotationData } from '../../utils/resourceUtils';
import FilterDropdown from '../Filter/FilterDropDown';
import { Tune } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { type AppDispatch } from '../../app/store';
import { 
  fetchGlossaries, 
  fetchGlossaryChildren, 
  fetchItemDetails, 
  fetchTermRelationships,
  fetchGlossaryEntryDetails
} from '../../features/glossaries/glossariesSlice';
import { getProjects } from '../../features/projects/projectsSlice';
import { useAuth } from '../../auth/AuthProvider';
import { getFormattedDateTimePartsByDateTime } from '../../utils/resourceUtils';
import ShimmerLoader from '../Shimmer/ShimmerLoader';

// --- Icons Helper ---
const getIcon = (type: ItemType, fontSize: 'small' | 'medium' | 'large' = 'small') => {
  const sizeMap = {
    small: '1rem',
    medium: '1.5rem',
    large: '2.5rem'
  };

  const size = sizeMap[fontSize];

  const commonStyle = {
    width: size,
    height: size,
    flex: '0 0 auto',
    opacity: 1,
  };

  switch (type) {
    case 'glossary': return <img src={GlossaryIcon} alt={'Glossary'} style={commonStyle} />; 
    case 'category': return <img src={CategoryIcon} alt={'Category'} style={commonStyle} />;
    case 'term': return <img src={TermIcon} alt={'Term'} style={commonStyle} />;
    default: return <img src={TermIcon} alt={'Term'} style={commonStyle} />;
  }
};

// --- Sidebar Item ---
const SidebarItem = ({ 
  item, depth = 0, selectedId, expandedIds, onSelect, onToggle 
}: { 
  item: GlossaryItem, depth?: number, selectedId: string, expandedIds: Set<string>, 
  onSelect: (id: string) => void, onToggle: (id: string) => void 
}) => {
  const isSelected = selectedId === item.id;
  const isExpanded = expandedIds.has(item.id);
  const renderableChildren = item.children || [];
  const indent = depth * 20; 

  return (
    <>
      <ListItemButton
        selected={isSelected}
        onClick={() => { 
            onSelect(item.id); 
            if (!isExpanded) onToggle(item.id); 
        }}
        sx={{
          ml: `${20 + indent}px`, 
          mr: '20px', 
          pl: '8px', 
          pr: '12px',
          py: '8px', 
          height: '32px', 
          borderRadius: '200px', 
          mb: 0.5,
          width: 'auto', 
           
          '&.Mui-selected': { 
            backgroundColor: '#C2E7FF', color: '#1F1F1F',
            '&:hover': { backgroundColor: '#C2E7FF' }, 
            '& .MuiListItemIcon-root': { color: '#1F1F1F' },
            '& .MuiTypography-root': { fontWeight: 500 }
          },
          '&:hover': { backgroundColor: '#F1F3F4' }
        }}
      >
        {/* Chevron Icon Container */}
        <Box 
            component="span" 
            onClick={(e) => { e.stopPropagation(); onToggle(item.id); onSelect(item.id);}} 
            sx={{ 
                display: item.type !== 'term' ? 'flex' : 'none', 
                
                alignItems: 'center', 
                cursor: 'pointer', 
                mr: 0.5, 
                transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', 
                transition: 'transform 0.2s',
                visibility: 'visible' 
            }}
        >
            <ExpandMore fontSize="inherit" sx={{ fontSize: 16, color: '#1F1F1F' }} />
        </Box>

        <ListItemIcon sx={{ minWidth: 20, mr: 0.1, color: '#1F1F1F' }}>{getIcon(item.type, 'small')}</ListItemIcon>
        <ListItemText primary={item.displayName} primaryTypographyProps={{ fontFamily: depth === 0 ? 'Product Sans' : 'Google Sans', fontSize: '12px', fontWeight: isSelected ? 500 : 400, color: '#1F1F1F', noWrap: true, letterSpacing: '0.1px' }} />
      </ListItemButton>
      {renderableChildren.length > 0 && (
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {renderableChildren.map(child => (
              <SidebarItem key={child.id} item={child} depth={depth + 1} selectedId={selectedId} expandedIds={expandedIds} onSelect={onSelect} onToggle={onToggle} />
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
};

// --- Helpers ---
const extractGlossaryId = (entryId: string): string | null => {
  // Regex looks for the pattern: projects/.../glossaries/...
  // It handles the nested structure of Dataplex Entry names
  const match = entryId.match(/(projects\/[^/]+\/locations\/[^/]+\/glossaries\/[^/]+)\/terms\//);
  return match ? match[1] : null;
};

const normalizeId = (id: string) => {
  if (id.includes('/entries/')) {
    return id.split('/entries/')[1];
  }
  return id;
};

const getAllAncestorIds = (items: GlossaryItem[], targetId: string): string[] => {
    const ancestors: string[] = [];
    
    const findPath = (nodes: GlossaryItem[], target: string, path: string[]) => {
        for (const node of nodes) {
            if (node.id === target) {
                ancestors.push(...path);
                return true;
            }
            if (node.children) {
                if (findPath(node.children, target, [...path, node.id])) return true;
            }
        }
        return false;
    };
    
    findPath(items, targetId, []);
    return ancestors;
};

const findItem = (items: GlossaryItem[], id: string): GlossaryItem | null => {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.children) {
      const found = findItem(item.children, id);
      if (found) return found;
    }
  }
  return null;
};

const getBreadcrumbs = (items: GlossaryItem[], targetId: string, chain: GlossaryItem[] = []): GlossaryItem[] | null => {
    for (const item of items) {
        if (item.id === targetId) return [...chain, item];
        if (item.children) {
            const found = getBreadcrumbs(item.children, targetId, [...chain, item]);
            if (found) return found;
        }
    }
    return null;
};

// --- Search Helper Functions ---
const filterGlossaryTree = (nodes: GlossaryItem[], query: string): GlossaryItem[] => {
  return nodes.reduce((acc: GlossaryItem[], node) => {
    // Recursively filter children
    const filteredChildren = node.children ? filterGlossaryTree(node.children, query) : [];
    
    // Check if current node matches or if it has matching children
    const matches = node.displayName.toLowerCase().includes(query.toLowerCase());
    
    if (matches || filteredChildren.length > 0) {
      // If parent matches, show all its children (optional UX choice), 
      // OR if only children match, show parent with filtered children.
      // Here we stick to strict filtering: show node if it matches or has matching descendants.
      acc.push({ 
        ...node, 
        children: matches && filteredChildren.length === 0 ? node.children : filteredChildren 
      });
    }
    return acc;
  }, []);
};

const collectAllIds = (nodes: GlossaryItem[]): string[] => {
  let ids: string[] = [];
  nodes.forEach(node => {
    ids.push(node.id);
    if (node.children) ids = [...ids, ...collectAllIds(node.children)];
  });
  return ids;
};

const Glossaries = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();

  const { glossaryItems, status } = useSelector((state: any) => state.glossaries);
  const projects = useSelector((state: any) => state.projects.items);
  const projectsLoaded = useSelector((state: any) => state.projects.isloaded);
  
  const [selectedId, setSelectedId] = useState<string>('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0); 
  const [contentSearchTerm, setContentSearchTerm] = useState('');
  const [relationFilter, setRelationFilter] = useState<'all' | 'synonym' | 'related'>('all');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [filteredAnnotationEntry, setFilteredAnnotationEntry] = useState<any>(null);
  const [expandedAnnotations, setExpandedAnnotations] = useState<Set<string>>(new Set());
  const [assetPreviewData, setAssetPreviewData] = useState<any | null>(null);
  const [isAssetPreviewOpen, setIsAssetPreviewOpen] = useState(false);
  const [assetViewMode, setAssetViewMode] = useState<'list' | 'table'>('list');
  const [assetPageSize, setAssetPageSize] = useState(20);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [sortBy, setSortBy] = useState<'name' | 'lastModified'>('name');
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [activeFilters, setActiveFilters] = useState<any[]>([]);
  const fetchedParentIds = React.useRef(new Set<string>());
  const [isSidebarLoading, setIsSidebarLoading] = useState(false);
  const [isContentLoading, setIsContentLoading] = useState(false);

  const displayGlossaries = useMemo(() => {
    if (!searchTerm.trim()) return glossaryItems;
    return filterGlossaryTree(glossaryItems, searchTerm);
  }, [searchTerm, glossaryItems]);

  useEffect(() => {
    if (!projectsLoaded && user?.token) {
      dispatch(getProjects({ id_token: user?.token }));
    }
  }, [dispatch, projectsLoaded, user?.token]);

  useEffect(() => {
    if (glossaryItems.length === 0 && status === 'idle' && user?.token) {
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
      dispatch(fetchItemDetails({ entryName: firstId, id_token: user?.token }));
    }
  }, [glossaryItems, selectedId, dispatch, user?.token]);


  // --- Sort Handlers ---
  const handleSortClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setSortAnchorEl(event.currentTarget);
  };

  const handleSortClose = () => {
    setSortAnchorEl(null);
  };

  const handleSortSelect = (criteria: 'name' | 'lastModified') => {
    if (criteria === sortBy) {
        // Toggle direction if clicking the same criteria
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
        // New criteria: Set default order (Name -> A-Z, Date -> Newest First)
        setSortBy(criteria);
        setSortOrder(criteria === 'name' ? 'asc' : 'desc');
    }
    handleSortClose();
  };

  const sortItems = (items: any[]) => {
    return [...items].sort((a, b) => {
      if (sortBy === 'name') {
          const nameA = a.displayName.toLowerCase();
          const nameB = b.displayName.toLowerCase();
          if (sortOrder === 'asc') return nameA.localeCompare(nameB);
          return nameB.localeCompare(nameA);
      } else {
          // Last Modified (Number)
          const dateA = a.lastModified || 0;
          const dateB = b.lastModified || 0;
          if (sortOrder === 'asc') return dateA - dateB; // Oldest first
          return dateB - dateA; // Newest first
      }
    });
  };

  const filteredGlossaries = useMemo(() => {
    if (!searchTerm.trim()) return displayGlossaries;
    return filterGlossaryTree(displayGlossaries, searchTerm);
  }, [searchTerm, displayGlossaries]);

  const getAllTerms = (node: GlossaryItem): GlossaryItem[] => {
    let allTerms: GlossaryItem[] = [];
    if (node.children) {
      node.children.forEach(child => {
        if (child.type === 'term') {
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

  const categories = selectedItem?.children?.filter(c => c.type === 'category') || [];
  const terms = useMemo(() => selectedItem ? getAllTerms(selectedItem) : [], [selectedItem]);
  const relations = selectedItem?.relations || [];
  const isTerm = selectedItem?.type === 'term';
  const dynamicMaxHeight = '100%';

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setContentSearchTerm(''); 
  };

 const handleToggle = (id: string) => {
    const newExpanded = new Set(expandedIds);
    const item = findItem(displayGlossaries, id);

    if (!newExpanded.has(id)) {
      // Opening logic
        const isRootGlossary = glossaryItems.some((g: GlossaryItem) => g.id === id);
        
        if (isRootGlossary) {
            // Collapse all other root glossaries
            glossaryItems.forEach((g: GlossaryItem) => {
                if (g.id !== id && newExpanded.has(g.id)) {
                    newExpanded.delete(g.id);
                }
            });
        }

        // If expanding and no children, fetch them
        if (item && (!item.children || item.children.length === 0)) {
            dispatch(fetchGlossaryChildren({ 
                parentId: id, 
                id_token: user?.token 
            }));
        }
        newExpanded.add(id);
    } else {
        // Closing logic
        newExpanded.delete(id);
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
                await dispatch(fetchGlossaryChildren({ 
                    parentId: parentGlossaryId, 
                    id_token: user?.token 
                })).unwrap();
                
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
    setContentSearchTerm(''); 

    dispatch(fetchItemDetails({ 
        entryName: targetId, 
        id_token: user?.token 
    }))
    .unwrap()
    .catch((err) => {
         console.warn("Failed to fetch details for navigation target", targetId, err);
    })
    .finally(() => setIsContentLoading(false));

    // If it's a TERM, pre-fetch relationships
    if (targetId.includes('/terms/')) {
         dispatch(fetchTermRelationships({ 
            termId: targetId, 
            id_token: user?.token 
        }));
    }
  };

 useEffect(() => {
    if (selectedId && user?.token) {
        const item = findItem(displayGlossaries, selectedId);

        if (item && (!item.aspects || Object.keys(item.aspects).length === 0)) {
             setIsContentLoading(true);
             dispatch(fetchGlossaryEntryDetails({ 
                entryName: selectedId, 
                id_token: user?.token 
            }))
            .unwrap()
            .catch((err) => {
              console.warn("Failed to fetch entry details for", selectedId, err);
            })
            .finally(() => setIsContentLoading(false));
        } else if (item && item.aspects) {
             // If we switch to an item that is already cached, ensure loading is off
             setIsContentLoading(false);
        }
    }
  }, [selectedId, user?.token, displayGlossaries]);

  useEffect(() => {
    if (glossaryItems.length > 0 && user?.token) {
        glossaryItems.forEach((item: GlossaryItem, index: number) => {
            // Only target top-level Glossaries
            if (item.type === 'glossary') {
                // Check if we haven't fetched this one yet
                if (!fetchedParentIds.current.has(item.id)) {
                    // Mark as fetched immediately to prevent re-entry
                    fetchedParentIds.current.add(item.id);

                    // If children are empty, fetch them
                    if (!item.children || item.children.length === 0) {
                        // Only trigger loading state for the first item to control sidebar shimmer
                        if (index === 0) setIsSidebarLoading(true);

                        dispatch(fetchGlossaryChildren({ 
                            parentId: item.id, 
                            id_token: user?.token 
                        }))
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
    const filtered = categories.filter(c => c.displayName.toLowerCase().includes(contentSearchTerm.toLowerCase()));
    return sortItems(filtered);
  }, [categories, contentSearchTerm, sortOrder]);

  const filteredTerms = useMemo(() => {
    const filtered = terms.filter(t => t.displayName.toLowerCase().includes(contentSearchTerm.toLowerCase()));
    return sortItems(filtered);
  }, [terms, contentSearchTerm, sortOrder]);

  const filteredRelations = useMemo(() => {
    const filtered = relations.filter(r => {
      const matchesSearch = r.displayName.toLowerCase().includes(contentSearchTerm.toLowerCase());
      const matchesType = relationFilter === 'all' || r.type === relationFilter;
      return matchesSearch && matchesType;
    });
    return sortItems(filtered);
  }, [relations, contentSearchTerm, relationFilter, sortOrder]);

  const hasVisibleAspects = useMemo(() => {
    const aspects = selectedItem?.aspects;
    if (!aspects) return false;
    
    return Object.keys(aspects).some(key => {
      const isSchema = key.endsWith('.global.schema');
      const isOverview = key.endsWith('.global.overview');
      const isContacts = key.endsWith('.global.contacts');
      const isUsage = key.endsWith('.global.usage');
      const isGlossaryTermAspect = key.endsWith('.global.glossary-term-aspect');

      if (isSchema || isOverview || isContacts || isUsage || isGlossaryTermAspect) {
        return false;
      }

      return hasValidAnnotationData(aspects[key]);
    });
  }, [selectedItem]);

const filteredLinkedAssets = useMemo(() => {
    let assets = selectedItem?.linkedAssets || [];

    if (contentSearchTerm.trim()) {
      const lowerTerm = contentSearchTerm.toLowerCase();
      assets = assets.filter((asset: any) => {
        const name = asset.dataplexEntry?.entrySource?.displayName || '';
        const description = asset.dataplexEntry?.entrySource?.description || '';
        return name.toLowerCase().includes(lowerTerm) || description.toLowerCase().includes(lowerTerm);
      });
    }

    if (activeFilters.length > 0) {
      
      // Group filters by type
      const systemFilters = activeFilters.filter((f: any) => f.type === 'system');
      const typeFilters = activeFilters.filter((f: any) => f.type === 'typeAliases');
      const projectFilters = activeFilters.filter((f: any) => f.type === 'project');
      const aspectFilters = activeFilters.filter((f: any) => f.type === 'aspectType');

      assets = assets.filter((asset: any) => {
        
        // --- A. Product Filter ---
        if (systemFilters.length > 0) {
          const system = asset.dataplexEntry?.entrySource?.system?.toLowerCase() || '';
          const match = systemFilters.some((filter: any) => {
            if (filter.name === 'Others') return true; 
            return system === filter.name.toLowerCase();
          });
          if (!match) return false;
        }

        // --- B. Asset Type Filter ---
        if (typeFilters.length > 0) {
          const entryTypeStr = asset.dataplexEntry?.entryType?.toLowerCase() || '';
          const match = typeFilters.some((filter: any) => {
            const filterName = filter.name.toLowerCase();
            const hyphenatedName = filterName.replace(/\s+/g, '-');
            return entryTypeStr.includes(hyphenatedName) || entryTypeStr.includes(filterName);
          });
          if (!match) return false;
        }

        // --- C. Project Filter ---
        if (projectFilters.length > 0) {
          const resourcePath = asset.dataplexEntry?.entrySource?.resource || '';
          const linkedPath = asset.linkedResource || '';
          const match = projectFilters.some((filter: any) => {
             if (filter.name === 'Others') return true;
             return resourcePath.includes(filter.name) || linkedPath.includes(filter.name);
          });
          if (!match) return false;
        }

        // --- D. Aspect Filter ---
        if (aspectFilters.length > 0) {
           const aspects = asset.dataplexEntry?.aspects || {};
           const match = aspectFilters.some((filter: any) => 
              Object.keys(aspects).some(key => 
                 key.toLowerCase().includes(filter.name.toLowerCase())
              )
           );
           if (!match) return false;
        }

        return true;
      });
    }

    return assets;
  }, [selectedItem, contentSearchTerm, activeFilters, sortOrder, sortBy]);

  // Recursive helper to find a description by ID in the tree
  const findDescriptionById = (items: GlossaryItem[], targetId: string): string | null => {
    for (const item of items) {
      if (item.id === targetId) return item.description || null;
      if (item.children) {
        const found = findDescriptionById(item.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  const handleAnnotationCollapseAll = () => {
    setExpandedAnnotations(new Set());
  };

  const handleAnnotationExpandAll = () => {
    const aspects = selectedItem?.aspects;
    
    if (aspects) {
      const annotationKeys = Object.keys(aspects).filter(key => {
        const isSchema = key.endsWith('.global.schema');
        const isOverview = key.endsWith('.global.overview');
        const isContacts = key.endsWith('.global.contacts');
        const isUsage = key.endsWith('.global.usage');
        const isGlossaryTermAspect = key.endsWith('.global.glossary-term-aspect');

        if (isSchema || isOverview || isContacts || isUsage || isGlossaryTermAspect) {
          return false;
        }

        return hasValidAnnotationData(aspects[key]);
      });

      setExpandedAnnotations(new Set(annotationKeys));
    }
  };

  useEffect(() => {
    setIsDescriptionExpanded(false);
    setAssetPreviewData(null);
    setIsAssetPreviewOpen(false);
  }, [selectedId]);

  useEffect(() => {
    if (searchTerm.trim()) {
      const allIds = collectAllIds(filteredGlossaries);
      setExpandedIds(new Set(allIds));
    }
  }, [searchTerm, filteredGlossaries]);

  useEffect(() => {
    setIsDescriptionExpanded(false);
  }, [selectedId]);

  // Auto-expand tree to show selected item (and collapse others)
  useEffect(() => {
    if (selectedId && glossaryItems.length > 0) {
      const ancestors = getAllAncestorIds(glossaryItems, selectedId);
      const newExpanded = new Set(ancestors);
      const currentItem = findItem(glossaryItems, selectedId);
      if (currentItem && (currentItem.type === 'glossary' || currentItem.type === 'category')) {
          newExpanded.add(selectedId);
      }

      setExpandedIds(newExpanded);
    }
  }, [selectedId, glossaryItems]);

  const shouldShowSidebarShimmer = 
    status === 'loading' || 
    isSidebarLoading || 
    (glossaryItems.length > 0 && 
     glossaryItems[0].type === 'glossary' && 
     (!glossaryItems[0].children || glossaryItems[0].children.length === 0) && 
     !fetchedParentIds.current.has(glossaryItems[0].id));

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'flex-start', 
      px: 3,
      pb: 3,
      pt: '8px',
      backgroundColor: '#F8FAFD', 
      height: 'calc(100vh - 64px)',
      width: '100vw',
      overflow: 'hidden'
    }}>
      
      {/* SIDEBAR CARD */}
      <Paper elevation={0} sx={{ 
        width: '18%', 
        minWidth: '240px', 
        height: 'calc(100vh - 110px)',
        borderRadius: '24px', 
        backgroundColor: '#fff', 
        border: 'transparent', 
        mr: '2%',
        display: 'flex', 
        flexDirection: 'column', 
        flexShrink: 0, 
        overflow: 'hidden', 
        py: '20px', 
        gap: '8px' 
      }}>
        <Box sx={{ px: 2.5, mb: 1 }}>
          <Typography variant="h6" sx={{ fontFamily: 'Google Sans Text', fontSize: '16px', fontWeight: 500, lineHeight: '24px', color: '#000000', mb: 2 }}>Business Glossaries</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', backgroundColor: '#fff', border: '1px solid #DADCE0', borderRadius: '54px', px: 1.5, py: 0.5, height: '32px', boxSizing: 'border-box' }}>
            <Search sx={{ color: '#575757', mr: 1, fontSize: 20 }} />
            <InputBase 
              placeholder="Search glossaries" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              sx={{ 
                fontFamily: 'Google Sans Text', 
                fontSize: '12px', 
                color: '#5E5E5E', 
                width: '100%', 
                letterSpacing: '0.1px',
                fontWeight: 500,
                '& ::placeholder': { opacity: 100, color: '#5E5E5E' }
              }} 
            />
          </Box>
        </Box>
        <List sx={{ overflowY: 'auto', flex: 1, pt: 0, px: 0 }}>
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
                    const targetItem = findItem(glossaryItems, id);
                    if (targetItem && (!targetItem.aspects || Object.keys(targetItem.aspects).length === 0)) {
                       setIsContentLoading(true);
                    }
                    setSelectedId(id); 
                    setTabValue(0); 
                    handleNavigate(id);
                  }} 
                  onToggle={handleToggle} 
                />
              ))}
              {filteredGlossaries.length === 0 && (
                 <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">No results found</Typography>
                 </Box>
              )}
            </>
          )}
        </List>
      </Paper>

      {/* MAIN CONTENT CARD - Responsive Width */}
      <Paper 
        elevation={0} 
        sx={{ 
          flex: 1,
          height: 'calc(100vh - 110px)',
          borderRadius: '24px', 
          backgroundColor: '#fff', 
          border: 'transparent',
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* HEADER SECTION */}
        <Box 
            sx={{ 
                height: '102px', 
                borderBottom: '1px solid #DADCE0', 
                position: 'relative',
                flexShrink: 0 
            }}
        >
          {/* Breadcrumbs/Title Row */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, position: 'absolute', top: '20px', left: '20px' }}>
            {status === 'loading' && !selectedItem ? (
               // Title Shimmer: Used only on initial load when title is unknown 
               <Box sx={{ width: '300px' }}>
                   <ShimmerLoader count={1} type="header" />
               </Box>
            ) : (
               <>
                  {breadcrumbs.length > 1 && (
                    <Button sx={{ minWidth: 'auto', p: 0.5, mr: 0.5, color: '#5f6368' }} 
                            onClick={() => {
                            setSelectedId(breadcrumbs[breadcrumbs.length - 2].id);
                            setTabValue(0); 
                        }}>
                        <ArrowBack fontSize="small" />
                    </Button>
                  )}
                  <Box sx={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {getIcon(selectedItem?.type || 'term', 'medium')}
                  </Box>
                  <Typography variant="h5" sx={{ fontFamily: '"Google Sans", sans-serif', fontWeight: 500, fontSize: '18px', lineHeight: '24px', color: '#1F1F1F' }}>
                    {selectedItem?.displayName}
                  </Typography>
               </>
            )}
          </Box>

          {/* Tabs */}
          {(
             (status === 'loading' && !selectedItem) || 
             isContentLoading || 
             (selectedItem && !selectedItem.aspects) ||
             (selectedItem?.type === 'term' && !selectedItem.relations)
           ) ? (
             // Tabs Shimmer: Horizontal row of placeholders to prevent layout jump
             <Box sx={{ position: 'absolute', bottom: '8px', left: '20px', display: 'flex', gap: '40px' }}>
                <Box sx={{ width: '100px' }}>
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
                    position: 'absolute', 
                    bottom: 0, 
                    left: '20px', 
                    right: '20px',
                    minHeight: '44px', 
                    height: '44px',
                    '& .MuiTabs-scrollableX': {
                      overflowX: 'auto',
                      '::-webkit-scrollbar': { display: 'none' } 
                    },
                    '& .MuiTabs-indicator': { 
                        backgroundColor: '#0E4DCA', 
                        height: '3px', 
                        borderTopLeftRadius: '2.5px', 
                        borderTopRightRadius: '2.5px',
                        bottom: 0
                    },
                    '& .MuiTabs-flexContainer': { 
                        gap: '40px' 
                    }
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
                      { label: "Aspects", hide: !isTerm } 
                  ].map((tab, index) => {
                    if (tab.hide) return null;
                    return (
                        <Tab 
                            key={index}
                            value={index}
                            label={tab.label}
                            disableRipple
                            sx={{ 
                                textTransform: 'none', 
                                fontFamily: '"Google Sans Text", sans-serif',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                lineHeight: '20px',
                                minWidth: 'auto', 
                                padding: '8px 0 0 0', 
                                color: '#575757', 
                                '&.Mui-selected': { color: '#0E4DCA' },
                                '&.Mui-disabled': { color: '#BDBDBD' },
                                alignItems: 'flex-start',
                                justifyContent: 'flex-start'
                            }} 
                        />
                    );
                })}
              </Tabs>
          )}
        </Box>

        {/* CONTENT BODY */}
        {(status === 'loading' && !selectedItem) || isContentLoading ? (
            <Box sx={{ p: '20px', flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>   
              {/* Overview Tab Layout Shimmer  */}
              <Grid container spacing={2.5} sx={{ flexWrap: 'nowrap', flex: 1, minHeight: 0 }}>
                 
                 {/* Left Column */}
                 <Grid sx={{ flex: 2.2, minWidth: 0, height: '100%' }}>
                    <Box sx={{ 
                        height: '100%', 
                        border: '1px solid #E0E0E0', 
                        borderRadius: '16px', 
                        p: 3, 
                        bgcolor: '#ffffff',
                        overflow: 'hidden'
                    }}>
                        <Box sx={{ width: '100%', mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                           <Skeleton variant="text" width="40%" height={32} sx={{ mb: 1 }} />
                           
                           <Skeleton variant="text" width="100%" height={20} />
                           <Skeleton variant="text" width="100%" height={20} />
                           <Skeleton variant="text" width="90%" height={20} />
                           <Skeleton variant="text" width="95%" height={20} />
                           
                           <Skeleton variant="rectangular" width="60%" height={120} sx={{ my: 2, borderRadius: '8px' }} />

                           <Skeleton variant="text" width="100%" height={20} />
                           <Skeleton variant="text" width="80%" height={20} />
                        </Box>
                    </Box>
                 </Grid>

                 {/* Right Column */}
                 <Grid sx={{ flex: 1, minWidth: 0, height: '100%' }}>
                    <Box sx={{ 
                        height: '100%', 
                        border: '1px solid #E0E0E0', 
                        borderRadius: '16px', 
                        p: '20px',
                        bgcolor: '#ffffff',
                        overflow: 'hidden',
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '16px'
                    }}>
                          <Typography variant="h6" sx={{ fontFamily: 'Google Sans', fontSize: '18px', color: '#1F1F1F' }}>Details</Typography>
                          
                          {/* Description Shimmer */}
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <Skeleton variant="text" width={80} height={16} sx={{ bgcolor: '#f5f5f5' }} />
                              <Skeleton variant="text" width="100%" height={20} />
                              <Skeleton variant="text" width="90%" height={20} />
                              <Skeleton variant="text" width="60%" height={20} />
                          </Box>

                          {/* Field Shimmers (Project, Location, etc.) */}
                          {[1, 2, 3].map((i) => (
                             <Box key={i} sx={{ p: '12px 16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                 <Skeleton variant="text" width={60} height={16} sx={{ bgcolor: '#f5f5f5' }} />
                                 <Skeleton variant="rounded" width="100%" height={24} />
                             </Box>
                          ))}
                    </Box>
                 </Grid>
              </Grid>
           </Box>
        ) : selectedItem ? (<Box sx={{ p: '20px', overflowY: 'hidden', flex: 1 }}>
          
          {tabValue === 0 && (
            <Grid container spacing={2.5} sx={{ flexWrap: 'nowrap', height: '100%' }}> 
              
              {/* Left Column (Overview) */}
              <Grid sx={{ flex: 2.2, minWidth: 0, height: '100%' }}> 
                <Card variant="outlined" sx={{ borderRadius: '16px', borderColor: '#DADCE0', height: '100%', maxHeight: dynamicMaxHeight, overflow: 'hidden',display: 'flex', flexDirection: 'column', }}>
                  <CardContent sx={{ p: 3, overflowY: 'auto', flex: 1 }}>
                      {(isContentLoading || (selectedItem && !selectedItem.aspects)) ? (
                        <Box sx={{ width: '100%', mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                           <Skeleton variant="text" width="40%" height={32} sx={{ mb: 1 }} />
                           
                           <Skeleton variant="text" width="100%" height={20} />
                           <Skeleton variant="text" width="100%" height={20} />
                           <Skeleton variant="text" width="90%" height={20} />
                           <Skeleton variant="text" width="95%" height={20} />
                           
                           <Skeleton variant="rectangular" width="60%" height={120} sx={{ my: 2, borderRadius: '8px' }} />

                           <Skeleton variant="text" width="100%" height={20} />
                           <Skeleton variant="text" width="80%" height={20} />
                        </Box>
                      ) : selectedItem?.longDescription ? (
                        <>
                            <Typography 
                                component="div" 
                                variant="body1" 
                                sx={{ 
                                    fontFamily: 'Google Sans', 
                                    fontSize: '14px', 
                                    color: '#1F1F1F', 
                                    lineHeight: '20px',
                                    width: '100%',
                                    overflowWrap: 'break-word',
                                    '& p': { mb: 1.5, mt: 0 },
                                    '& ul, & ol': { pl: 3, mb: 1.5 },
                                    '& li': { mb: 0.5 },
                                    '& h1, & h2, & h3, & h4, & h5, & h6': { 
                                        fontFamily: 'Google Sans',
                                        fontSize: '16px', 
                                        fontWeight: 500, 
                                        mt: 3, 
                                        mb: 1.5,
                                        color: '#000'
                                    },
                                    '& a': { color: '#1967d2', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } },
                                    '& img': { 
                                        maxWidth: '50%',
                                        height: 'auto',
                                        borderRadius: '8px', 
                                        marginTop: '16px',      
                                        marginBottom: '16px',    
                                        display: 'block',       
                                        marginLeft: 'auto',     
                                        marginRight: 'auto',     
                                        objectFit: 'scale-down'
                                    }
                                }}
                                dangerouslySetInnerHTML={{ __html: selectedItem.longDescription }}
                            />
                        </>
                      ) : (
                        <Box sx={{ display: 'flex', height: '80%', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', mt: 5, opacity: 1 }}>
                           <img 
                                src={NothingImage} 
                                alt="Nothing here" 
                                style={{ width: '200px', height: 'auto' }} 
                           />
                        </Box>
                      )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Right Column (Details) */}
              <Grid sx={{ flex: 1, minWidth: 0 }}>
                <Paper 
                    variant="outlined" 
                    sx={{ 
                        p: '20px', 
                        borderRadius: '16px', 
                        borderColor: '#DADCE0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        maxHeight: dynamicMaxHeight,
                        overflowY: 'auto'
                    }}
                >
                  {(isContentLoading || (selectedItem && !selectedItem.aspects)) ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <Typography variant="h6" sx={{ fontFamily: 'Google Sans', fontSize: '18px', color: '#1F1F1F' }}>Details</Typography>
                          
                          {/* Description Shimmer */}
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <Skeleton variant="text" width={80} height={16} sx={{ bgcolor: '#f5f5f5' }} />
                              <Skeleton variant="text" width="100%" height={20} />
                              <Skeleton variant="text" width="90%" height={20} />
                              <Skeleton variant="text" width="60%" height={20} />
                          </Box>

                          {/* Field Shimmers (Project, Location, etc.) */}
                          {[1, 2, 3].map((i) => (
                             <Box key={i} sx={{ p: '12px 16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                 <Skeleton variant="text" width={60} height={16} sx={{ bgcolor: '#f5f5f5' }} />
                                 <Skeleton variant="rounded" width="100%" height={24} />
                             </Box>
                          ))}
                      </Box>
                  ) : (
                      /* 2. LOADED CONTENT (Includes Title) */
                      <>
                          <Typography variant="h6" sx={{ fontFamily: 'Google Sans', fontSize: '18px', color: '#1F1F1F' }}>Details</Typography>
                          
                          {/* 1. Description */}
                          {selectedItem?.description && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px', mb: 2 }}>
                                <Typography sx={{ fontFamily: 'Google Sans Text', fontSize: '11px', fontWeight: 500, color: '#575757', letterSpacing: '0.1px' }}>
                                    Description
                                </Typography>
                                
                                <Box>
                                    <Typography 
                                        sx={{ 
                                            fontFamily: 'Google Sans', 
                                            fontSize: '14px', 
                                            color: '#1F1F1F', 
                                            lineHeight: '20px', 
                                            overflowWrap: 'break-word', 
                                            wordBreak: 'break-word',
                                            whiteSpace: 'pre-wrap'
                                        }}
                                    >
                                        {isDescriptionExpanded 
                                            ? selectedItem.description 
                                            : selectedItem.description.length > 150 
                                                ? `${selectedItem.description.slice(0, 150)}...` 
                                                : selectedItem.description
                                        }
                                    </Typography>
                                    
                                    {selectedItem.description.length > 150 && (
                                        <Button 
                                            size="small" 
                                            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                            sx={{ 
                                                textTransform: 'none', 
                                                p: 0, 
                                                mt: 0.5, 
                                                minWidth: 'auto', 
                                                fontWeight: 500,
                                                fontSize: '13px',
                                                color: '#0E4DCA',
                                                '&:hover': { background: 'transparent', textDecoration: 'underline' } 
                                            }}
                                        >
                                            {isDescriptionExpanded ? 'Read Less' : 'Read More'}
                                        </Button>
                                    )}
                                </Box>
                            </Box>
                          )}

                          {/* 2. GLOSSARY SPECIFIC FIELDS */}
                          {selectedItem?.type === 'glossary' && (
                            <>
                                <Box sx={{ p: '12px 16px', backgroundColor: '#F8FAFD', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <Typography sx={{ fontFamily: 'Google Sans Text', fontSize: '11px', fontWeight: 500, color: '#575757', letterSpacing: '0.1px' }}>
                                        Project
                                    </Typography>
                                    <Typography sx={{ fontFamily: 'Google Sans', fontSize: '14px', color: '#1F1F1F', overflowWrap: 'break-word' }}>
                                        {(() => {
                                            const pid = selectedItem?.project;
                                            if (!pid || pid === '-') return '-';

                                            const foundProject = projects?.find((p: any) => 
                                                p.name.endsWith(`/${pid}`) || 
                                                p.projectId === pid
                                            );

                                            return foundProject ? foundProject.projectId : pid;
                                        })()}
                                    </Typography>
                                </Box>
                                <Box sx={{ p: '12px 16px', backgroundColor: '#F8FAFD', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <Typography sx={{ fontFamily: 'Google Sans Text', fontSize: '11px', fontWeight: 500, color: '#575757', letterSpacing: '0.1px' }}>
                                        Location
                                    </Typography>
                                    <Typography sx={{ fontFamily: 'Google Sans', fontSize: '14px', color: '#1F1F1F', overflowWrap: 'break-word' }}>
                                        {selectedItem.location || '-'}
                                    </Typography>
                                </Box>
                            </>
                          )}

                          {/* 3. CATEGORY & TERM SPECIFIC (Parent Info) */}
                          {(selectedItem?.type === 'category' || selectedItem?.type === 'term') && breadcrumbs.length > 1 && (
                            <Box sx={{ p: '12px 16px', backgroundColor: '#F8FAFD', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <Typography sx={{ fontFamily: 'Google Sans Text', fontSize: '11px', fontWeight: 500, color: '#575757', letterSpacing: '0.1px' }}>
                                    {breadcrumbs[breadcrumbs.length - 2].type === 'category' ? 'Parent Category' : 'Parent Glossary'}
                                </Typography>
                                
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <img 
                                        src={breadcrumbs[breadcrumbs.length - 2].type === 'category' ? ParentCategoryIcon : ParentGlossaryIcon} 
                                        alt="Parent Icon" 
                                        style={{
                                            width: '1rem', 
                                            height: '1rem', 
                                            flexShrink: 0 
                                        }} 
                                    />
                                    <Typography sx={{ fontFamily: 'Google Sans', fontSize: '14px', color: '#1F1F1F', overflowWrap: 'break-word' }}>
                                        {breadcrumbs[breadcrumbs.length - 2].displayName}
                                    </Typography>
                                </Box>
                            </Box>
                          )}

                          {/* 4. Last Modified */}
                          <Box sx={{ p: '12px 16px', backgroundColor: '#F8FAFD', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <Typography sx={{ fontFamily: 'Google Sans Text', fontSize: '11px', fontWeight: 500, color: '#575757', letterSpacing: '0.1px' }}>
                                Last Modified
                            </Typography>
                            <Typography sx={{ fontFamily: 'Google Sans', fontSize: '14px', color: '#1F1F1F', overflowWrap: 'break-word' }}>
                                {(() => {
                                    const { date, time } = getFormattedDateTimePartsByDateTime({ seconds: selectedItem?.lastModified });
                                    return `${date}, ${time}`;
                                })()}
                            </Typography>
                          </Box>

                          {/* 5. Labels */}
                          <Box sx={{ p: '12px 16px', backgroundColor: '#F8FAFD', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <Typography sx={{ fontFamily: 'Google Sans Text', fontSize: '11px', fontWeight: 500, color: '#575757', letterSpacing: '0.1px' }}>
                                Labels
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                {selectedItem?.labels && selectedItem?.labels.length > 0 ? (
                                    selectedItem?.labels.map((label, index) => (
                                        <Chip 
                                            key={index} 
                                            label={label} 
                                            size="small" 
                                            sx={{ bgcolor: '#C2E7FF', color: '#004A77', fontFamily: 'Google Sans', fontWeight: 500, fontSize: '12px', height: '24px' }} 
                                        />
                                    ))
                                ) : (
                                    <Typography sx={{ fontFamily: 'Google Sans', fontSize: '14px', color: '#1F1F1F' }}>-</Typography>
                                )}
                            </Box>
                          </Box>

                          {/* 6. Contacts (Category & Term only) */}
                          {(selectedItem?.type === 'category' || selectedItem?.type === 'term') && (
                             <Box sx={{ p: '12px 16px', backgroundColor: '#F8FAFD', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <Typography sx={{ fontFamily: 'Google Sans Text', fontSize: '11px', fontWeight: 500, color: '#575757', letterSpacing: '0.1px' }}>
                                    Contacts
                                </Typography>
                                
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                    {selectedItem.contacts && selectedItem.contacts.length > 0 ? (
                                        <>
                                            <Typography sx={{ fontFamily: 'Google Sans', fontSize: '14px', color: '#1F1F1F' }}>
                                                {selectedItem.contacts[0]}
                                            </Typography>

                                            {selectedItem.contacts.length > 1 && (
                                                <Tooltip 
                                                    title={
                                                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                            {selectedItem.contacts.slice(1).map((contact, i) => (
                                                                <Typography key={i} variant="caption" sx={{ color: '#fff' }}>
                                                                    {contact}
                                                                </Typography>
                                                            ))}
                                                        </Box>
                                                    } 
                                                    arrow
                                                >
                                                    <Typography 
                                                        sx={{ 
                                                            fontFamily: 'Google Sans', 
                                                            fontSize: '14px', 
                                                            color: '#0E4DCA', 
                                                            cursor: 'pointer',
                                                            fontWeight: 500,
                                                            '&:hover': { textDecoration: 'underline' }
                                                        }}
                                                    >
                                                        +{selectedItem.contacts.length - 1}
                                                    </Typography>
                                                </Tooltip>
                                            )}
                                        </>
                                    ) : (
                                        <Typography sx={{ fontFamily: 'Google Sans', fontSize: '14px', color: '#1F1F1F' }}>-</Typography>
                                    )}
                                </Box>
                             </Box>
                          )}
                      </>
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}

          {!isTerm && (tabValue === 1 || tabValue === 2) && (
            <Box sx={{ height: '100%' }}>
              {(() => {
                const itemsToDisplay = tabValue === 1 ? filteredCategories : filteredTerms;
                const label = tabValue === 1 ? 'categories' : 'terms';
                const emptyLabel = selectedItem?.type === 'category'? 'category': 'glossary';
                if (itemsToDisplay.length === 0) {
                    return (
                      <Box sx={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          height: '100%', 
                          opacity: 1,
                          gap: 2 
                      }}>
                          <Typography variant="body1" color="text.secondary">
                            No {label} available for this {emptyLabel}
                        </Typography>
                      </Box>
                    );
                }
                return (
                  <>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px', mb: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', backgroundColor: '#fff', border: '1px solid #DADCE0', borderRadius: '54px', px: 1.5, py: 0.5, height: '32px', width: '309px', boxSizing: 'border-box' }}>
                              <Search sx={{ color: '#575757', mr: 1, fontSize: 20 }} />
                              <InputBase 
                                  placeholder={`Search ${label}`} 
                                  value={contentSearchTerm} 
                                  onChange={(e) => setContentSearchTerm(e.target.value)}
                                  sx={{ fontFamily: 'Google Sans Text', fontSize: '12px', fontWeight: 500, color: '#5E5E5E', width: '100%', letterSpacing: '0.1px', '& ::placeholder': { opacity: 1, color: '#5E5E5E' } }} 
                              />
                          </Box>
                          {/* SORT BUTTON & MENU */}
                          <Button onClick={handleSortClick} endIcon={<ExpandMore sx={{ color: '#1F1F1F', fontSize: 20, transform: sortAnchorEl ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />} sx={{ textTransform: 'none', color: '#1F1F1F', fontFamily: 'Product Sans', fontSize: '12px', fontWeight: 400, padding: 0, minWidth: 'auto', '&:hover': { background: 'transparent' } }}>
                              Sort by: {sortBy === 'name' ? 'Name' : 'Last Modified'}
                          </Button>
                          <Menu anchorEl={sortAnchorEl} open={Boolean(sortAnchorEl)} onClose={handleSortClose} MenuListProps={{ dense: true, sx: { py: 0.5 } }} PaperProps={{ sx: { borderRadius: '8px', boxShadow: '0px 2px 8px rgba(0,0,0,0.15)' } }}>
                              <MenuItem onClick={() => handleSortSelect('name')} sx={{ fontSize: '13px', fontFamily: 'Google Sans' }}>Name</MenuItem>
                              <MenuItem onClick={() => handleSortSelect('lastModified')} sx={{ fontSize: '13px', fontFamily: 'Google Sans' }}>Last Modified</MenuItem>
                          </Menu>
                      </Box>

                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px', width: '100%' }}>
                          {itemsToDisplay.map((item: GlossaryItem) => (
                              <Card key={item.id} variant="outlined" onClick={() => handleNavigate(item.id)} sx={{ borderRadius: '16px', height: '132px', cursor: 'pointer', transition: 'box-shadow 0.2s', display: 'flex', flexDirection: 'column', '&:hover': { boxShadow: '0 4px 8px 0 rgba(60,64,67,0.15)' } }}>
                                  <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: '16px', '&:last-child': { pb: '16px' } }}>
                                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                                          {getIcon(item.type, 'medium')}
                                          <Typography variant="h6" noWrap sx={{ fontFamily: 'Google Sans', fontSize: '18px', fontWeight: 400, lineHeight: '24px', color: '#1F1F1F', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.displayName}</Typography>
                                      </Box>
                                      <Typography variant="body2" sx={{ mb: 1, fontFamily: 'Google Sans', fontSize: '14px', fontWeight: 400, lineHeight: '20px', color: '#575757', flex: 1, display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden', textOverflow: 'ellipsis', wordBreak: 'break-word' }}>{item.description ? item.description : 'No description'}</Typography>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          <AccessTime sx={{ fontSize: 16, color: '#575757' }} />
                                          <Typography variant="caption" sx={{ fontFamily: 'Google Sans Text', fontSize: '12px', fontWeight: 500, lineHeight: '16px', letterSpacing: '0.1px', color: '#575757' }}>{(() => { const { date } = getFormattedDateTimePartsByDateTime({ seconds: item.lastModified }); return date; })()}</Typography>
                                      </Box>
                                  </CardContent>
                              </Card>
                          ))}
                      </Box>
                  </>
                );
              })()}
            </Box>
          )}
          {/* TAB 3: LINKED ASSETS */}
          {isTerm && tabValue === 3 && (
            <Box sx={{ height: '100%', width: '100%' }}>
                {selectedItem.linkedAssets && selectedItem.linkedAssets.length > 0 ? (
                    <Box sx={{ 
                        height: '100%', 
                        width: '100%',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        bgcolor: '#fff',
                        display: 'flex',
                        flexDirection: 'row',
                        gap: '16px'
                    }}>
                        
                        {/* LEFT SECTION: Search + List */}
                        <Box sx={{ 
                            flex: 1, 
                            display: 'flex', 
                            flexDirection: 'column',
                            minWidth: 0,
                        }}>
                             {/* Toolbar: Search + Tune Icon */}
                             <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, pt: 1 }}>
                                <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    backgroundColor: '#fff', 
                                    border: '1px solid #DADCE0', 
                                    borderRadius: '54px', 
                                    px: 1.5, 
                                    py: 0.5, 
                                    height: '32px', 
                                    width: '309px', 
                                    boxSizing: 'border-box' 
                                }}>
                                    <Search sx={{ color: '#575757', mr: 1, fontSize: 20 }} />
                                    <InputBase 
                                        placeholder="Search linked assets" 
                                        value={contentSearchTerm} 
                                        onChange={(e) => setContentSearchTerm(e.target.value)} 
                                        sx={{ 
                                            fontFamily: 'Google Sans Text', 
                                            fontSize: '12px', 
                                            fontWeight: 500, 
                                            color: '#5E5E5E', 
                                            width: '100%', 
                                            '& ::placeholder': { opacity: 1, color: '#5E5E5E' } 
                                        }} 
                                    />
                                </Box>

                                {/* Tune Icon - Toggles Filter */}
                                <Tooltip title="Toggle Filters">
                                    <Box 
                                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '40px',
                                            height: '32px',
                                            borderRadius: '59px',
                                            cursor: 'pointer',
                                            border: isFilterOpen ? 'none' : '1px solid #DADCE0',
                                            backgroundColor: isFilterOpen ? '#E7F0FE' : 'transparent',
                                            color: isFilterOpen ? '#0E4DCA' : '#575757',
                                            transition: 'all 0.2s ease',
                                            mr: 2.5
                                        }}
                                    >
                                        <Tune sx={{ fontSize: 20 }} />
                                    </Box>
                                </Tooltip>
                            </Box>

                            {/* Resource Viewer Content */}
                            <Box sx={{ flex: 1, minHeight: 0 }}>
                                <ResourceViewer
                                    resources={filteredLinkedAssets}
                                    resourcesStatus="succeeded"
                                    resourcesTotalSize={filteredLinkedAssets.length}
                                    previewData={assetPreviewData}
                                    onPreviewDataChange={(data) => {
                                        setAssetPreviewData(data);
                                        setIsAssetPreviewOpen(!!data);
                                        if (data) setIsFilterOpen(false); // Auto-close filter on preview
                                    }}
                                    viewMode={assetViewMode}
                                    onViewModeChange={setAssetViewMode}
                                    selectedTypeFilter={null}
                                    onTypeFilterChange={() => {}}
                                    typeAliases={typeAliases}
                                    id_token={user?.token || ''}
                                    pageSize={assetPageSize}
                                    setPageSize={setAssetPageSize}
                                    requestItemStore={filteredLinkedAssets}
                                    handlePagination={() => {}}
                                    showFilters={false} 
                                    showSortBy={true}
                                    showResultsCount={true}
                                    containerStyle={{ height: '100%', border: 'none', margin: 0, backgroundColor: '#fff', width: '100%' }}
                                    contentStyle={{ minHeight: 'auto', maxHeight: '100%' }}
                                />
                            </Box>
                        </Box>

                        {/* RIGHT SECTION: Filter Card (Collapsible) */}
                        <Box sx={{ 
                            width: isFilterOpen ? 'clamp(230px, 18vw, 280px)' : '0px', 
                            minWidth: isFilterOpen ? 'clamp(230px, 18vw, 280px)' : '0px',
                            transition: 'width 0.3s ease, min-width 0.3s ease, padding 0.3s ease, opacity 0.3s ease',
                            opacity: isFilterOpen ? 1 : 0,
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            padding: isFilterOpen ? '20px' : '0px',
                            gap: '20px',
                            backgroundColor: '#FFFFFF',
                            border: isFilterOpen ? '1px solid #DADCE0' : 'none',
                            borderRadius: '16px',
                            height: '100%',
                            boxSizing: 'border-box'
                        }}>
                             <div style={{ width: '100%', height: '100%', overflowY: 'auto' }}>
                                <FilterDropdown 
                                    filters={activeFilters} 
                                    onFilterChange={(newFilters) => setActiveFilters(newFilters)} 
                                    isGlossary={true}
                                />
                             </div>
                        </Box>

                    </Box>
                ) : (
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      height: '100%', 
                      opacity: 1,
                      gap: 2
                  }}>
                      <Typography variant="body1" color="text.secondary">
                            No linked assets available for this term
                      </Typography>
                  </Box>
                )}
            </Box>
          )}
          {isTerm && tabValue === 4 && (
            <Box sx={{ height: '100%' }}>
              {filteredRelations.length === 0 ? (
                  // --- EMPTY STATE UI ---
                  <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      height: '100%', 
                      opacity: 1,
                      gap: 2 
                  }}>
                      <Typography variant="body1" color="text.secondary">
                            No synonyms or related terms available for this term
                        </Typography>
                  </Box>
              ) : (
                  <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px', mb: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#fff', border: '1px solid #dadce0', borderRadius: '24px', px: 2, py: 0.5, width: 300, height: 32 }}>
                                  <Search sx={{ color: '#5f6368', mr: 1, fontSize: 20 }} />
                                  <InputBase placeholder="Search synonyms and related terms" value={contentSearchTerm} onChange={(e) => setContentSearchTerm(e.target.value)} sx={{ fontSize: '0.875rem', width: '100%',  '& ::placeholder': { opacity: 100, color: '#5E5E5E', fontSize: 12, fontWeight: 500 } }} />
                              </Box>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                  <Chip label={`All (${relations.length})`} onClick={() => setRelationFilter('all')} sx={{ fontSize: 12, bgcolor: relationFilter === 'all' ? '#e8f0fe' : 'transparent', color: relationFilter === 'all' ? '#1967d2' : '#1F1F1F', fontWeight: relationFilter === 'all' ? 500 : 300, border: relationFilter === 'all' ? 'none' : '1px solid #dadce0' }} />
                                  <Chip label={`Synonyms (${relations.filter(r => r.type === 'synonym').length})`} onClick={() => setRelationFilter('synonym')} sx={{ fontSize: 12, bgcolor: relationFilter === 'synonym' ? '#e8f0fe' : 'transparent', color: relationFilter === 'synonym' ? '#1967d2' : '#1F1F1F', fontWeight: relationFilter === 'synonym' ? 500: 300, border: relationFilter === 'synonym' ? 'none' : '1px solid #dadce0' }} />
                                  <Chip label={`Related Terms (${relations.filter(r => r.type === 'related').length})`} onClick={() => setRelationFilter('related')} sx={{ fontSize: 12, bgcolor: relationFilter === 'related' ? '#e8f0fe' : 'transparent', color: relationFilter === 'related' ? '#1967d2' : '#1F1F1F', fontWeight: relationFilter === 'related' ? 500: 300, border: relationFilter === 'related' ? 'none' : '1px solid #dadce0' }} />
                              </Box>
                          </Box>
                          <Button onClick={handleSortClick} endIcon={<ExpandMore sx={{ color: '#1F1F1F', fontSize: 20, transform: sortAnchorEl ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />} sx={{ textTransform: 'none', color: '#1F1F1F', fontFamily: 'Product Sans', fontSize: '12px', fontWeight: 400, padding: 0, minWidth: 'auto', '&:hover': { background: 'transparent' } }}>
                              Sort by: {sortBy === 'name' ? 'Name' : 'Last Modified'}
                          </Button>
                          <Menu anchorEl={sortAnchorEl} open={Boolean(sortAnchorEl)} onClose={handleSortClose} MenuListProps={{ dense: true, sx: { py: 0.5 } }} PaperProps={{ sx: { borderRadius: '8px', boxShadow: '0px 2px 8px rgba(0,0,0,0.15)' } }}>
                              <MenuItem onClick={() => handleSortSelect('name')} sx={{ fontSize: '13px', fontFamily: 'Google Sans' }}>Name</MenuItem>
                              <MenuItem onClick={() => handleSortSelect('lastModified')} sx={{ fontSize: '13px', fontFamily: 'Google Sans' }}>Last Modified</MenuItem>
                          </Menu>
                      </Box>

                      {/* ... Keep your existing Grid ... */}
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px', width: '100%' }}>
                          {filteredRelations.map((rel) => (
                              <Card key={rel.id} onClick={() => handleNavigate(rel.id)} variant="outlined" sx={{ borderRadius: '16px', height: '132px', cursor: 'pointer', transition: 'box-shadow 0.2s', display: 'flex', flexDirection: 'column', '&:hover': { boxShadow: '0 4px 8px 0 rgba(60,64,67,0.15)' } }}>
                                  <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: '16px', '&:last-child': { pb: '16px' } }}>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden' }}>
                                              <DescriptionOutlined sx={{ color: '#F4B400', fontSize: 24, flexShrink: 0 }} />
                                              <Typography variant="h6" noWrap sx={{ fontFamily: 'Google Sans', fontSize: '18px', fontWeight: 400, lineHeight: '24px', color: '#1F1F1F', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rel.displayName}</Typography>
                                          </Box>
                                          <Chip label={rel.type === 'synonym' ? 'Synonym' : 'Related'} size="small" sx={{ height: '20px', backgroundColor: '#E7F0FE', color: '#004A77', fontFamily: 'Google Sans Text', fontWeight: 500, fontSize: '11px', borderRadius: '25px', flexShrink: 0, ml: 1 }} />
                                      </Box>
                                      <Typography variant="body2" sx={{ mb: 1, fontFamily: 'Google Sans', fontSize: '14px', fontWeight: 400, lineHeight: '20px', color: '#575757', flex: 1, display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden', textOverflow: 'ellipsis', wordBreak: 'break-word' }}>{findDescriptionById(glossaryItems, rel.id) || 'No description'}</Typography>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          <AccessTime sx={{ fontSize: 16, color: '#575757' }} />
                                          <Typography variant="caption" sx={{ fontFamily: 'Google Sans Text Medium', fontSize: '12px', fontWeight: 500, lineHeight: '16px', letterSpacing: '0.1px', color: '#575757' }}>{(() => { const { date } = getFormattedDateTimePartsByDateTime({ seconds: rel.lastModified }); return date; })()}</Typography>
                                      </Box>
                                  </CardContent>
                              </Card>
                          ))}
                      </Box>
                  </Box>
              )}
            </Box>
          )}
          {/* TAB 5: ASPECTS */}
          {isTerm && tabValue === 5 && (
            <Box sx={{ height: '100%' }}>
                {hasVisibleAspects ? (
                    <Box sx={{ 
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        background: '#ffffff',
                        overflow: 'hidden',
                        maxHeight: '100%', 
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        {/* Aspect Filter Component */}
                        <Box sx={{ flexShrink: 0, '& > div': { marginTop: '0px !important', border: 'none' } }}>
                            <AnnotationFilter
                                entry={selectedItem}
                                onFilteredEntryChange={setFilteredAnnotationEntry}
                                onCollapseAll={handleAnnotationCollapseAll}
                                onExpandAll={handleAnnotationExpandAll}
                            />
                        </Box>
                        
                        {/* Aspect List Component */}
                        <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                            <PreviewAnnotation 
                                entry={filteredAnnotationEntry || selectedItem} 
                                css={{ 
                                    border: 'none', 
                                    margin: 0,
                                    background: 'transparent',
                                    borderRadius: '0px',
                                    borderTop: '1px solid #E0E0E0',
                                    height: 'auto', 
                                    overflow: 'visible'
                                }} 
                                expandedItems={expandedAnnotations}
                                setExpandedItems={setExpandedAnnotations}
                            />
                        </Box>
                    </Box>
                ) : (
                    <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        height: '100%', 
                        opacity: 1,
                        gap: 2 
                    }}>
                        <Typography variant="body1" color="text.secondary">
                            No aspects available for this term
                        </Typography>
                    </Box>
                )}
            </Box>
          )}
        </Box>) : (
        <Box sx={{ p: 5, textAlign: 'center', opacity: 0.6 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <img src={NothingImage} alt="Select an item" style={{ width: '200px', marginBottom: '16px' }} />
              <Typography>Select a glossary item</Typography>
          </Box>
        </Box>
  )}
      </Paper>
      {/* 3. RESOURCE PREVIEW CARD */}
      {isTerm && tabValue === 3 && (
        <Paper
          elevation={0}
          sx={{
            width: isAssetPreviewOpen ? 'clamp(300px, 22vw, 360px)' : '0px',
            minWidth: isAssetPreviewOpen ? 'clamp(300px, 22vw, 360px)' : '0px',
            
            height: 'calc(100vh - 110px)', 
            borderRadius: '24px', 
            backgroundColor: '#fff',
            border: 'transparent',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'visible',
            flexShrink: 0,
            transition: 'width 0.3s ease-in-out, min-width 0.3s ease-in-out, opacity 0.3s ease-in-out, margin-left 0.3s ease-in-out',
            marginLeft: isAssetPreviewOpen ? '2%' : 0,
            opacity: isAssetPreviewOpen ? 1 : 0,
            borderWidth: isAssetPreviewOpen ? undefined : 0
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
            id_token={user?.token || ''}
            isGlossary={true}
          />
        </Paper>
      )}
    </Box>
  );
};

export default Glossaries;