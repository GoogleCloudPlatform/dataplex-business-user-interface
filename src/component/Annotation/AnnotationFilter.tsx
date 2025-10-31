import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Menu,
  MenuItem,
  ListItemText,
  Checkbox,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment
} from '@mui/material';
import { 
  FilterList, 
  Close, 
  UnfoldLess, 
  UnfoldMore  
} from '@mui/icons-material';

/**
 * @file AnnotationFilter.tsx
 * @summary Renders a filter bar for a data entry's "aspects" (annotations).
 *
 * @description
 * This component provides a UI for filtering a list of aspects (annotations)
 * associated with a data entry. It offers two primary filtering mechanisms:
 *
 * 1.  **Text Search**: A `TextField` allows users to type and filter aspect names
 * in real-time.
 * 2.  **Dropdown Filter**: A filter icon button opens a `Menu` that allows
 * users to select a property (e.g., "Name") and then check specific
 * aspect names to include in the filter.
 *
 * The component manages the filter state internally and displays active filters
 * as "chips" below the search bar. When filters are applied (either text or
 * dropdown), it computes a `filteredEntry` object containing only the
 * aspects that match the filter criteria (plus essential aspects like schema,
 * overview, etc., which are always included).
 *
 * This `filteredEntry` is then passed back to the parent component via the
 * `onFilteredEntryChange` callback.
 *
 * Additionally, the component includes buttons to trigger `onCollapseAll` and
 * `onExpandAll` functions, which are passed in as props. An expand/collapse
 * icon is shown in the text field when it's empty, and a clear text icon
 * (`Close`) is shown when it's not.
 *
 * @param {object} props - The props for the AnnotationFilter component.
 * @param {any} props.entry - The full data entry object, which contains
 * the `aspects` to be filtered.
 * @param {(filteredEntry: any) => void} props.onFilteredEntryChange - Callback
 * function that is invoked whenever the filter changes, passing the newly
 * filtered entry object as an argument.
 * @param {() => void} props.onCollapseAll - Callback function to be executed
 * when the "Collapse All" button is clicked.
 * @param {() => void} props.onExpandAll - Callback function to be executed
 * when the "Expand All" button is clicked.
 * @param {any} [props.sx] - Optional Material-UI `sx` prop to apply custom
 * styles to the main container `Box`.
 *
 * @returns {JSX.Element} The rendered React component for the annotation
 * filter bar and its associated filter menu.
 */

interface AnnotationFilterProps {
  entry: any;
  onFilteredEntryChange: (filteredEntry: any) => void;
  onCollapseAll: () => void; 
  onExpandAll: () => void;  
  sx?: any;
}

