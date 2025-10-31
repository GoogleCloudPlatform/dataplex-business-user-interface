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
 * @file SchemaFilter.tsx
 * @description
 * This component renders a filter bar UI specifically designed to filter the
 * columns (fields) of a data entry's schema.
 *
 * It provides two filtering mechanisms:
 * 1.  **Free-text Search**: A text input that searches across all properties
 * of the schema fields (e.g., Name, Type, Description).
 * 2.  **Property Filtering**: A "Filter" menu that allows users to select a
 * specific property (e.g., 'Type', 'Mode') and then check one or more
 * values to filter by.
 *
 * The component parses the schema from the input `entry` object. Based on the
 * applied filters, it reconstructs a new (deep-copied) `entry` object
 * where the schema aspect contains *only* the fields that match the filters.
 * This new `filteredEntry` object is then passed back to the parent component
 * via the `onFilteredEntryChange` callback.
 *
 * @param {SchemaFilterProps} props - The props for the component.
 * @param {any} props.entry - The complete data entry object containing the
 * schema aspect to be filtered.
 * @param {(filteredEntry: any) => void} props.onFilteredEntryChange - A callback
 * function that is invoked whenever the filters change, passing the new,
 * filtered `entry` object as its argument.
 * @param {any} [props.sx] - (Optional) Material-UI SX props to apply custom
 * styling to the filter bar's root `Box`.
 * @param {boolean} [props.isPreview] - (Optional) If true, this flag
 * restricts the available filter properties to a basic set ('Name', 'Type',
 * 'Mode'), matching the columns in `PreviewSchema`.
 *
 * @returns {React.ReactElement} A React fragment containing the collapsible
 * filter bar UI and the associated `Menu` component for property selection.
 */

interface SchemaFilterProps {
  entry: any;
  onFilteredEntryChange: (filteredEntry: any) => void;
  sx?: any;
  isPreview?: boolean;
}

