import React, { useMemo, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  Checkbox,
  Menu,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Alert,
  Snackbar
} from '@mui/material';
import { Close, MoreVert, FilterList, FilterListOff } from '@mui/icons-material';

/**
 * @file FilterSubAnnotationsPanel.tsx
 * @description
 * This component renders a pop-up panel that allows users to define granular,
 * field-level filters for a specific annotation (aspect).
 *
 * It displays a list of fields (sub-annotations) provided via the
 * `subAnnotations` prop. For each field, it provides:
 * 1.  **An input field**: Renders a `TextField` or `Select` (for 'bool'/'enum')
 * for the user to enter a filter value.
 * 2.  **A checkbox**: Allows the user to *enable* or *disable* this specific
 * field filter. The checkbox is disabled until a value is entered.
 * 3.  **A 'More Options' menu**: Allows toggling the filter logic between
 * 'Include' (default) and 'Exclude'.
 *
 * The component manages internal validation (e.g., for 'int' types) and shows
 * errors via a `Snackbar`.
 *
 * It uses two distinct callbacks for state management:
 * - `onSubAnnotationsChange`: Fires on *every* change (typing, checking,
 * toggling filter type) to keep the parent state in sync.
 * - `onSubAnnotationsApply`: Fires *only* when the "Apply" button is clicked.
 * This callback sends a *validated* list of *enabled* filters to the parent.
 *
 * @param {FilterSubAnnotationsPanelProps} props - The props for the component.
 * @param {string} props.annotationName - The name of the parent annotation to
 * display as the panel's title.
 * @param {FieldDefinition[]} [props.subAnnotations=[]] - The list of field
 * definitions (sub-annotations) available for filtering.
 * @param {boolean} props.subAnnotationsloader - If true, a loading spinner is
 * displayed instead of the field list.
 * @param {FilterValue[]} [props.selectedSubAnnotations=[]] - The current array
 * of filter values, including their enabled state and filter type.
 * @param {(selectedSubAnnotations: FilterValue[]) => void} props.onSubAnnotationsChange -
 * Callback fired on *any* modification to the filter state.
 * @param {(appliedSubAnnotations: FilterValue[]) => void} props.onSubAnnotationsApply -
 * Callback fired *only* when the 'Apply' button is clicked, passing only the
 * valid and enabled filters.
 * @param {() => void} props.onClose - Callback fired when the 'X' (close) button
 * is clicked.
 * @param {boolean} props.isOpen - Controls whether the panel is visible.
 * @param {{ x: number; y: number }} [props.clickPosition] - (Optional)
 * Coordinates used to position the panel on the screen.
 *
 * @returns {React.ReactElement | null} A React element representing the filter
 * panel, or `null` if `isOpen` is false.
 */

interface FieldDefinition {
  name: string;
  type: 'bool' | 'enum' | 'string' | 'int' | 'strong';
  enumValues?: string[];
}

interface FilterValue {
  fieldName: string;
  value: string;
  enabled: boolean;
  filterType: 'include' | 'exclude';
}

interface FilterSubAnnotationsPanelProps {
  annotationName: string;
  subAnnotations: FieldDefinition[];
  subAnnotationsloader: boolean;
  selectedSubAnnotations: FilterValue[];
  onSubAnnotationsChange: (selectedSubAnnotations: FilterValue[]) => void;
  onSubAnnotationsApply: (appliedSubAnnotations: FilterValue[]) => void;
  onClose: () => void;
  isOpen: boolean;
  clickPosition?: { x: number; y: number };
}

