import React, { useState, useEffect } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Typography,
  Box,
  FormControlLabel,
  Checkbox,
  // Tooltip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckIcon from '@mui/icons-material/Check';
import EditNoteIcon from '../../assets/svg/edit_note.svg';
import BigQueryIcon from '../../assets/svg/BigQuery.svg';
import AnalyticsHubIcon from '../../assets/svg/analytics-hub.svg';
import CloudSQLIcon from '../../assets/svg/cloud-sql.svg';
import DataformIcon from '../../assets/svg/dataform_logo.svg';
import DatabaseIcon from '../../assets/svg/database_icon.svg';
import OthersIcon from '../../assets/svg/others.svg';
import CloudBigTableIcon from '../../assets/svg/CloudBigTable.svg';
import CloudPubSubIcon from '../../assets/svg/cloudpub_sub.svg';
import CloudSpannerIcon from '../../assets/svg/CloudSpanner.svg';
import CloudStorageIcon from '../../assets/svg/CloudStorage.svg';
import DataplexIcon from '../../assets/svg/Dataplex.svg';
import DataprocIcon from '../../assets/svg/Dataproc.svg';
import VertexIcon from '../../assets/svg/vertex.svg';
import BucketIcon from '../../assets/svg/bucket_icon.svg';
import ClusterIcon from '../../assets/svg/cluster_icon.svg';
import CodeAssetIcon from '../../assets/svg/code_asset_icon.svg';
import ConnectionIcon from '../../assets/svg/connection_icon.svg';
import DashboardIcon from '../../assets/svg/dashboard_icon.svg';
import DashboardElementIcon from '../../assets/svg/dashboard_element_icon.svg';
import DataExchangeIcon from '../../assets/svg/data_exchange_icon.svg';
import DataStreamIcon from '../../assets/svg/data_stream_icon.svg';
import DatabaseSchemaIcon from '../../assets/svg/database_schema_icon.svg';
import DatasetIcon from '../../assets/svg/dataset_icon.svg';
import ExploreIcon from '../../assets/svg/explore_icon.svg';
import FeatureGroupIcon from '../../assets/svg/feature_group_icon.svg';
import FeatureOnlineStoreIcon from '../../assets/svg/feature_online_store_icon.svg';
import ViewIcon from '../../assets/svg/view_icon.svg';
import FilesetIcon from '../../assets/svg/fileset_icon.svg';
import FolderIcon from '../../assets/svg/folder_icon.svg';
import FunctionIcon from '../../assets/svg/function_icon.svg';
import GlossaryIcon from '../../assets/svg/glossary_icon.svg';
import GlossaryCategoryIcon from '../../assets/svg/glossary_category_icon.svg';
import ListingIcon from '../../assets/svg/listing_icon.svg';
import LookIcon from '../../assets/svg/look_icon.svg';
import ModelIcon from '../../assets/svg/model_icon.svg';
import RepositoriesIcon from '../../assets/svg/repositories_icon.svg';
import GenericIcon from '../../assets/svg/generic_icon.svg';
import SchedulerIcon from '../../assets/svg/scheduler_icon.svg';
import TableIcon from '../../assets/svg/table_icon.svg';
import { useAuth } from '../../auth/AuthProvider';
import FilterAnnotationsMultiSelect from './FilterAnnotationsMultiSelect';
import FilterSubAnnotationsPanel from './FilterSubAnnotationsPanel';
import axios from 'axios';
import { URLS } from '../../constants/urls';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../../app/store';
import { getProjects } from '../../features/projects/projectsSlice';