const AnnotationFilter: React.FC<AnnotationFilterProps> = ({
  entry,
  onFilteredEntryChange,
  onCollapseAll,
  onExpandAll,
  sx
}) => {
  const [filterText, setFilterText] = useState('');
  const [annotationFilterAnchorEl, setAnnotationFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAnnotationProperty, setSelectedAnnotationProperty] = useState<string>('');
  const [selectedAnnotationValues, setSelectedAnnotationValues] = useState<string[]>([]);
  const [activeAnnotationFilters, setActiveAnnotationFilters] = useState<Array<{property: string, values: string[]}>>([]);
  
  // State to track expand/collapse status
  const [isExpanded, setIsExpanded] = useState(false);

  // Get annotation names from entry
  const annotationPropertyNames = ['Name'];

  // Get all unique annotation names from the entry
  const annotationNames = useMemo(() => {
    if (!entry?.aspects) return [];
    const keys = Object.keys(entry.aspects);
    const number = entry.entryType?.split('/')[1];
    
    const names = keys
      .filter(key => {
        const aspect = entry.aspects[key];
        return aspect.data !== null 
          && key !== `${number}.global.schema` 
          && key !== `${number}.global.overview`
          && key !== `${number}.global.contacts`
          && key !== `${number}.global.usage`;
      })
      .map(key => entry.aspects[key].aspectType.split('/').pop())
      .filter((name): name is string => !!name);
      
    return Array.from(new Set(names)).sort();
  }, [entry]);

  // Filter annotations based on both dropdown and text input
  const filteredAnnotationNames = useMemo(() => {
    let filtered = annotationNames;

    // 1. Apply dropdown filter first
    const nameFilter = activeAnnotationFilters.find(f => f.property === 'Name');
    if (nameFilter && nameFilter.values.length > 0) {
      filtered = filtered.filter(name => nameFilter.values.includes(name));
    }

    // 2. Apply text search on the result of the dropdown filter
    if (filterText.trim()) {
      filtered = filtered.filter(name =>
        name.toLowerCase().includes(filterText.toLowerCase().trim())
      );
    }

    return filtered;
  }, [annotationNames, activeAnnotationFilters, filterText]);

  // Create filtered entry for annotations
  const filteredEntry = useMemo(() => {
    if (!entry?.aspects || (activeAnnotationFilters.length === 0 && !filterText.trim())) {
      return entry;
    }
    
    const keys = Object.keys(entry.aspects);
    const number = entry.entryType?.split('/')[1];
    const filteredAspects: any = {};
    
    keys.forEach(key => {
      const aspect = entry.aspects[key];
      const annotationName = aspect.aspectType.split('/').pop();
      
      // Include aspect if it matches filter or is not an annotation
      if (key === `${number}.global.schema` || 
          key === `${number}.global.overview` ||
          key === `${number}.global.contacts` ||
          key === `${number}.global.usage` ||
          (annotationName && filteredAnnotationNames.includes(annotationName))) {
        filteredAspects[key] = aspect;
      }
    });
    
    return {
      ...entry,
      aspects: filteredAspects
    };
  }, [entry, filteredAnnotationNames, activeAnnotationFilters, filterText]);

  // Update parent component when filtered entry changes
  React.useEffect(() => {
    onFilteredEntryChange(filteredEntry);
  }, [filteredEntry, onFilteredEntryChange]);

  // Event handlers
  const handleAnnotationFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnnotationFilterAnchorEl(event.currentTarget);
  };

  const handleAnnotationFilterClose = () => {
    setAnnotationFilterAnchorEl(null);
  };

  const handleAnnotationPropertySelect = (property: string) => {
    setSelectedAnnotationProperty(property);
    const existingFilter = activeAnnotationFilters.find(f => f.property === property);
    setSelectedAnnotationValues(existingFilter ? existingFilter.values : []);
  };

  const handleAnnotationValueToggle = (value: string) => {
    const newSelectedValues = selectedAnnotationValues.includes(value) 
      ? selectedAnnotationValues.filter(v => v !== value)
      : [...selectedAnnotationValues, value];
    
    setSelectedAnnotationValues(newSelectedValues);
    
    if (selectedAnnotationProperty) {
      const existingFilterIndex = activeAnnotationFilters.findIndex(f => f.property === selectedAnnotationProperty);
      if (newSelectedValues.length > 0) {
        if (existingFilterIndex >= 0) {
          setActiveAnnotationFilters(prev => prev.map((filter, index) => 
            index === existingFilterIndex ? { ...filter, values: newSelectedValues } : filter
          ));
        } else {
          setActiveAnnotationFilters(prev => [...prev, { property: selectedAnnotationProperty, values: newSelectedValues }]);
        }
      } else {
        setActiveAnnotationFilters(prev => prev.filter(f => f.property !== selectedAnnotationProperty));
      }
    }
  };

  const handleRemoveAnnotationFilter = (propertyToRemove: string) => {
    setActiveAnnotationFilters(prev => prev.filter(f => f.property !== propertyToRemove));
  };

  const handleToggleExpandCollapse = () => {
    if (isExpanded) {
      onCollapseAll();
    } else {
      onExpandAll();
    }
    setIsExpanded(prev => !prev);
  };

  return (
    <>
      {/* Aspect Filter Bar */}
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '8px 16px 8px 10px',
        border: '1px solid #DADCE0',
        borderTopRightRadius: '8px',
        borderTopLeftRadius: '8px',
        backgroundColor: '#FFFFFF',
        borderBottom: 'none',
        ...sx
      }}>
        {/* Filter Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', height: '35px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center'}}>
            <Tooltip title="Filter by aspect name" arrow>
              <IconButton
                size="small"
                onClick={handleAnnotationFilterClick}
                sx={{ padding: '4px 4px 5px 4px', '&:hover': { backgroundColor: '#E8F4FF' } }}
              >
                <FilterList sx={{ fontSize: '16px', color: '#1F1F1F' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Filter by aspect name" arrow>
              <Typography 
                onClick={handleAnnotationFilterClick}
                sx={{
                  fontWeight: 500, fontSize: '12px', lineHeight: '1.67em', color: '#1F1F1F',
                  cursor: 'pointer', '&:hover': { textDecoration: 'underline' }
                }}
              >
                Filter
              </Typography>
            </Tooltip>
          </Box>
          <TextField
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Search aspect names..."
            variant="standard"
            fullWidth
            sx={{
                flex: 1,
                '& .MuiInput-root': {
                    padding: '0px 8px 0px 8px', fontSize: '12px',
                    '&:before, &:after, &:hover:not(.Mui-disabled):before': { borderBottom: 'none' },
                },
                '& .MuiInputBase-input': {
                  padding: '4px 0px', fontSize: '12px', color: '#1F1F1F',
                  '&::placeholder': { color: '#575757', opacity: 1 }
                },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {filterText ? (
                    // If text is present, show the clear button
                    <IconButton size="small" onClick={() => setFilterText('')} sx={{ padding: '2px', marginRight: '-8px' }}>
                      <Close sx={{ fontSize: '14px' }} />
                    </IconButton>
                  ) : (
                    // Otherwise, show the expand/collapse button
                    <Tooltip title={isExpanded ? "Collapse All" : "Expand All"} arrow>
                      <IconButton size="large" onClick={handleToggleExpandCollapse} sx={{ padding: '0px', marginRight: '-14px' }}>
                        {!isExpanded ? <UnfoldMore sx={{ fontSize: '26.67px' }} /> : <UnfoldLess sx={{ fontSize: '26.67px' }} />}
                      </IconButton>
                    </Tooltip>
                  )}
                </InputAdornment>
              )
            }}
          />
        </Box>
        
        {/* Active Filter Chips */}
        {activeAnnotationFilters.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {activeAnnotationFilters.map((filter) => (
              <Box
                key={filter.property}
                sx={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '4px 8px', backgroundColor: '#E7F0FE',
                  border: '1px solid #0E4DCA', borderRadius: '16px'
                }}
              >
                <Typography sx={{ fontSize: '12px', fontWeight: 500, color: '#0E4DCA' }}>
                  {filter.property}:
                </Typography>
                <Typography sx={{ fontSize: '12px', color: '#1F1F1F' }}>
                  {filter.values.join(', ')}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => handleRemoveAnnotationFilter(filter.property)}
                  sx={{
                    padding: '2px', width: '16px', height: '16px', color: '#0E4DCA',
                    '&:hover': { backgroundColor: '#D93025', color: '#FFFFFF' }
                  }}
                >
                  <Close sx={{ fontSize: '12px', fontWeight: 'bold' }} />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Aspect Filter Dropdown Menu */}
      <Menu
        anchorEl={annotationFilterAnchorEl}
        open={Boolean(annotationFilterAnchorEl)}
        onClose={handleAnnotationFilterClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { maxHeight: 260, width: 250, borderRadius: '8px' } }}
      >
        {!selectedAnnotationProperty ? (
          <>
            <MenuItem 
              sx={{ 
                fontSize: '0.6875rem', fontWeight: 450, backgroundColor: '#F8F9FA',
                borderBottom: '1px solid #E0E0E0', height: "32px", minHeight: "32px",
                paddingTop: 0, paddingBottom: 1,
                "&.Mui-disabled": { opacity: 1, color: "#575757 !important", backgroundColor: "transparent !important" },
              }}
              disabled
            >
              <ListItemText primary="Select Property to Filter" primaryTypographyProps={{
                fontWeight: 500,
                fontSize: '12px',
              }}/>
            </MenuItem>
            {annotationPropertyNames.map((property) => (
              <MenuItem 
                key={property} 
                onClick={() => handleAnnotationPropertySelect(property)}
                sx={{ fontSize: '0.6875rem', '&:hover': { backgroundColor: '#F5F5F5' } }}
              >
                <ListItemText primary={property} primaryTypographyProps={{
                  fontSize: '12px',
                }}/>
              </MenuItem>
            ))}
          </>
        ) : (
          <>
            <MenuItem 
              onClick={() => setSelectedAnnotationProperty('')}
              sx={{ 
                fontSize: '0.6875rem', fontWeight: 400, backgroundColor: '#F8F9FA',
                borderBottom: '1px solid #E0E0E0',
                marginTop: '-8px',
                        paddingTop: 1.30,
                        paddingBottom: 1.30,
              }}
            >
              <ListItemText primary={`← Back to Properties`} primaryTypographyProps={{
          fontSize: '12px',
        }}/>
            </MenuItem>
            <MenuItem 
              sx={{ 
                fontSize: '0.6875rem', fontWeight: 400, backgroundColor: '#F8F9FA',
                borderBottom: '1px solid #E0E0E0'
              }}
              disabled
            >
              <ListItemText primary={`Filter by: ${selectedAnnotationProperty}`} primaryTypographyProps={{
          fontSize: '12px',
        }}/>
            </MenuItem>
            {annotationNames.map((value) => (
              <MenuItem 
                key={value} 
                onClick={() => handleAnnotationValueToggle(value)}
                sx={{ fontSize: '12px',
                      paddingTop: '2px',
                      paddingBottom: '2px',
                      paddingLeft: '8px',
                      paddingRight: '8px',
                      minHeight: 'auto',
                      '&:hover': { backgroundColor: '#F5F5F5' } 
                    }}
              >
                <Checkbox 
                  checked={selectedAnnotationValues.includes(value)}
                  size="small"
                  sx={{ 
                    marginRight: '8px',
                    '&.Mui-checked': { color: '#0E4DCA', borderRadius: '0.25rem' },
                  }}
                />
                <ListItemText primary={value} sx={{ '& .MuiTypography-root': { fontSize: '12px' } }}/>
              </MenuItem>
            ))}
          </>
        )}
      </Menu>
    </>
  );
};

export default AnnotationFilter;