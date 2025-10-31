import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Menu,
  MenuItem,
  ListItemText,
  Checkbox,
  IconButton,
  Collapse,
  TextField,
  InputAdornment,
  Tooltip
} from '@mui/material';
import { FilterList, Close } from '@mui/icons-material';

/**
 * @file TableFilter.tsx
 * @description
 * This component provides a filter bar for a data table. It allows users to filter
 * data in two ways:
 *
 * 1.  **Free-text Search**: A text field that searches across all specified `columns`
 * in the `data` array.
 * 2.  **Property-value Filtering**: A "Filter" button opens a menu where users
 * can first select a property (column) and then select one or more
 * unique values from that property to filter by.
 *
 * The component displays active filters as "chips" below the search bar and
 * provides a "Clear All" button.
 *
 * It takes the raw `data` and `columns` as props and uses the
 * `onFilteredDataChange` callback to return the resulting filtered data to the
 * parent component. To optimize performance, it only emits this change when
 * the filtered data's signature (length, first/last item) actually changes.
 *
 * @param {TableFilterProps} props - The props for the component.
 * @param {any[]} props.data - The complete, unfiltered array of data objects.
 * @param {string[]} props.columns - An array of strings representing the column
 * keys (properties) in the data objects that should be available for
 * filtering and searching.
 * @param {(filteredData: any[]) => void} props.onFilteredDataChange - Callback
 * function that is invoked when the filtered data changes. It passes the
 * new filtered array. If no filters are active, it passes an empty array `[]`.
 *
 * @returns {React.ReactElement} A React fragment containing the collapsible
 * filter bar UI and the hidden `Menu` component for property selection.
 */

interface TableFilterProps {
  data: any[];
  columns: string[];
  onFilteredDataChange: (filteredData: any[]) => void;
}