/**
 * @file FilterDropdown.tsx
 * @description
 * This component renders the main filter sidebar for the application. It displays
 * filter options grouped into expandable accordions: "Aspects" (Annotations),
 * "Assets", "Products", and "Projects".
 *
 * Key functionalities include:
 * 1.  **Filter Selection**: Allows users to select/deselect filters via checkboxes.
 * 2.  **Parent Communication**: Uses the `onFilterChange` prop to notify the parent
 * component of any changes to the selected filters.
 * 3.  **Redux Integration**:
 * - Reads `searchTerm` and `searchType` from the Redux store.
 * - Automatically selects "Asset" filters if the `searchTerm` matches an asset name.
 * - Automatically selects a "Product" filter if the `searchType` is set to a
 * specific product.
 * - Dispatches filter changes back to the Redux store.
 * 4.  **Dynamic Data**: Populates "Aspects" and "Projects" from the `user.appConfig`
 * provided by the `useAuth` hook.
 * 5.  **Advanced Filter Modals**:
 * - Renders a "See...more" button for categories with many items, which opens
 * the `FilterAnnotationsMultiSelect` modal.
 * - For "Aspects", it shows an "edit" icon that opens the
 * `FilterSubAnnotationsPanel`, allowing for more granular,
 * field-level filtering. This panel fetches sub-annotation data via an API call.
 * 6.  **Iconography**: Uses helper functions (`getProductIcon`, `getAssetIcon`) to
 * display appropriate icons for "Product" and "Asset" filter items.
 *
 * @param {FilterProps} props - The props for the component.
 * @param {any[]} [props.filters] - An optional array of the currently selected
 * filter objects, used to initialize and sync the component's state.
 * @param {(selectedFilters: any[]) => void} props.onFilterChange - A callback
 * function that is invoked with the complete array of selected filters whenever
 * a selection is made, cleared, or modified.
 *
 * @returns {React.ReactElement} A React element rendering the filter sidebar UI.
 * Returns an empty fragment (`<></>`) during a brief loading state after
 * clearing filters.
 */

//interface for the filter dropdown Props
interface FilterProps {
  filters?: any[];
  onFilterChange: (selectedFilters: any[]) => void;
}

// Function to get icon for product
const getProductIcon = (productName: string) => {
  switch (productName) {
    case 'Analytics Hub':
      return AnalyticsHubIcon;
    case 'BigQuery':
      return BigQueryIcon;
    case 'Cloud BigTable':
      return CloudBigTableIcon;
    case 'Cloud Pub/Sub':
      return CloudPubSubIcon;
    case 'Cloud Spanner':
      return CloudSpannerIcon;
    case 'Cloud Storage':
      return CloudStorageIcon;
    case 'Cloud SQL':
      return CloudSQLIcon;
    case 'Dataform':
      return DataformIcon;
    case 'Dataplex':
      return DataplexIcon;
    case 'Dataplex Universal Catalog':
      return DataplexIcon;
    case 'Dataproc Metastore':
      return DataprocIcon;
    case 'Vertex AI':
      return VertexIcon;
    default:
      return OthersIcon;
  }
};

const getAssetIcon = (assetName: string) => {
  switch (assetName) {
    case 'Bucket':
      return BucketIcon;
    case 'Cluster':
      return ClusterIcon;
    case 'Code asset':
      return CodeAssetIcon;
    case 'Connection':
      return ConnectionIcon;
    case 'Dashboard':
      return DashboardIcon;
    case 'Dashboard element':
      return DashboardElementIcon;
    case 'Data exchange':
      return DataExchangeIcon;
    case 'Data source connection':
      return ConnectionIcon;
    case 'Data stream':
      return DataStreamIcon;
    case 'Database':
      return DatabaseIcon;
    case 'Database schema':
      return DatabaseSchemaIcon;
    case 'Dataset':
      return DatasetIcon;
    case 'Explore':
      return ExploreIcon;
    case 'Feature group':
      return FeatureGroupIcon;
    case 'Feature online store':
      return FeatureOnlineStoreIcon;
    case 'Feature view':
      return ViewIcon;
    case 'Fileset':
      return FilesetIcon;
    case 'Folder':
      return FolderIcon;
    case 'Function':
      return FunctionIcon;
    case 'Glossary':
      return GlossaryIcon;
    case 'Glossary Category':
      return GlossaryCategoryIcon;
    case 'Glossary Term':
      return GlossaryIcon;
    case 'Listing':
      return ListingIcon;
    case 'Look':
      return LookIcon;
    case 'Model':
      return ModelIcon;
    case 'Repository':
      return RepositoriesIcon;
    case 'View':
      return ViewIcon;
    case 'Resource':
      return GenericIcon;
    case 'Routine':
      return SchedulerIcon;
    case 'Table':
      return TableIcon;
    default:
      return GenericIcon;
  }
};