const FilterSubAnnotationsPanel: React.FC<FilterSubAnnotationsPanelProps> = ({
  annotationName,
  subAnnotations = [],
  subAnnotationsloader,
  selectedSubAnnotations = [],
  onSubAnnotationsChange,
  onSubAnnotationsApply,
  onClose,
  isOpen,
  clickPosition
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedFieldForMenu, setSelectedFieldForMenu] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<{ open: boolean; message: string; severity: 'error' | 'warning' | 'info' | 'success' }>({
    open: false,
    message: '',
    severity: 'error'
  });

  const filteredSubAnnotations = useMemo(() => {
    return subAnnotations;
  }, [subAnnotations]);

  const handleToggleField = (fieldName: string) => {
    const currentValue = getFieldValue(fieldName);
    
    // Only allow checkbox selection if field has a value
    if (!currentValue || currentValue === '') {
      return; // Don't allow checkbox selection without a value
    }
    
    const existingIndex = selectedSubAnnotations.findIndex(item => item.fieldName === fieldName);
    let newSelected = [...selectedSubAnnotations];
    
    if (existingIndex >= 0) {
      newSelected[existingIndex] = {
        ...newSelected[existingIndex],
        enabled: !newSelected[existingIndex].enabled
      };
    } else {
      newSelected.push({
        fieldName,
        value: currentValue,
        enabled: true,
        filterType: 'include' // Default to include filter
      });
    }
    onSubAnnotationsChange(newSelected);
  };

  const handleValueChange = (fieldName: string, value: string) => {
    // Always allow the input to be updated - validation will happen on blur
    const existingIndex = selectedSubAnnotations.findIndex(item => item.fieldName === fieldName);
    let newSelected = [...selectedSubAnnotations];
    
    if (existingIndex >= 0) {
      newSelected[existingIndex] = {
        ...newSelected[existingIndex],
        value,
        // Auto-disable if value is cleared, but don't auto-enable when value is set
        enabled: value !== '' ? newSelected[existingIndex].enabled : false
      };
      
      // Remove the field from selected if value is empty
      if (value === '') {
        newSelected.splice(existingIndex, 1);
      }
    } else if (value !== '') {
      // Only add to selected if there's a value, but don't auto-enable
      newSelected.push({
        fieldName,
        value,
        enabled: false, // Don't auto-enable - user must manually check the checkbox
        filterType: 'include' // Default to include filter
      });
    }
    onSubAnnotationsChange(newSelected);
  };

  const handleFieldBlur = (fieldName: string) => {
    const currentValue = getFieldValue(fieldName);
    const fieldDefinition = subAnnotations.find(field => field.name === fieldName);
    const fieldType = fieldDefinition?.type || 'string';
    
    // Validate the value on blur
    const validation = validateFieldValue(fieldType, currentValue);
    
    if (!validation.isValid) {
      // Show validation error
      setValidationErrors(prev => ({ ...prev, [fieldName]: validation.errorMessage }));
      showNotification(validation.errorMessage, 'error');
    } else {
      // Clear validation error if validation passes
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const getFieldValue = (fieldName: string): string => {
    const field = selectedSubAnnotations.find(item => item.fieldName === fieldName);
    return field?.value || '';
  };

  const isFieldEnabled = (fieldName: string): boolean => {
    const field = selectedSubAnnotations.find(item => item.fieldName === fieldName);
    return field?.enabled || false;
  };

  const getFieldFilterType = (fieldName: string): 'include' | 'exclude' => {
    const field = selectedSubAnnotations.find(item => item.fieldName === fieldName);
    return field?.filterType || 'include';
  };

  // Validation function to check if a field is valid for filtering
  // const isFieldValidForFilter = (fieldName: string): boolean => {
  //   const field = selectedSubAnnotations.find(item => item.fieldName === fieldName);
  //   return field?.enabled === true && field?.value !== '' && field?.value !== null && field?.value !== undefined;
  // };

  // Get all valid filters that should be applied
  const getValidFilters = (): FilterValue[] => {
    return selectedSubAnnotations.filter(filter => {
      // Check if filter is enabled and has a value
      if (!filter.enabled || !filter.value || filter.value === '') {
        return false;
      }
      
      // Check if the value passes validation
      const fieldDefinition = subAnnotations.find(field => field.name === filter.fieldName);
      const fieldType = fieldDefinition?.type || 'string';
      const validation = validateFieldValue(fieldType, filter.value);
      
      return validation.isValid;
    });
  };

  // Check if there are any valid filters to apply
  const hasValidFilters = (): boolean => {
    return getValidFilters().length > 0;
  };

  const handleFilterTypeChange = (fieldName: string, filterType: 'include' | 'exclude') => {
    const existingIndex = selectedSubAnnotations.findIndex(item => item.fieldName === fieldName);
    let newSelected = [...selectedSubAnnotations];
    
    if (existingIndex >= 0) {
      newSelected[existingIndex] = {
        ...newSelected[existingIndex],
        filterType
      };
    } else {
      newSelected.push({
        fieldName,
        value: '',
        enabled: false,
        filterType
      });
    }
    onSubAnnotationsChange(newSelected);
  };

  const handleMoreOptionsClick = (event: React.MouseEvent<HTMLElement>, fieldName: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedFieldForMenu(fieldName);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedFieldForMenu(null);
  };

  // Validation functions
  const validateFieldValue = (fieldType: string, value: string): { isValid: boolean; errorMessage: string } => {
    if (!value || value.trim() === '') {
      return { isValid: true, errorMessage: '' }; // Empty values are allowed
    }

    switch (fieldType) {
      case 'int':
        // For integer fields, check if the value is a valid integer
        const trimmedValue = value.trim();
        const intValue = parseInt(trimmedValue, 10);
        if (isNaN(intValue) || !Number.isInteger(intValue) || intValue.toString() !== trimmedValue) {
          return { isValid: false, errorMessage: 'Please enter a valid integer value (e.g., 123, -456)' };
        }
        return { isValid: true, errorMessage: '' };

      case 'string':
      case 'strong':
        // String fields can accept any value - no validation needed
        return { isValid: true, errorMessage: '' };

      default:
        return { isValid: true, errorMessage: '' };
    }
  };

  const showNotification = (message: string, severity: 'error' | 'warning' | 'info' | 'success' = 'error') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  const handleNotificationClose = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  // const handleClearAll = () => {
  //   onSubAnnotationsChange([]);
  // };

  // Panel only closes on Apply or X button click - no click outside handler

  if (!isOpen) return null;

  const renderFieldInput = (field: FieldDefinition) => {
    // Ensure field name is always a string
    const fieldName = String(field.name || '');
    const currentValue = getFieldValue(fieldName);

    if (field.type === 'bool') {
      const isFocused = focusedField === fieldName;
      const showLabel = isFocused || currentValue !== '';
      
      return (
        <Box sx={{ position: 'relative', width: '100%', minWidth: 200 }}>
          {/* Floating Label */}
          <Typography
            sx={{
              position: 'absolute',
              top: showLabel ? '-0.6rem' : '0.75rem',
              left: '0.75rem',
              fontSize: showLabel ? '0.75rem' : '0.875rem',
              color: '#0E4DCA',
              backgroundColor: '#FFFFFF',
              padding: showLabel ? '0 0.25rem' : '0',
              zIndex: 10,
              transition: 'all 0.2s ease',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            {getFieldFilterType(fieldName) === 'exclude' && (
              <span style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>≠</span>
            )}
            {fieldName}
          </Typography>
          
          <FormControl 
            size="small" 
            sx={{ 
              width: '100%',
              minWidth: 200,
              '& .MuiOutlinedInput-root': {
                borderRadius: '0.5rem',
                backgroundColor: '#FFFFFF',
                border: `1px solid ${isFocused ? '#0E4DCA' : '#DADCE0'} !important`,
                borderTop: `1px solid ${isFocused ? '#0E4DCA' : '#DADCE0'} !important`,
                borderBottom: `1px solid ${isFocused ? '#0E4DCA' : '#DADCE0'} !important`,
                borderLeft: `1px solid ${isFocused ? '#0E4DCA' : '#DADCE0'} !important`,
                borderRight: `1px solid ${isFocused ? '#0E4DCA' : '#DADCE0'} !important`,
                '& fieldset': {
                  border: 'none !important',
                  borderTop: 'none !important',
                  borderBottom: 'none !important',
                  borderLeft: 'none !important',
                  borderRight: 'none !important',
                },
                '&:hover': {
                  borderColor: '#0E4DCA !important',
                  borderTopColor: '#0E4DCA !important',
                  borderBottomColor: '#0E4DCA !important',
                  borderLeftColor: '#0E4DCA !important',
                  borderRightColor: '#0E4DCA !important',
                },
                '&.Mui-focused': {
                  borderColor: '#0E4DCA !important',
                  borderTopColor: '#0E4DCA !important',
                  borderBottomColor: '#0E4DCA !important',
                  borderLeftColor: '#0E4DCA !important',
                  borderRightColor: '#0E4DCA !important',
                },
                '&.Mui-disabled': {
                  borderColor: '#DADCE0 !important',
                  borderTopColor: '#DADCE0 !important',
                  borderBottomColor: '#DADCE0 !important',
                  borderLeftColor: '#DADCE0 !important',
                  borderRightColor: '#DADCE0 !important',
                },
              },
              '& .MuiSelect-select': {
                fontSize: '0.875rem',
                color: '#1f1f1f',
                padding: '0.75rem 1rem',
              },
              '& .MuiSelect-icon': {
                color: '#1f1f1f',
              }
            }}
          >
            <Select
              value={currentValue}
              onChange={(e) => handleValueChange(fieldName, e.target.value)}
              onFocus={() => setFocusedField(fieldName)}
              onBlur={() => setFocusedField(null)}
              displayEmpty
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none',
                },
              }}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              <MenuItem value="true">True</MenuItem>
              <MenuItem value="false">False</MenuItem>
            </Select>
          </FormControl>
        </Box>
      );
    }

    if (field.type === 'enum') {
      const isFocused = focusedField === fieldName;
      const showLabel = isFocused || currentValue !== '';
      
      // If no enumValues provided, use default values
      const enumValues = field.enumValues || ['Option 1', 'Option 2', 'Option 3'];
      
      return (
        <Box sx={{ position: 'relative', width: '100%', minWidth: 200 }}>
          {/* Floating Label */}
          <Typography
            sx={{
              position: 'absolute',
              top: showLabel ? '-0.6rem' : '0.75rem',
              left: '0.75rem',
              fontSize: showLabel ? '0.75rem' : '0.875rem',
              color: '#0E4DCA',
              backgroundColor: '#FFFFFF',
              padding: showLabel ? '0 0.25rem' : '0',
              zIndex: 10,
              transition: 'all 0.2s ease',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            {getFieldFilterType(fieldName) === 'exclude' && (
              <span style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>≠</span>
            )}
            {fieldName}
          </Typography>
          
          <FormControl 
            size="small" 
            sx={{ 
              width: '100%',
              minWidth: 200,
              '& .MuiOutlinedInput-root': {
                borderRadius: '0.5rem',
                backgroundColor: '#FFFFFF',
                border: `1px solid ${isFocused ? '#0E4DCA' : '#DADCE0'} !important`,
                borderTop: `1px solid ${isFocused ? '#0E4DCA' : '#DADCE0'} !important`,
                borderBottom: `1px solid ${isFocused ? '#0E4DCA' : '#DADCE0'} !important`,
                borderLeft: `1px solid ${isFocused ? '#0E4DCA' : '#DADCE0'} !important`,
                borderRight: `1px solid ${isFocused ? '#0E4DCA' : '#DADCE0'} !important`,
                '& fieldset': {
                  border: 'none !important',
                  borderTop: 'none !important',
                  borderBottom: 'none !important',
                  borderLeft: 'none !important',
                  borderRight: 'none !important',
                },
                '&:hover': {
                  borderColor: '#0E4DCA !important',
                  borderTopColor: '#0E4DCA !important',
                  borderBottomColor: '#0E4DCA !important',
                  borderLeftColor: '#0E4DCA !important',
                  borderRightColor: '#0E4DCA !important',
                },
                '&.Mui-focused': {
                  borderColor: '#0E4DCA !important',
                  borderTopColor: '#0E4DCA !important',
                  borderBottomColor: '#0E4DCA !important',
                  borderLeftColor: '#0E4DCA !important',
                  borderRightColor: '#0E4DCA !important',
                },
                '&.Mui-disabled': {
                  borderColor: '#DADCE0 !important',
                  borderTopColor: '#DADCE0 !important',
                  borderBottomColor: '#DADCE0 !important',
                  borderLeftColor: '#DADCE0 !important',
                  borderRightColor: '#DADCE0 !important',
                },
              },
              '& .MuiSelect-select': {
                fontSize: '0.875rem',
                color: '#1f1f1f',
                padding: '0.75rem 1rem',
              },
              '& .MuiSelect-icon': {
                color: '#1f1f1f',
              }
            }}
          >
            <Select
              value={currentValue}
              onChange={(e) => handleValueChange(fieldName, e.target.value)}
              onFocus={() => setFocusedField(fieldName)}
              onBlur={() => setFocusedField(null)}
              displayEmpty
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none',
                },
              }}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {enumValues.map((value: any, index: number) => {
                // Handle object values - extract name property if it exists, otherwise convert to string
                const displayValue = typeof value === 'object' && value !== null 
                  ? (value.name || value.value || value.label || JSON.stringify(value))
                  : String(value);
                const itemValue = typeof value === 'object' && value !== null
                  ? (value.value || value.name || value.label || JSON.stringify(value))
                  : String(value);
                
                return (
                  <MenuItem key={index} value={itemValue}>
                    {displayValue}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Box>
      );
    }

    // For string, int, strong types - use text field with custom floating label
    const isFocused = focusedField === fieldName;
    const showLabel = isFocused || currentValue !== '';
    const hasError = validationErrors[fieldName];
    
    return (
      <Box sx={{ position: 'relative', width: '100%', minWidth: 200 }}>
        {/* Custom Floating Label */}
        <Typography
          sx={{
            position: 'absolute',
            top: showLabel ? '-0.6rem' : '0.75rem',
            left: '0.75rem',
            fontSize: showLabel ? '0.75rem' : '0.875rem',
            color: hasError ? '#D32F2F' : '#0E4DCA',
            backgroundColor: '#FFFFFF',
            padding: showLabel ? '0 0.25rem' : '0',
            zIndex: 10,
            transition: 'all 0.2s ease',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
        >
          {getFieldFilterType(fieldName) === 'exclude' && (
            <span style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>≠</span>
          )}
          {fieldName}
        </Typography>
        
        <TextField
          size="small"
          value={currentValue}
          onChange={(e) => handleValueChange(fieldName, e.target.value)}
          onFocus={() => setFocusedField(fieldName)}
          onBlur={() => {
            setFocusedField(null);
            handleFieldBlur(fieldName);
          }}
          placeholder=" "
          error={!!hasError}
          helperText={hasError}
          sx={{
            width: '100%',
            minWidth: 200,
            '& .MuiOutlinedInput-root': {
              borderRadius: '0.5rem',
              backgroundColor: '#FFFFFF',
              border: `1px solid ${hasError ? '#D32F2F' : isFocused ? '#0E4DCA' : '#DADCE0'} !important`,
              borderTop: `1px solid ${hasError ? '#D32F2F' : isFocused ? '#0E4DCA' : '#DADCE0'} !important`,
              borderBottom: `1px solid ${hasError ? '#D32F2F' : isFocused ? '#0E4DCA' : '#DADCE0'} !important`,
              borderLeft: `1px solid ${hasError ? '#D32F2F' : isFocused ? '#0E4DCA' : '#DADCE0'} !important`,
              borderRight: `1px solid ${hasError ? '#D32F2F' : isFocused ? '#0E4DCA' : '#DADCE0'} !important`,
              '& fieldset': {
                border: 'none !important',
                borderTop: 'none !important',
                borderBottom: 'none !important',
                borderLeft: 'none !important',
                borderRight: 'none !important',
              },
              '&:hover': {
                borderColor: hasError ? '#D32F2F' : '#0E4DCA !important',
                borderTopColor: hasError ? '#D32F2F' : '#0E4DCA !important',
                borderBottomColor: hasError ? '#D32F2F' : '#0E4DCA !important',
                borderLeftColor: hasError ? '#D32F2F' : '#0E4DCA !important',
                borderRightColor: hasError ? '#D32F2F' : '#0E4DCA !important',
              },
              '&.Mui-focused': {
                borderColor: hasError ? '#D32F2F' : '#0E4DCA !important',
                borderTopColor: hasError ? '#D32F2F' : '#0E4DCA !important',
                borderBottomColor: hasError ? '#D32F2F' : '#0E4DCA !important',
                borderLeftColor: hasError ? '#D32F2F' : '#0E4DCA !important',
                borderRightColor: hasError ? '#D32F2F' : '#0E4DCA !important',
              },
              '&.Mui-disabled': {
                borderColor: '#DADCE0 !important',
                borderTopColor: '#DADCE0 !important',
                borderBottomColor: '#DADCE0 !important',
                borderLeftColor: '#DADCE0 !important',
                borderRightColor: '#DADCE0 !important',
              },
            },
            '& .MuiInputLabel-root': {
              display: 'none', // Hide the default MUI label
            },
            '& .MuiOutlinedInput-input': {
              fontSize: '0.875rem',
              color: '#1f1f1f',
              padding: '0.75rem 1rem',
            },
            '& .MuiFormHelperText-root': {
              fontSize: '0.75rem',
              color: '#D32F2F',
              margin: '0.25rem 0 0 0',
              lineHeight: 1.2,
            },
          }}
        />
      </Box>
    );
  };

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'fixed',
        top: clickPosition ? `${clickPosition.y - 60}px` : '6.25rem',
        left: '13.75rem',
        zIndex: 1400,
        backgroundColor: '#FFFFFF',
        borderRadius: '1rem',
        boxShadow: '0px 1px 3px 0px rgba(60, 64, 67, 0.3), 0px 4px 8px 3px rgba(60, 64, 67, 0.15)',
        width: '42rem',
        maxHeight: '32rem',
        overflow: 'visible',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.5rem 1.5rem 1rem 1.5rem',
          flex: '0 0 auto'
        }}
      >
        <Box>
        <Typography
          sx={{
              fontWeight: 600,
              fontSize: '1.125rem',
              lineHeight: 1.4,
            color: '#1F1F1F',
              marginBottom: '0.25rem'
          }}
        >
          {annotationName}
        </Typography>
          <Typography
            sx={{
              fontWeight: 400,
              fontSize: '0.875rem',
              lineHeight: 1.4,
              color: '#575757'
            }}
          >
            Filter on tag values
          </Typography>
        </Box>
        <Button
          onClick={onClose}
          sx={{
            minWidth: 'auto',
            padding: 0,
            color: '#1F1F1F',
            width: '1.5rem',
            height: '1.5rem',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            }
          }}
        >
          <Close sx={{ fontSize: '1.25rem' }} />
        </Button>
      </Box>

      {/* Filter Fields Grid */}
      {!subAnnotationsloader ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.5rem 1.5rem',
            padding: '1.5rem',
            flex: '1 1 auto',
            overflowY: 'auto',
            overflowX: 'hidden',
            maxWidth: '100%',
            // Ensure floating labels are not clipped
            '& > *': {
              overflow: 'visible',
            },
          '&::-webkit-scrollbar': {
            width: '0.5rem',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '0.25rem',
              '&:hover': {
                background: 'rgba(0, 0, 0, 0.4)',
              },
          },
        }}
      >
          {filteredSubAnnotations.map((field) => (
          <Box
              key={field.name}
            sx={{
              display: 'flex',
              alignItems: 'center',
                gap: '1rem',
                padding: '1rem 0 0.75rem 0', // Extra top padding for floating labels
              width: '100%',
                minHeight: '3rem', // Ensure minimum height for proper field display
                overflow: 'visible', // Allow floating labels to be visible
              }}
            >
              {/* Checkbox */}
              <Checkbox
                checked={isFieldEnabled(field.name)}
                disabled={!getFieldValue(field.name) || getFieldValue(field.name) === ''}
                onChange={() => handleToggleField(field.name)}
                sx={{
                  padding: 0,
                  '&.Mui-checked': {
                    color: '#0E4DCA',
                  },
                  '&.Mui-disabled': {
                    color: '#DADCE0',
                    opacity: 0.5,
                  },
                  '& .MuiSvgIcon-root': {
                    fontSize: '1.25rem',
                  },
                }}
              />
              
              {/* Input Field */}
              {renderFieldInput(field)}
              
              {/* More Options Icon */}
              <Tooltip title="More Options" placement="top" arrow>
                <Button
                  onClick={(e) => handleMoreOptionsClick(e, field.name)}
                  sx={{
                    minWidth: 'auto',
                    padding: '0.25rem',
                    color: '#575757',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                >
                  <MoreVert sx={{ fontSize: '1.25rem' }} />
                </Button>
              </Tooltip>
            </Box>
          ))}
          
          {filteredSubAnnotations.length === 0 && (
            <Box
              sx={{
                gridColumn: '1 / -1',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '2rem',
              }}
            >
              <Typography
                sx={{
                  fontWeight: 400,
                  fontSize: '0.875rem',
                  color: '#575757',
                  fontStyle: 'italic',
                }}
              >
                No fields found
              </Typography>
            </Box>
          )}
              </Box>
            ) : (
              <Box
                sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '3rem',
            flex: '1 1 auto',
          }}
        >
          <CircularProgress size={32} />
        </Box>
      )}

      {/* Apply Button */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.5rem 1.5rem 0.5rem 1.5rem',
          borderTop: '1px solid #DADCE0',
                  flex: '0 0 auto'
                }}
      >
        {/* Filter Count */}
            <Typography
              sx={{
                fontSize: '0.75rem',
            color: hasValidFilters() ? '#0E4DCA' : '#5F6368',
            fontWeight: 500,
          }}
        >
          {hasValidFilters() 
            ? `${getValidFilters().length} filter${getValidFilters().length === 1 ? '' : 's'} ready to apply`
            : 'No filters ready to apply'
          }
            </Typography>
        <Button
          variant="text"
          onClick={() => {
            // Only apply valid filters when Apply button is clicked
            const validFilters = getValidFilters();
            // Pass valid filters to the parent component for annotation checkbox handling
            onSubAnnotationsApply(validFilters);
          }}
          disabled={!hasValidFilters()}
          sx={{
            color: hasValidFilters() ? '#0E4DCA' : '#DADCE0',
            fontWeight: 600,
            fontSize: '0.875rem',
            textTransform: 'none',
            padding: '0.5rem 1rem',
            cursor: hasValidFilters() ? 'pointer' : 'not-allowed',
            '&:hover': {
              backgroundColor: hasValidFilters() ? 'rgba(14, 77, 202, 0.04)' : 'transparent'
            },
            '&:disabled': {
              color: '#DADCE0',
              cursor: 'not-allowed'
            }
          }}
        >
          Apply
        </Button>
          </Box>

      {/* More Options Dropdown Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        sx={{
          '& .MuiPaper-root': {
            borderRadius: '0.5rem',
            boxShadow: '0px 1px 3px 0px rgba(60, 64, 67, 0.3), 0px 4px 8px 3px rgba(60, 64, 67, 0.15)',
            border: '1px solid #DADCE0',
            minWidth: '12rem',
          },
        }}
      >
        <MenuItem
          onClick={() => {
            if (selectedFieldForMenu) {
              handleFilterTypeChange(selectedFieldForMenu, 'include');
            }
            handleMenuClose();
          }}
          sx={{
            padding: '0.75rem 1rem',
            '&:hover': {
              backgroundColor: 'rgba(14, 77, 202, 0.04)',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: '2rem' }}>
            <FilterList sx={{ fontSize: '1rem', color: getFieldFilterType(selectedFieldForMenu || '') === 'include' ? '#0E4DCA' : '#5F6368' }} />
          </ListItemIcon>
          <ListItemText 
            primary="Include filter"
            sx={{
              '& .MuiListItemText-primary': {
                fontSize: '0.875rem',
                color: getFieldFilterType(selectedFieldForMenu || '') === 'include' ? '#0E4DCA' : '#1F1F1F',
                fontWeight: getFieldFilterType(selectedFieldForMenu || '') === 'include' ? 500 : 400,
              }
            }}
          />
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedFieldForMenu) {
              handleFilterTypeChange(selectedFieldForMenu, 'exclude');
            }
            handleMenuClose();
          }}
              sx={{
            padding: '0.75rem 1rem',
            '&:hover': {
              backgroundColor: 'rgba(14, 77, 202, 0.04)',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: '2rem' }}>
            <FilterListOff sx={{ fontSize: '1rem', color: getFieldFilterType(selectedFieldForMenu || '') === 'exclude' ? '#0E4DCA' : '#5F6368' }} />
          </ListItemIcon>
          <ListItemText 
            primary="Exclude filter"
            sx={{
              '& .MuiListItemText-primary': {
                fontSize: '0.875rem',
                color: getFieldFilterType(selectedFieldForMenu || '') === 'exclude' ? '#0E4DCA' : '#1F1F1F',
                fontWeight: getFieldFilterType(selectedFieldForMenu || '') === 'exclude' ? 500 : 400,
              }
            }}
          />
        </MenuItem>
      </Menu>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ zIndex: 1500 }}
      >
        <Alert 
          onClose={handleNotificationClose} 
          severity={notification.severity}
          sx={{ 
            width: '100%',
            '& .MuiAlert-message': {
              fontSize: '0.875rem',
            }
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FilterSubAnnotationsPanel;