const TableFilter: React.FC<TableFilterProps> = ({
  data,
  columns,
  onFilteredDataChange
}) => {
  const [filterText, setFilterText] = useState('');
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<Array<{property: string, values: string[]}>>([]);

  // Get unique values for selected property with error handling
  const getPropertyValues = (property: string) => {
    const values = new Set<string>();
    
    try {
      if (!Array.isArray(data) || data.length === 0) {
        return [];
      }
      
      data.forEach((row: any, index: number) => {
        try {
          if (row && typeof row === 'object' && row[property] !== undefined && row[property] !== null) {
            values.add(String(row[property]));
          }
        } catch (rowError) {
          console.warn(`Error processing row ${index} for property ${property}:`, rowError);
        }
      });
    } catch (error) {
      console.error('Error getting property values:', error);
      return [];
    }
    
    return Array.from(values).sort();
  };

  // Filter data based on selected values and text search with error handling
  const filteredData = useMemo(() => {
    try {
      if (!Array.isArray(data) || data.length === 0) {
        return [];
      }

      let filtered = data;

      // Apply property/value filters first
      if (activeFilters.length > 0) {
        filtered = filtered.filter((row: any, index: number) => {
          try {
            if (!row || typeof row !== 'object') {
              return false;
            }
            
            return activeFilters.every(filter => {
              try {
                const cellValue = String(row[filter.property] ?? '');
                return filter.values.includes(cellValue);
              } catch (filterError) {
                console.warn(`Error applying filter for property ${filter.property} on row ${index}:`, filterError);
                return false;
              }
            });
          } catch (rowError) {
            console.warn(`Error filtering row ${index}:`, rowError);
            return false;
          }
        });
      }

      // Then apply text search across all columns
      if (filterText.trim()) {
        filtered = filtered.filter((row: any, index: number) => {
          try {
            if (!row || typeof row !== 'object') {
              return false;
            }
            
            return columns.some((col) => {
              try {
                return String(row[col] ?? '').toLowerCase().includes(filterText.toLowerCase());
              } catch (colError) {
                console.warn(`Error searching column ${col} on row ${index}:`, colError);
                return false;
              }
            });
          } catch (rowError) {
            console.warn(`Error searching row ${index}:`, rowError);
            return false;
          }
        });
      }

      return filtered;
    } catch (error) {
      console.error('Error filtering data:', error);
      return [];
    }
  }, [data, activeFilters, filterText, columns]);

  // Update parent component when filtered data changes, but only when content actually changes
  const lastEmittedRef = React.useRef<string>('');
  React.useEffect(() => {
    // If no active filters and no text, emit empty array to signal 'no-op' only once
    if (activeFilters.length === 0 && !filterText.trim()) {
      const signature = 'EMPTY';
      if (lastEmittedRef.current !== signature) {
        lastEmittedRef.current = signature;
        onFilteredDataChange([]);
      }
      return;
    }

    // Create a lightweight signature from length + first/last item stringified to avoid heavy deep comparisons
    const signature = (() => {
      const len = filteredData.length;
      if (len === 0) return 'LEN:0';
      const first = JSON.stringify(filteredData[0]).slice(0, 200);
      const last = JSON.stringify(filteredData[len - 1]).slice(0, 200);
      return `LEN:${len}|F:${first}|L:${last}`;
    })();

    if (lastEmittedRef.current !== signature) {
      lastEmittedRef.current = signature;
      onFilteredDataChange(filteredData);
    }
  }, [filteredData, onFilteredDataChange, activeFilters.length, filterText]);

  // Handle focus management for accessibility
  React.useEffect(() => {
    if (filterAnchorEl) {
      // Menu is open - ensure focus is properly managed
      const menuElement = document.querySelector('[role="menu"]');
      if (menuElement) {
        // Remove aria-hidden from menu when open
        menuElement.removeAttribute('aria-hidden');
      }
    } else {
      // Menu is closed - ensure no focus remains on menu items
      const menuItems = document.querySelectorAll('[role="menuitem"]');
      menuItems.forEach(item => {
        if (item instanceof HTMLElement) {
          item.blur();
        }
      });
    }
  }, [filterAnchorEl]);

  // Filter event handlers
  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handlePropertySelect = (property: string) => {
    setSelectedProperty(property);
    
    // Check if this property already has an active filter and pre-select those values
    const existingFilter = activeFilters.find(f => f.property === property);
    setSelectedValues(existingFilter ? existingFilter.values : []);
  };

  const handleValueToggle = (value: string) => {
    const newSelectedValues = selectedValues.includes(value) 
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    
    setSelectedValues(newSelectedValues);
    
    // Auto-apply filter when values change
    if (selectedProperty && newSelectedValues.length > 0) {
      // Check if this property already has an active filter
      const existingFilterIndex = activeFilters.findIndex(f => f.property === selectedProperty);
      
      if (existingFilterIndex >= 0) {
        // Update existing filter
        setActiveFilters(prev => prev.map((filter, index) => 
          index === existingFilterIndex 
            ? { ...filter, values: newSelectedValues }
            : filter
        ));
      } else {
        // Add new filter
        setActiveFilters(prev => [...prev, { property: selectedProperty, values: newSelectedValues }]);
      }
    } else if (selectedProperty && newSelectedValues.length === 0) {
      // Remove filter if no values are selected
      setActiveFilters(prev => prev.filter(f => f.property !== selectedProperty));
    }
  };

  const handleRemoveFilter = (propertyToRemove: string) => {
    setActiveFilters(prev => prev.filter(f => f.property !== propertyToRemove));
  };

  const handleClearFilters = () => {
    setSelectedProperty('');
    setSelectedValues([]);
    setActiveFilters([]);
    setFilterAnchorEl(null);
    setFilterText('');
    setIsFilterExpanded(true);
  };

  return (
    <>
      {/* Filter Bar */}
      <Collapse in={isFilterExpanded} timeout={300}>
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '8px 16px 8px 10px',
          border: '1px solid #DADCE0',
          borderTopRightRadius: '8px',
          borderTopLeftRadius: '8px',
          backgroundColor: '#FFFFFF',
          margin: '6px 0px 0px 0px',
          borderBottom: 'none'
        }}>
          {/* Filter Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', height: '19px'  }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Tooltip title="Filter by selecting property and values" arrow>
                <IconButton
                  size="small"
                  onClick={handleFilterClick}
                  sx={{
                    padding: '4px 4px 5px 4px',
                    '&:hover': {
                      backgroundColor: '#E8F4FF'
                    }
                  }}
                >
                  <FilterList sx={{ fontSize: '16px', color: '#1f1f1f' }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Filter by selecting property and values" arrow>
                <Typography 
                  variant="heading2Medium"
                  onClick={handleFilterClick}
                  sx={{
                    fontFamily: 'Google Sans Text, sans-serif',
                    fontWeight: 500,
                    fontSize: '12px',
                    lineHeight: '1.67em',
                    color: '1f1f1f',
                    cursor: 'pointer',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  Filter
                </Typography>
              </Tooltip>
            </Box>
            <TextField
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Enter property name or value"
              variant="outlined"
              size="small"
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  fontSize: '12px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  '& fieldset': {
                    border: 'none'
                  },
                  '&:hover fieldset': {
                    border: 'none'
                  },
                  '&.Mui-focused fieldset': {
                    border: 'none'
                  }
                },
                '& .MuiInputBase-input': {
                  padding: '4px 4px',
                  fontSize: '12px',
                  color: '#1F1F1F'
                },
                '& .MuiInputBase-input::placeholder': {
                  color: '#575757',
                  opacity: 1
                }
              }}
              InputProps={{
                endAdornment: filterText && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setFilterText('')}
                      sx={{ padding: '2px' }}
                    >
                      <Close sx={{ fontSize: '14px' }} />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            {activeFilters.length > 0 && (
              <Button
                onClick={handleClearFilters}
                sx={{
                  fontSize: '11px',
                  color: '#0B57D0',
                  textTransform: 'none',
                  padding: '2px 8px',
                  minWidth: 'auto',
                  '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' }
                }}
              >
                Clear All
              </Button>
            )}
          </Box>
          
          {/* Active Filter Chips */}
          {activeFilters.length > 0 && (
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '6px',
              paddingTop: '4px'
            }}>
              {activeFilters.map((filter) => (
                <Box
                  key={filter.property}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 8px',
                    backgroundColor: '#E7F0FE',
                    border: '1px solid #0E4DCA',
                    borderRadius: '16px',
                    fontSize: '11px'
                  }}
                >
                  <Typography sx={{ 
                    fontSize: '12px', 
                    fontWeight: 500,
                    color: '#0E4DCA'
                  }}>
                    {filter.property}:
                  </Typography>
                  <Typography sx={{ 
                    fontSize: '12px', 
                    color: '#1F1F1F'
                  }}>
                    {filter.values.join(', ')}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveFilter(filter.property)}
                    sx={{
                      padding: '2px',
                      width: '16px',
                      height: '16px',
                      color: '#0E4DCA',
                      '&:hover': {
                        backgroundColor: '#D93025',
                        color: '#FFFFFF'
                      }
                    }}
                  >
                    <Box sx={{ 
                      fontSize: '12px', 
                      fontWeight: 'bold',
                      lineHeight: 1
                    }}>
                      ×
                    </Box>
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Collapse>

      {/* Filter Dropdown Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterClose}
        disableAutoFocus
        disableEnforceFocus
        disableRestoreFocus
        PaperProps={{
          sx: {
            maxHeight: 300,
            width: 250,
            borderRadius: '8px',
          },
        }}
        slotProps={{
          paper: {
            'aria-hidden': !Boolean(filterAnchorEl) ? 'true' : undefined,
          }
        }}
      >
        {!selectedProperty ? (
          // Show property names as headers
          <>
            <MenuItem
              sx={{
                fontSize: "12px",
                fontWeight: 500,
                backgroundColor: "transparent !important",
                borderBottom: "1px solid #E0E0E0",
                height: "32px",
                minHeight: "32px",
                paddingTop: 0,
                paddingBottom: 1,
                "&.Mui-disabled": {
                  opacity: 1,
                  color: "#575757 !important",
                  backgroundColor: "transparent !important",
                },
              }}
              disabled
            >
              <ListItemText primary="Select Property to Filter" primaryTypographyProps={{
          fontSize: '12px', fontWeight: 500
        }}/>
            </MenuItem>
            {columns
              .filter(property =>
                data.some(row => row && row[property] != null && String(row[property]).trim() !== '')
              )
              .map((property) => (
              <MenuItem 
                key={property} 
                onClick={() => handlePropertySelect(property)}
                sx={{ 
                  fontSize: '12px',
                  '&:hover': { backgroundColor: '#F5F5F5' }
                }}
                tabIndex={Boolean(filterAnchorEl) ? 0 : -1}
              >
                <ListItemText primary={property} primaryTypographyProps={{
          fontSize: '12px',
        }}/>
              </MenuItem>
            ))}
          </>
        ) : (
          // Show values for selected property
          <>
            <MenuItem 
              onClick={() => setSelectedProperty('')}
              sx={{ 
                fontSize: '12px', 
                fontWeight: 600,
                backgroundColor: '#F8F9FA',
                borderBottom: '1px solid #E0E0E0',
                marginTop: '-8px',
                paddingTop: 1.30,
                paddingBottom: 1.30,
              }}
              tabIndex={Boolean(filterAnchorEl) ? 0 : -1}
            >
              <ListItemText primary={`← Back to Properties`} primaryTypographyProps={{
          fontSize: '12px',
        }}/>
            </MenuItem>
            <MenuItem 
              sx={{ 
                fontSize: '12px', 
                fontWeight: 600, 
                backgroundColor: '#F8F9FA',
                borderBottom: '1px solid #E0E0E0'
              }}
              disabled
              tabIndex={-1}
            >
              <ListItemText primary={`Filter by: ${selectedProperty}`} primaryTypographyProps={{
          fontSize: '12px',
        }}/>
            </MenuItem>
            {getPropertyValues(selectedProperty).map((value) => (
              <MenuItem 
                key={value} 
                onClick={() => handleValueToggle(value)}
                sx={{ 
                  fontSize: '12px',
                  paddingTop: '2px',
                  paddingBottom: '2px',
                  paddingLeft: '8px',
                  paddingRight: '8px',
                  minHeight: 'auto',
                  '&:hover': { backgroundColor: '#F5F5F5' }
                }}
                tabIndex={Boolean(filterAnchorEl) ? 0 : -1}
              >
                <Checkbox 
                  checked={selectedValues.includes(value)}
                  size="small"
                  sx={{ marginRight: '8px' }}
                  tabIndex={-1}
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

export default TableFilter;