// FilterDropdown component
const FilterDropdown: React.FC<FilterProps> = ({ filters , onFilterChange }) => {
  // const [anchorEl, setAnchorEl] = useState(null);
  // const [selectedCategory, setSelectedCategory] = useState(null);
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const searchTerm = useSelector((state: any) => state.search.searchTerm);
  const searchType = useSelector((state: any) => state.search.searchType);
  const projectsLoaded = useSelector((state: any) => state.projects.isloaded);
  const projectsList = useSelector((state: any) => state.projects.items);
  const [loading, setLoading] = useState(false);
  let annotations:any = {
    title: 'Aspects',
    items: [
    ],
    defaultExpanded: false,
  };
  let assets:any = {
    title: 'Assets',
    items: [
      {
        "name": "Bucket",
        "type": "typeAliases"
      },
      {
        "name": "Cluster",
        "type": "typeAliases"
      },
      {
        "name": "Code asset",
        "type": "typeAliases"
      },
      {
        "name": "Connection",
        "type": "typeAliases"
      },
      {
        "name": "Dashboard",
        "type": "typeAliases"
      },
      {
        "name": "Dashboard element",
        "type": "typeAliases"
      },
      {
        "name": "Data exchange",
        "type": "typeAliases"
      },
      {
        "name": "Data source connection",
        "type": "typeAliases"
      },
      {
        "name": "Data stream",
        "type": "typeAliases"
      },
      {
        "name": "Database",
        "type": "typeAliases"
      },
      {
        "name": "Database schema",
        "type": "typeAliases"
      },
      {
        "name": "Dataset",
        "type": "typeAliases"
      },
      {
        "name": "Explore",
        "type": "typeAliases"
      },
      {
        "name": "Feature group",
        "type": "typeAliases"
      },
      {
        "name": "Feature online store",
        "type": "typeAliases"
      },
      {
        "name": "Feature view",
        "type": "typeAliases"
      },
      {
        "name": "Fileset",
        "type": "typeAliases"
      },
      {
        "name": "Folder",
        "type": "typeAliases"
      },
      {
        "name": "Function",
        "type": "typeAliases"
      },
      {
        "name": "Glossary",
        "type": "typeAliases"
      },
      {
        "name": "Glossary Category",
        "type": "typeAliases"
      },
      {
        "name": "Glossary Term",
        "type": "typeAliases"
      },
      {
        "name": "Listing",
        "type": "typeAliases"
      },
      {
        "name": "Look",
        "type": "typeAliases"
      },
      {
        "name": "Model",
        "type": "typeAliases"
      },
      {
        "name": "Repository",
        "type": "typeAliases"
      },
      {
        "name": "Resource",
        "type": "typeAliases"
      },
      {
        "name": "Routine",
        "type": "typeAliases"
      },
      {
        "name": "Service",
        "type": "typeAliases"
      },
      {
        "name": "Table",
        "type": "typeAliases"
      },
      {
        "name": "View",
        "type": "typeAliases"
      },
      {
        "name": "Other",
        "type": "typeAliases"
      }
    ],
    defaultExpanded: false,
  };
  let products:any = {
    title: 'Products',
    items: [
      {
        "name": "Analytics Hub",
        "type": "system"
      },
      {
        "name": "BigQuery",
        "type": "system"
      },
      {
        "name": "Cloud BigTable",
        "type": "system"
      },
      {
        "name": "Cloud Pub/Sub",
        "type": "system"
      },
      {
        "name": "Cloud Spanner",
        "type": "system"
      },
      {
        "name": "Cloud SQL",
        "type": "system"
      },
      {
        "name": "Dataform",
        "type": "system"
      },
      {
        "name": "Dataplex Universal Catalog",
        "type": "system"
      },
      {
        "name": "Dataproc Metastore",
        "type": "system"
      },
      {
        "name": "Vertex AI",
        "type": "system"
      },
      {
        "name": "Others",
        "type": "system"
      }
    ],
    defaultExpanded: false,
  };
  
  let projects:any = {
    title: 'Projects',
    items: [],
    defaultExpanded: false,
  };
  if(annotations && user?.appConfig && user?.appConfig.aspects && Array.isArray(user?.appConfig.aspects)){
    annotations.items = user?.appConfig.aspects.map((aspect:any) => ({
      name: aspect.dataplexEntry.entrySource.displayName || (aspect.dataplexEntry.name ? aspect.dataplexEntry.name.split('/').pop() : ''),
      type: "aspectType",
      data: aspect.dataplexEntry
    }));
  }
  if(projects && user?.appConfig && user?.appConfig.projects && Array.isArray(user?.appConfig.projects)){
    let plist:any = projectsLoaded ? projectsList : user?.appConfig.projects;
    let p:any = plist.map((project:any) => ({
      name: project.projectId,
      type: "project",
      data: {}
    }));

    projects.items = [
      ...p, 
      {
        name: 'Others',
        type: "project",
        data: {}
      }
    ];
  }


  const [filterData, setFilterData] = useState<any[]>([annotations, assets, products, projects]);

  const [showSubAnnotationsPanel, setShowSubAnnotationsPanel] = useState(false);
  const [selectedAnnotationForSubPanel, setSelectedAnnotationForSubPanel] = useState<string>('');
  const [showMultiSelect, setShowMultiSelect] = useState(false);
  const [currentFilterType, setCurrentFilterType] = useState<string>('');
  const [multiselectPosition, setMultiselectPosition] = useState<{ top: number; left: number } | null>(null);
  const [selectedSubAnnotations, setSelectedSubAnnotations] = useState<any[]>([]);
  const [clickPosition, setClickPosition] = useState<{ top: number; right: number } | undefined>(undefined);
  const [subAnnotationData, setSubAnnotationData] = useState<any[]>([]);
  const [subAnnotationsloaded, setSubAnnotationsloaded] = useState(false);

  const [selectedFilters, setSelectedFilters] = useState<any[]>(filters ?? []);

  useEffect(() => {
    if(!projectsLoaded) {
      dispatch(getProjects({ id_token: user?.token }));
    }
  }, []);

  useEffect(() => {
    if(projectsLoaded){
      let plist:any = projectsList;
      let p:any = plist.map((project:any) => ({
        name: project.projectId,
        type: "project",
        data: {}
      }));
      setFilterData((prevData:any) => prevData.map((filterCategory:any) => {
        if(filterCategory.title === 'Projects'){
          return { ...filterCategory, items: [...p, { name: 'Others', type: "project", data: {} }] };
        }
        return filterCategory;
      }));
    }
  }, [projectsLoaded]);
  // Keep internal selection in sync with parent-provided filters
  useEffect(() => {
    setSelectedFilters(filters ?? []);
  }, [filters]);

  // Auto-select asset filters when search term matches asset names
  useEffect(() => {
    if (searchTerm && searchType === 'All' && searchTerm.length >= 3) {
      const matchingAssets = assets.items.filter((asset: any) => 
        asset.name.toLowerCase() === (searchTerm.toLowerCase())
      );
      
      if (matchingAssets.length > 0) {
        // Get current asset filters
        const currentAssetFilters = selectedFilters.filter((f: any) => f.type === 'typeAliases');
        
        // Add matching assets that aren't already selected
        const newAssetFilters = matchingAssets
          .filter((asset: any) => !currentAssetFilters.some((f: any) => f.name === asset.name))
          .map((asset: any) => ({
            name: asset.name,
            type: asset.type,
            data: asset.data
          }));
        
        if (newAssetFilters.length > 0) {
          const updatedFilters = [...selectedFilters, ...newAssetFilters];
          setSelectedFilters(updatedFilters);
          onFilterChange(updatedFilters);
        }
      }
    }
  }, [searchTerm, searchType, assets.items, selectedFilters, onFilterChange]);

  // Clear asset filters when search term is cleared or search type changes from 'All'
  useEffect(() => {
    if (!searchTerm || searchType !== 'All') {
      const nonAssetFilters = selectedFilters.filter((f: any) => f.type !== 'typeAliases');
      if (nonAssetFilters.length !== selectedFilters.length) {
        setSelectedFilters(nonAssetFilters);
        onFilterChange(nonAssetFilters);
      }
    }
  }, [searchTerm, searchType, selectedFilters, onFilterChange]);

  // Auto-select product when specific product is selected from search bar
  useEffect(() => {
    if (searchType && searchType !== 'All') {
      // Find the matching product in the products list
      const matchingProduct = products.items.find((product: any) => 
        product.name === searchType
      );
      
      if (matchingProduct) {
        // Get current product filters
        const currentProductFilters = selectedFilters.filter((f: any) => f.type === 'system');
        
        // Check if this product is already selected
        const isAlreadySelected = currentProductFilters.some((f: any) => f.name === searchType);
        
        if (!isAlreadySelected) {
          // Remove any existing product filters and add the new one
          const nonProductFilters = selectedFilters.filter((f: any) => f.type !== 'system');
          const newProductFilter = {
            name: matchingProduct.name,
            type: matchingProduct.type,
            data: matchingProduct.data
          };
          
          const updatedFilters = [...nonProductFilters, newProductFilter];
          setSelectedFilters(updatedFilters);
          onFilterChange(updatedFilters);
        }
      }
    }
  }, [searchType, products.items, selectedFilters, onFilterChange]);

  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    'Annotations': false,
    'Assets': false,
    'Products': false,
    'Projects': false
  });

  // Auto-expand accordions when search term exists or specific product is selected

  const handleCheckboxChange = (filter: any) => {
    const updatedFilters = selectedFilters.some(item => item.name === filter.name )
      ? selectedFilters.filter((f) => f.name !== filter.name)
      : [...selectedFilters, filter];
      console.log("updated filter" ,updatedFilters);

    setSelectedFilters(updatedFilters);
    onFilterChange(updatedFilters); // Notify parent
    dispatch({ type: 'search/setSearchFilters', payload: { searchFilters: updatedFilters } });
    
    // Sync with search type if this is a Products filter
    // if (filter.type === 'system') {
    //   const systemFilters = updatedFilters.filter((f: any) => f.type === 'system');
    //   if (systemFilters.length === 0) {
    //     // No system filters selected, set search type to 'All'
    //     dispatch({ type: 'search/setSearchType', payload: { searchType: 'All' } });
    //   } else if (systemFilters.length === 1) {
    //     // One system filter selected, set search type to that filter
    //     dispatch({ type: 'search/setSearchType', payload: { searchType: systemFilters[0].name } });
    //   }
    //   // If multiple system filters are selected, we don't change the search type
    //   // as the dropdown only supports single selection
    // }
    if (filter.type === 'system' && filter.name === "BigQuery") {
      if (!updatedFilters.find(item => item.name === filter.name)){
        dispatch({ type: 'search/setSearchType', payload: { searchType: 'All' } });
      }
    }
  };


  const handleAccordionChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedSections(prev => ({
      ...prev,
      [panel]: isExpanded
    }));
  };

  // Removed useEffect to prevent automatic filter changes on mount/unmount

  const handleFilterClear = () => {
    setSelectedFilters([]);
    onFilterChange([]); // Notify parent
    dispatch({ type: 'search/setSearchFilters', payload: { searchFilters: [] } });
    dispatch({ type: 'search/setSearchType', payload: { searchType: 'All' } });
    setLoading(true);
    setTimeout(() => {
      setLoading(false);  
    }, 100); // Simulate loading delay
  };


  const handleViewAllItems = (filterType: string, event: React.MouseEvent) => {
    setCurrentFilterType(filterType);
    
    // Get the position of the clicked accordion to position the modal adjacent to it
    const accordionElement = event.currentTarget.closest('.MuiAccordion-root');
    if (accordionElement) {
      const rect = accordionElement.getBoundingClientRect();
      const headerElement = accordionElement.querySelector('.MuiAccordionSummary-root');
      const headerRect = headerElement ? headerElement.getBoundingClientRect() : rect;
      
      setMultiselectPosition({
        top: ((headerRect.top + window.scrollY + 341) > window.innerHeight) 
          ? window.innerHeight - 360
          : headerRect.top + window.scrollY, // Align with accordion header
        left: rect.right + 16 // Position to the right of the accordion with some spacing
      });
    }
    
    setShowMultiSelect(true);
  };


  const handleMultiSelectChange = (selectedItems: string[]) => {
    console.log('Generic multiselect change:', selectedItems, 'for filter:', currentFilterType);
    
    // Find the current filter data
    const currentFilter = filterData.find((f: any) => f.title === currentFilterType);
    if (!currentFilter) return;

    // Convert selected items to filter format
    const newFilters = selectedItems.map(item => ({
      name: item,
      type: currentFilter.items[0]?.type || 'typeAliases' // Use the type from the first item
    }));

    // Remove existing filters of this type
    const filteredSelectedFilters = selectedFilters.filter((sf: any) => sf.type !== (currentFilter.items[0]?.type || 'typeAliases'));
    
    // Add new filters
    const updatedFilters = [...filteredSelectedFilters, ...newFilters];
    
    setSelectedFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const handleCloseMultiSelect = () => {
    setShowMultiSelect(false);
    setCurrentFilterType('');
    setMultiselectPosition(null);
  };

  // Mock data for sub-annotations - in real app this would come from API
  const getSubAnnotationsForAnnotation = async (annotationData: any) => {
    axios.defaults.headers.common['Authorization'] = `Bearer ${user?.token ?? ''}`;
    
    const response = await axios.post(URLS.API_URL + URLS.GET_ASPECT_DETAIL, {
      name:annotationData.entrySource.resource
    });

    const data = await response.data;
    console.log('filter subannotations', data);
    
    // Transform recordFields to include type information
    // For demo purposes, create sample fields that match the ideal design
    const sampleFields = [
      { name: 'Temaplate_Field', type: 'string' }
    ];
    
    const transformedFields = data.metadataTemplate.recordFields?.map((r: any) => ({
      name: String(r.name || ''),
      type: r.type || 'string', // Default to string if type is not specified
      enumValues: r.enumValues ? r.enumValues.map((val: any) => {
        // Handle object values properly
        if (typeof val === 'object' && val !== null) {
          return val.name || val.value || val.label || JSON.stringify(val);
        }
        return String(val);
      }) : undefined
    })) || sampleFields;
    
    setSubAnnotationData(transformedFields);
    setSubAnnotationsloaded(true);
  };

  const handleEditNoteClick = (annotationName: string, data:any, event: React.MouseEvent) => {
    setSelectedAnnotationForSubPanel(annotationName);
    setSubAnnotationData([]);
    setSubAnnotationsloaded(false);
    getSubAnnotationsForAnnotation(data);
    
    // Check if the parent annotation is already selected
    const isParentSelected = selectedFilters.some(filter => 
      filter.name === annotationName && filter.type === 'aspectType'
    );
    
    // If parent is selected, initialize with some default sub-annotations (or keep empty)
    // In a real app, you might want to load previously selected sub-annotations from an API
    setSelectedSubAnnotations(isParentSelected ? [] : []); // For now, always start empty
    
    const rect = event.currentTarget.getBoundingClientRect();
    setClickPosition({ top: rect.top, right: rect.right });

    setShowSubAnnotationsPanel(true);
  };

  const handleSubAnnotationsChange = (selectedSubAnnotations: any[]) => {
    setSelectedSubAnnotations(selectedSubAnnotations);
    
    // Don't auto-check parent annotation - this will be handled by Apply button
    console.log('Sub-annotations changed for', selectedAnnotationForSubPanel, ':', selectedSubAnnotations);
  };

  const handleCloseSubAnnotationsPanel = () => {
    setShowSubAnnotationsPanel(false);
    setSelectedAnnotationForSubPanel('');
    setClickPosition(undefined);
  };

  const handleSubAnnotationsApply = (appliedSubAnnotations: any[]) => {
    // When Apply button is clicked in FilterSubAnnotationsPanel, check the parent annotation
    if (appliedSubAnnotations.length > 0) {
      const parentAnnotation = {
        name: selectedAnnotationForSubPanel,
        type: 'aspectType'
      };
      
      // Add parent annotation to selected filters if not already present
      if (!selectedFilters.some(filter => filter.name === selectedAnnotationForSubPanel && filter.type === 'aspectType')) {
        const updatedFilters = [...selectedFilters, parentAnnotation];
        setSelectedFilters(updatedFilters);
        onFilterChange(updatedFilters);
      }
    } else {
      // If no sub-annotations are applied, remove the parent annotation
      const updatedFilters = selectedFilters.filter(filter => 
        !(filter.name === selectedAnnotationForSubPanel && filter.type === 'aspectType')
      );
      setSelectedFilters(updatedFilters);
      onFilterChange(updatedFilters);
    }
    
    // Close the panel
    handleCloseSubAnnotationsPanel();
  };

  // Debug useEffect to monitor selectedFilters changes
  useEffect(() => {
    console.log('selectedFilters changed:', selectedFilters);
  }, [selectedFilters]);

  // const handleMenuOpen = (event:any) => {
  //   setAnchorEl(event.currentTarget);
  // };

  // const handleMenuClose = () => {
  //   setAnchorEl(null);
  // };

  // const handleMenuItemClick = (category:any) => {
  //   setSelectedCategory(category);
  //   handleMenuClose();
  //   // Apply the filter logic here
  // };

  return !loading ? (
    <Box
      sx={{
        overflowY: "auto",
        scrollbarWidth: "none", // Firefox
        "&::-webkit-scrollbar": { display: "none" }, // Chrome/Safari
        "-ms-overflow-style": "none", // IE and Edge
        maxHeight: "100%"
      }}
    >
      <Box sx={{ position: 'relative' }}>
      <Box sx={{ flexGrow: 1, flexShrink: 1 }} style={{padding:"0.3125rem 0 0.3125rem 0.3125rem", marginTop:"1.25rem", paddingBottom:"1.5625rem", display: "flex", flexDirection: "column", flex: "0 0 auto"}}>
        <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            paddingRight: 0,
            flex: "1 1 auto"
        }}>
            <Typography sx={{fontWeight:"500", fontSize:"1rem", color:"#1F1F1F", flex: "0 1 auto", fontFamily: "Google sans text, sans-serif"}}>Filters</Typography>
            <Button onClick={handleFilterClear} 
              disabled={selectedFilters.length === 0}
              sx={{
                fontFamily: '"Google Sans Text", sans-serif',
                fontWeight:"700", 
                color:"#1f1f1f", 
                fontSize:"0.75rem",
                fontStyle:"normal", 
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0.25rem",
                textTransform: "none",
                minWidth: "auto",
                height: "2rem",
                flex: "0 0 auto",
                '&.Mui-disabled': {
                  color: '#1f1f1f',
                  opacity: '30%',
                },
            }}>Clear</Button>
        </div>
      </Box>
      <Box
        sx={{
          height: '1px',
          backgroundColor: '#E0E0E0',
          marginLeft: '5px',
          marginRight: '3.5px',
        }}
      />
      <div style={{
        fontSize:"0.75rem", 
        display: "flex", 
        flexDirection: "column", 
        flex: "1 1 auto"
      }}>
        {filterData.map((filter:any) => 
          (
            <Accordion 
              key={filter.title} 
              expanded={expandedSections[filter.title] || filter.defaultExpanded}
              onChange={handleAccordionChange(filter.title)}
              style={{background : "none", boxShadow:"none", margin: 0, flex: "0 0 auto"}}
              disableGutters
              sx={{
                    background: "none",
                    boxShadow: "none",
                    '&:before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      backgroundColor: '#E0E0E0',
                      height: '1px',
                      left: '5px',
                      right: '3.5px',
                      opacity: 1,
                    },
                    borderTop: 'none',
                  }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={filter.title+"-content"}
                id={filter.title+"-header"}
                sx={{ padding:"0rem 0.3215rem 0rem 0.65rem", flex: "0 0 auto", minHeight: 'auto',
                  '& .MuiAccordionSummary-content': {
                  lineHeight: '48px',
                  margin: "14px -4.8px"
                },
                '& .MuiAccordionSummary-expandIconWrapper': {
                  marginRight: '-3px',
                },
                  '&.Mui-expanded': { 
                    minHeight: 'auto',
                    '& .MuiAccordionSummary-content': {
                   lineHeight: '48px',
                   margin: "14px -4.8px"
                  }
               }}}
              >
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  flex: "0 1 auto",
                }}>
                  <Typography component="span" 
                    sx={{fontWeight:"500", fontSize:"14px", lineHeight:"20px", color:"#1F1F1F", fontStyle:"Regular"}}>
                      {filter.title}
                  </Typography>
                </div>
              </AccordionSummary>
              <AccordionDetails sx={{
                paddingTop: 0,                 
                paddingBottom: "0.5rem",       
                paddingLeft: "0.5rem",         
                paddingRight: "0.5rem",
                flex: "1 1 auto",
                overflowY: "hidden",
                color:"#1F1F1F",
                fontWeight:"400",
                fontSize:"0.75rem",
              }}>
                {
                  (filter.title === 'Assets' || filter.title === 'Products' ? 
                    // Sort assets and products to show selected items first
                    filter.items : 
                    filter.items.slice(0, 10)
                  ).map((item:any) => (
                    <div key={`${filter.title}-${item.name}`} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      position: 'relative',
                      flex: "0 0 auto",
                      marginBottom: '0.125rem',
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        flex: '1 1 auto',
                        paddingLeft: '0.22rem',
                      }}>
                        <FormControlLabel 
                          control={
                          <Checkbox 
                            checked={selectedFilters.some(i => i.name === item.name && i.type === item.type)} 
                            icon={
                              <Box sx={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '4px',
                                border: '2px solid var(--Text-Secondary, #575757)',
                                opacity: 1,
                              }} />
                            }
                            checkedIcon={
                              <Box sx={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '4px',
                                border: '2px solid #0E4DCA',
                                backgroundColor: '#0E4DCA',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}>
                                <CheckIcon sx={{ fontSize: '14px', color: '#FFFFFF' }} />
                              </Box>
                            }
                            sx={{
                              padding: '0.25rem',
                              marginRight: '8px',
                              '& .MuiSvgIcon-root': {
                                width: '18px',
                                height: '18px',
                              },
                            }}
                          />}
                          label={
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              flex: '1 1 auto'
                            }}>
                              {filter.title === 'Products' && getProductIcon(item.name) && (
                                <img 
                                  src={getProductIcon(item.name)!} 
                                  alt={item.name} 
                                  style={{
                                    width: '1.25rem',
                                    height: '1.25rem',
                                    flex: '0 0 auto'
                                  }}
                                />
                              )}
                              {filter.title === 'Assets' && getAssetIcon(item.name) && (
                                <img 
                                  src={getAssetIcon(item.name)!} 
                                  alt={item.name} 
                                  style={{
                                    width: '1.25rem',
                                    height: '1.25rem',
                                    flex: '0 0 auto',
                                    opacity:1,
                                  }}
                                />
                              )}
                              {/* <Tooltip title={item.name} placement="top" arrow> */}
                                <span style={{
                                  flex: '1 1 auto',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  maxWidth: '8rem',
                                  fontSize: '0.75rem',
                                  color: '#1F1F1F',
                                  fontWeight: '400',
                                }}>
                                  {item.name}
                                </span>
                              {/* </Tooltip> */}
                            </div>
                          }
                          sx={{
                            '& .MuiFormControlLabel-label': {
                              fontWeight: '500' ,
                              color: '#4c4c4c' ,
                              fontSize: '0.75rem',
                              display: 'flex',
                              alignItems: 'center'
                            }
                          }}
                          onChange={() => handleCheckboxChange(item)}
                          style={{ flex: '1 1 auto' }}
                        />
                      </div>
                      {filter.title === 'Aspects' && (
                        <img 
                          src={EditNoteIcon} 
                          alt="Edit Note" 
                          style={{
                            width: '1.25rem',
                            height: '1.25rem',
                            position: 'absolute',
                            right: 0,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            cursor: 'pointer',
                            flex: '0 0 auto'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditNoteClick(item.name,item.data, e);
                          }}
                        />
                      )}
                    </div>
                  ))
                }
                {(filter.title !== 'Assets' && filter.title !== 'Products' && filter.items.length > 10) && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    padding: 0,
                    flex: '0 0 auto'
                  }}>
                    <Button
                      onClick={(e) => handleViewAllItems(filter.title, e)}
                      sx={{
                        color: '#0E4DCA',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        textTransform: 'none',
                        padding: '0.25rem 0.5rem',
                        minWidth: 'auto',
                        flex: '0 0 auto',
                        '&:hover': {
                          backgroundColor: 'transparent',
                          textDecoration: 'underline'
                        }
                      }}
                    >
                      See {filter.items.length - 10} more
                    </Button>
                  </div>
                )}
              </AccordionDetails>
            </Accordion>
          )
        )}
      </div>

       {/* Other Accordions for different filter types */}


    {/* MultiSelect Modal for all filter types */}
    {showMultiSelect && currentFilterType && multiselectPosition && (
      <FilterAnnotationsMultiSelect
        options={filterData.find((f:any) => f.title === currentFilterType)?.items.map((item:any) => item.name) || []}
        value={selectedFilters.filter((sf:any) => sf.type === (filterData.find((f:any) => f.title === currentFilterType)?.items[0]?.type || 'typeAliases')).map((sf:any) => sf.name)}
        onChange={handleMultiSelectChange}
        onClose={handleCloseMultiSelect}
        isOpen={showMultiSelect}
        filterType={currentFilterType}
        position={multiselectPosition}
      />
    )}

      {/* Sub-Annotations Panel */}
      {showSubAnnotationsPanel && (
        <FilterSubAnnotationsPanel
          annotationName={selectedAnnotationForSubPanel}
          subAnnotations={subAnnotationData}
          subAnnotationsloader={!subAnnotationsloaded}
          selectedSubAnnotations={selectedSubAnnotations}
          onSubAnnotationsChange={handleSubAnnotationsChange}
          onSubAnnotationsApply={handleSubAnnotationsApply}
          onClose={handleCloseSubAnnotationsPanel}
          isOpen={showSubAnnotationsPanel}
          clickPosition={clickPosition}
        />
      )}
    </Box>
    </Box>
  ) : (<></>);
}

export default FilterDropdown;