const SchemaFilter: React.FC<SchemaFilterProps> = ({
  entry,
  onFilteredEntryChange,
  sx,
  isPreview
}) => {
  const [schemaFilterText, setSchemaFilterText] = useState('');
  const [isSchemaFilterExpanded, setIsSchemaFilterExpanded] = useState(true);
  const [schemaFilterAnchorEl, setSchemaFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedSchemaProperty, setSelectedSchemaProperty] = useState<string>('');
  const [selectedSchemaValues, setSelectedSchemaValues] = useState<string[]>([]);
  const [activeSchemaFilters, setActiveSchemaFilters] = useState<Array<{property: string, values: string[]}>>([]);

  const number = entry?.entryType?.split('/')?.at(1) ?? 'table';

  // Schema property names for filter dropdown - based on actual table headers
  const schemaPropertyNames = isPreview ? [
    'Name',
    'Type',
    'Mode',
  ] : [
    'Name',
    'Type',
    'Metadata Type',
    'Mode',
    'Default Value',
    'Description'
  ];

  // Get schema data for filtering - based on actual schema structure
  const schemaData = useMemo(() => {
    if (!entry?.aspects?.[`${number}.global.schema`]?.data?.fields?.fields?.listValue?.values) {
      return [];
    }
    return entry.aspects[`${number}.global.schema`].data.fields.fields.listValue.values.map((field: any, index: number) => ({
      id: index + 1,
      name: field.structValue.fields.name?.stringValue || '',
      type: field.structValue.fields.dataType?.stringValue || '',
      metaDataType: field.structValue.fields.metadataType?.stringValue || '',
      mode: field.structValue.fields.mode?.stringValue || '',
      defaultValue: (field.structValue.fields.defaultValue && field.structValue.fields.defaultValue != null) ? field.structValue.fields.defaultValue?.stringValue : '-',
      description: (field.structValue.fields.description && field.structValue.fields.description != null) ? field.structValue.fields.description?.stringValue : '-'
    }));
  }, [entry, number]);

  // Get unique values for selected schema property
  const getSchemaPropertyValues = (property: string) => {
    const values = new Set<string>();
    
    schemaData.forEach((row: any) => {
      switch (property) {
        case 'Name':
          if (row.name) values.add(row.name);
          break;
        case 'Type':
          if (row.type) values.add(row.type);
          break;
        case 'Metadata Type':
          if (row.metaDataType) values.add(row.metaDataType);
          break;
        case 'Mode':
          if (row.mode) values.add(row.mode);
          break;
        case 'Default Value':
          if (row.defaultValue && row.defaultValue !== '-') values.add(row.defaultValue);
          break;
        case 'Description':
          if (row.description && row.description !== '-') values.add(row.description);
          break;
      }
    });
    
    return Array.from(values).sort();
  };

  // Filter schema data based on selected values
  const filteredSchemaData = useMemo(() => {
    if (activeSchemaFilters.length === 0) {
      return schemaData.filter((col: any) =>
        col.name.toLowerCase().includes(schemaFilterText.toLowerCase()) ||
        col.type.toLowerCase().includes(schemaFilterText.toLowerCase()) ||
        col.metaDataType.toLowerCase().includes(schemaFilterText.toLowerCase()) ||
        col.mode.toLowerCase().includes(schemaFilterText.toLowerCase()) ||
        col.defaultValue.toLowerCase().includes(schemaFilterText.toLowerCase()) ||
        col.description.toLowerCase().includes(schemaFilterText.toLowerCase())
      );
    }
    
    return schemaData.filter((row: any) => {
      return activeSchemaFilters.every(filter => {
        const isMatch = filter.values.some(value => {
          switch (filter.property) {
            case 'Name':
              return row.name === value;
            case 'Type':
              return row.type === value;
            case 'Metadata Type':
              return row.metaDataType === value;
            case 'Mode':
              return row.mode === value;
            case 'Default Value':
              return row.defaultValue === value;
            case 'Description':
              return row.description === value;
            default:
              return false;
          }
        });
        return isMatch;
      });
    });
  }, [schemaData, activeSchemaFilters, schemaFilterText]);

  // Create filtered entry for schema
  const filteredSchemaEntry = useMemo(() => {
    if (!entry?.aspects?.[`${number}.global.schema`] || (activeSchemaFilters.length === 0 && !schemaFilterText)) {
      return entry;
    }
    
    const originalFields = entry.aspects[`${number}.global.schema`].data.fields.fields.listValue.values;
    const filteredFields = originalFields.filter((field: any) => {
      const fieldData = {
        name: field.structValue.fields.name?.stringValue || '',
        type: field.structValue.fields.dataType?.stringValue || '',
        metaDataType: field.structValue.fields.metadataType?.stringValue || '',
        mode: field.structValue.fields.mode?.stringValue || '',
        defaultValue: (field.structValue.fields.defaultValue && field.structValue.fields.defaultValue != null) ? field.structValue.fields.defaultValue?.stringValue : '-',
        description: (field.structValue.fields.description && field.structValue.fields.description != null) ? field.structValue.fields.description?.stringValue : '-'
      };
      
      return filteredSchemaData.some((filteredField: any) => 
        filteredField.name === fieldData.name &&
        filteredField.type === fieldData.type &&
        filteredField.metaDataType === fieldData.metaDataType &&
        filteredField.mode === fieldData.mode &&
        filteredField.defaultValue === fieldData.defaultValue &&
        filteredField.description === fieldData.description
      );
    });
    
    const filteredEntry = {
      ...entry,
      aspects: {
        ...entry.aspects,
        [`${number}.global.schema`]: {
          ...entry.aspects[`${number}.global.schema`],
          data: {
            ...entry.aspects[`${number}.global.schema`].data,
            fields: {
              ...entry.aspects[`${number}.global.schema`].data.fields,
              fields: {
                ...entry.aspects[`${number}.global.schema`].data.fields.fields,
                listValue: {
                  ...entry.aspects[`${number}.global.schema`].data.fields.fields.listValue,
                  values: filteredFields
                }
              }
            }
          }
        }
      }
    };
    
    return filteredEntry;
  }, [entry, number, filteredSchemaData, activeSchemaFilters, schemaFilterText]);

  // Update parent component when filtered entry changes
  React.useEffect(() => {
    onFilteredEntryChange(filteredSchemaEntry);
  }, [filteredSchemaEntry, onFilteredEntryChange]);

  // Handle focus management for accessibility
  React.useEffect(() => {
    if (schemaFilterAnchorEl) {
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
  }, [schemaFilterAnchorEl]);

  // Schema filter event handlers
  const handleSchemaFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setSchemaFilterAnchorEl(event.currentTarget);
  };

  const handleSchemaFilterClose = () => {
    setSchemaFilterAnchorEl(null);
  };

  const handleSchemaPropertySelect = (property: string) => {
    setSelectedSchemaProperty(property);
    
    // Check if this property already has an active filter and pre-select those values
    const existingFilter = activeSchemaFilters.find(f => f.property === property);
    setSelectedSchemaValues(existingFilter ? existingFilter.values : []);
  };

  const handleSchemaValueToggle = (value: string) => {
    const newSelectedValues = selectedSchemaValues.includes(value) 
      ? selectedSchemaValues.filter(v => v !== value)
      : [...selectedSchemaValues, value];
    
    setSelectedSchemaValues(newSelectedValues);
    
    // Auto-apply filter when values change
    if (selectedSchemaProperty && newSelectedValues.length > 0) {
      // Check if this property already has an active filter
      const existingFilterIndex = activeSchemaFilters.findIndex(f => f.property === selectedSchemaProperty);
      
      if (existingFilterIndex >= 0) {
        // Update existing filter
        setActiveSchemaFilters(prev => prev.map((filter, index) => 
          index === existingFilterIndex 
            ? { ...filter, values: newSelectedValues }
            : filter
        ));
      } else {
        // Add new filter
        setActiveSchemaFilters(prev => [...prev, { property: selectedSchemaProperty, values: newSelectedValues }]);
      }
    } else if (selectedSchemaProperty && newSelectedValues.length === 0) {
      // Remove filter if no values are selected
      setActiveSchemaFilters(prev => prev.filter(f => f.property !== selectedSchemaProperty));
    }
  };

  const handleRemoveSchemaFilter = (propertyToRemove: string) => {
    setActiveSchemaFilters(prev => prev.filter(f => f.property !== propertyToRemove));
  };

  const handleClearSchemaFilters = () => {
    setSelectedSchemaProperty('');
    setSelectedSchemaValues([]);
    setActiveSchemaFilters([]);
    setSchemaFilterAnchorEl(null);
    setSchemaFilterText('');
    setIsSchemaFilterExpanded(true);
  };

  return (
    <>
      {/* Schema Filter Bar */}
      <Collapse in={isSchemaFilterExpanded} timeout={300}>
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', height: '19px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center'}}>
              <Tooltip title="Filter by selecting property and values" arrow>
                <IconButton
                  size="small"
                  onClick={handleSchemaFilterClick}
                  sx={{
                    padding: '4px 4px 5px 4px',
                    '&:hover': {
                      backgroundColor: '#E8F4FF'
                    }
                  }}
                >
                  <FilterList sx={{ fontSize: '16px', color: '#1F1F1F' }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Filter by selecting property and values" arrow>
                <Typography 
                  onClick={handleSchemaFilterClick}
                  sx={{
                    fontFamily: 'Google Sans Text, sans-serif',
                    fontWeight: 500,
                    fontSize: '12px',
                    lineHeight: '1.67em',
                    color: '#1F1F1F',
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
              value={schemaFilterText}
              onChange={(e) => setSchemaFilterText(e.target.value)}
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
                endAdornment: schemaFilterText && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setSchemaFilterText('')}
                      sx={{ padding: '2px' }}
                    >
                      <Close sx={{ fontSize: '14px' }} />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            {activeSchemaFilters.length > 0 && (
              <Button
                onClick={handleClearSchemaFilters}
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
          {activeSchemaFilters.length > 0 && (
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '6px',
              paddingTop: '4px'
            }}>
              {activeSchemaFilters.map((filter) => (
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
                    onClick={() => handleRemoveSchemaFilter(filter.property)}
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

      {/* Schema Filter Dropdown Menu */}
      <Menu
        anchorEl={schemaFilterAnchorEl}
        open={Boolean(schemaFilterAnchorEl)}
        onClose={handleSchemaFilterClose}
        disableAutoFocus
        disableEnforceFocus
        disableRestoreFocus
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        slotProps={{
          paper: {
            'aria-hidden': !Boolean(schemaFilterAnchorEl) ? 'true' : undefined,
          }
        }}
        PaperProps={{
          sx: {
            maxHeight: 260,
            width: 250,
            borderRadius: '8px',
          }
        }}
      >
        {!selectedSchemaProperty ? (
          // Show property names as headers
          <>
            <MenuItem 
              sx={{ 
                fontSize: '0.6875rem', 
                fontWeight: 500, 
                backgroundColor: '#F8F9FA',
                borderBottom: '1px solid #E0E0E0',
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
                fontWeight: 500,
                fontSize: '12px',
        }}/>
            </MenuItem>
            {schemaPropertyNames
              .filter(property => {
                return schemaData.some((row : any) => {
                  let value;
                  switch (property) {
                    case 'Name':          value = row.name; break;
                    case 'Type':          value = row.type; break;
                    case 'Metadata Type': value = row.metaDataType; break;
                    case 'Mode':          value = row.mode; break;
                    case 'Default Value': value = row.defaultValue; break;
                    case 'Description':   value = row.description; break;
                    default: return false;
                  }
                  // Check for null/undefined, empty strings, and the placeholder '-'
                  return value != null && String(value).trim() !== '' && String(value).trim() !== '-';
                });
              })
              .map((property) => (
              <MenuItem 
                key={property} 
                onClick={() => handleSchemaPropertySelect(property)}
                sx={{ 
                  fontSize: '0.6875rem',
                  '&:hover': { backgroundColor: '#F5F5F5' }
                }}
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
              onClick={() => setSelectedSchemaProperty('')}
              sx={{ 
                fontSize: '0.6875rem', 
                fontWeight: 400,
                backgroundColor: '#F8F9FA',
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
                fontSize: '0.6875rem', 
                fontWeight: 400, 
                backgroundColor: '#F8F9FA',
                borderBottom: '1px solid #E0E0E0'
              }}
              disabled
            >
              <ListItemText primary={`Filter by: ${selectedSchemaProperty}`} primaryTypographyProps={{
          fontSize: '12px',
        }}/>
            </MenuItem>
            {getSchemaPropertyValues(selectedSchemaProperty).map((value) => (
              <MenuItem 
                key={value} 
                onClick={() => handleSchemaValueToggle(value)}
                sx={{ 
                  fontSize: '0.6875rem',
                  paddingTop: '2px',
                  paddingBottom: '2px',
                  paddingLeft: '8px',
                  paddingRight: '8px',
                  minHeight: 'auto',
                  '&:hover': { backgroundColor: '#F5F5F5' }
                }}
              >
                <Checkbox 
                  checked={selectedSchemaValues.includes(value)}
                  size="small"
                  sx={{ 
                    marginRight: '8px',
                    '&.Mui-checked': {
                      color: '#0E4DCA',
                      borderRadius: '0.25rem',
                    },
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

export default SchemaFilter;