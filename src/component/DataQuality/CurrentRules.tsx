import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  IconButton,
  Collapse,
  Menu,
  MenuItem,
  ListItemText,
  TextField,
  InputAdornment,
  Tooltip
} from '@mui/material';
import { 
  FilterList,
  Close,
  ArrowUpward,
  ArrowDownward,
  ExpandLess,
  InfoOutline
} from '@mui/icons-material';
import ConfigurationsPanel from './ConfigurationsPanel';

/**
 * @file CurrentRules.tsx
 * @summary Renders the "Current Rules" panel for a Data Quality scan.
 *
 * @description
 * This component displays the specific data quality rules defined for a scan.
 * It receives the `dataQualtyScan` object, processes its
 * `dataQualitySpec.rules` array, and renders them within a collapsible
 * panel (`Collapse` component).
 *
 * Key features include:
 * 1.  **Collapsible Panel**: The entire component can be expanded or
 * collapsed using the header.
 * 2.  **Filtering**: Provides a robust filter bar with:
 * - A free-text search (`filterText`).
 * - An advanced, multi-select, property-value dropdown menu
 * (e.g., filter by 'Rule Type' or 'Dimensions').
 * - "Filter chips" (`activeFilters`) that display all currently
 * applied filters, which can be cleared.
 * 3.  **Sortable Table**: Renders the rules in a `Table` with a sticky
 * header. The columns are sortable with three states (ascending, descending, off).
 * 4.  **Configurations Panel**: Includes a "Configurations" button that
 * opens the `ConfigurationsPanel` component as a slide-out overlay,
 * passing the `dataQualtyScan` data to it.
 *
 * The component manages all internal state for filtering, sorting, and
 * panel expansion.
 *
 * @param {object} props - The props for the CurrentRules component.
 * @param {any} props.dataQualtyScan - The full data quality scan object.
 * This component primarily uses the `dataQualtyScan.scan.dataQualitySpec.rules`
 * array to populate the table.
 *
 * @returns {JSX.Element} A React component rendering the collapsible
 * "Current Rules" table, its filter controls, and the associated
 * `ConfigurationsPanel`.
 */

interface RuleData {
  id: number;
  columnName: string;
  ruleName: string;
  ruleType: string;
  evaluation: string;
  dimensions: string;
  parameters: string;
  threshold: string;
}

interface CurrentRulesProps {
  dataQualtyScan: any;
}

const CurrentRules: React.FC<CurrentRulesProps> = ({dataQualtyScan}) => {
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);
  const [filterText, setFilterText] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [isConfigurationsOpen, setIsConfigurationsOpen] = useState(false);
  //const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  useEffect(() => {
    setFilterText('');
    setIsExpanded(true);
  }, []);

  // Debug: Monitor selectedRows changes
  // useEffect(() => {
  //   console.log('selectedRows changed:', Array.from(selectedRows));
  // }, [selectedRows]);
  
  // Filter dropdown state
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<Array<{property: string, values: string[]}>>([]);

  // Dummy data for rules
  const rulesData: RuleData[] = [];

  dataQualtyScan.scan?.dataQualitySpec?.rules.forEach((rule: any, index: number) => {
    rulesData.push({
      id: index+1,
      columnName: rule.column,
      ruleName: rule.name || '',
      ruleType: rule.ruleType,
      evaluation: rule.evaluation,
      dimensions: rule.dimension,
      parameters: rule[rule.ruleType] && Object.keys(rule[rule.ruleType]).length > 0 ? JSON.stringify(rule[rule.ruleType]) : '',
      threshold: rule.threshold != null ? `${Math.floor(rule.threshold * 10000) / 100}%` : 'N/A'
    });
  });

  // Property names for filter dropdown
  const propertyNames = [
    'Column Name',
    'Rule Name', 
    'Rule Type',
    'Evaluation',
    'Dimensions',
    'Parameters',
    'Threshold'
  ];

  // Get unique values for selected property
  const getPropertyValues = (property: string) => {
    const values = new Set<string>();
    
    rulesData.forEach(row => {
      switch (property) {
        case 'Column Name':
          values.add(row.columnName);
          break;
        case 'Rule Name':
          if (row.ruleName) values.add(row.ruleName);
          break;
        case 'Rule Type':
          values.add(row.ruleType);
          break;
        case 'Evaluation':
          values.add(row.evaluation);
          break;
        case 'Dimensions':
          values.add(row.dimensions);
          break;
        case 'Parameters':
          if (row.parameters) values.add(row.parameters);
          break;
        case 'Threshold':
          values.add(row.threshold);
          break;
      }
    });
    
    return Array.from(values).sort();
  };

   const availablePropertyNames = useMemo(() => {
      return propertyNames.filter(property => {
        const values = getPropertyValues(property);
        return values.some(value => String(value).trim().length > 0);
      });
    }, [rulesData]);

  // Filter and sort data based on selected values
  const filteredData = useMemo(() => {
    let data = rulesData;
    
    // Apply text filter first
    if (filterText) {
      data = rulesData.filter(rule =>
        rule.columnName.toLowerCase().includes(filterText.toLowerCase()) ||
        rule.ruleName.toLowerCase().includes(filterText.toLowerCase()) ||
        rule.ruleType.toLowerCase().includes(filterText.toLowerCase()) ||
        rule.dimensions.toLowerCase().includes(filterText.toLowerCase())
      );
    }
    
    // Apply property filters
    if (activeFilters.length > 0) {
      data = data.filter(row => {
        return activeFilters.every(filter => {
          const isMatch = filter.values.some(value => {
            switch (filter.property) {
              case 'Column Name':
                return row.columnName === value;
              case 'Rule Name':
                return row.ruleName === value;
              case 'Rule Type':
                return row.ruleType === value;
              case 'Evaluation':
                return row.evaluation === value;
              case 'Dimensions':
                return row.dimensions === value;
              case 'Parameters':
                return row.parameters === value;
              case 'Threshold':
                return row.threshold === value;
              default:
                return false;
            }
          });
          return isMatch;
        });
      });
    }

    // Apply sorting
    if (sortDirection && sortColumn && data.length > 0) {
      data = [...data].sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        switch (sortColumn) {
          case 'columnName':
            aValue = String(a.columnName || '').toLowerCase();
            bValue = String(b.columnName || '').toLowerCase();
            break;
          case 'ruleName':
            aValue = String(a.ruleName || '').toLowerCase();
            bValue = String(b.ruleName || '').toLowerCase();
            break;
          case 'ruleType':
            aValue = String(a.ruleType || '').toLowerCase();
            bValue = String(b.ruleType || '').toLowerCase();
            break;
          case 'evaluation':
            aValue = String(a.evaluation || '').toLowerCase();
            bValue = String(b.evaluation || '').toLowerCase();
            break;
          case 'dimensions':
            aValue = String(a.dimensions || '').toLowerCase();
            bValue = String(b.dimensions || '').toLowerCase();
            break;
          case 'parameters':
            aValue = String(a.parameters || '').toLowerCase();
            bValue = String(b.parameters || '').toLowerCase();
            break;
          case 'threshold':
            aValue = parseFloat(a.threshold.replace('%', ''));
            bValue = parseFloat(b.threshold.replace('%', ''));
            break;
          default:
            return 0;
        }

        if (sortDirection === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
    }

    return data;
  }, [rulesData, activeFilters, filterText, sortColumn, sortDirection]);

  // Event handlers for filter dropdown
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
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => {
        if (prev === 'asc') return 'desc';
        if (prev === 'desc') return null;
        return 'asc';
      });
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column || sortDirection === null) {
      return <ArrowUpward sx={{ fontSize: '16px', opacity: 0.3 }} />;
    }
    return sortDirection === 'asc' ? <ArrowUpward sx={{ fontSize: '16px' }} /> : <ArrowDownward sx={{ fontSize: '16px' }} />;
  };

  const handleConfigurationsClick = () => {
    setIsConfigurationsOpen(true);
  };

  const handleConfigurationsClose = () => {
    setIsConfigurationsOpen(false);
  };

  // const handleSelectAll = () => {
  //   const filteredRowIds = filteredData.map(row => row.id);
    
  //   // Check if all filtered rows are currently selected
  //   const allFilteredRowsSelected = filteredRowIds.every(id => selectedRows.has(id));
    
  //   console.log('handleSelectAll called:', {
  //     filteredRowIds,
  //     allFilteredRowsSelected,
  //     currentSelectedRows: Array.from(selectedRows)
  //   });
    
  //   if (allFilteredRowsSelected) {
  //     // If all filtered rows are selected, deselect all filtered rows
  //     const newSelectedRows = new Set(selectedRows);
  //     filteredRowIds.forEach(id => newSelectedRows.delete(id));
  //     setSelectedRows(newSelectedRows);
  //     console.log('Deselecting all filtered rows');
  //   } else {
  //     // Select all filtered rows (keep any existing selections from other filters)
  //     const newSelectedRows = new Set(selectedRows);
  //     filteredRowIds.forEach(id => newSelectedRows.add(id));
  //     setSelectedRows(newSelectedRows);
  //     console.log('Selecting all filtered rows');
  //   }
  // };

  // const handleSelectRow = (rowId: number) => {
  //   const newSelectedRows = new Set(selectedRows);
  //   if (newSelectedRows.has(rowId)) {
  //     newSelectedRows.delete(rowId);
  //     console.log('Deselecting row:', rowId);
  //   } else {
  //     newSelectedRows.add(rowId);
  //     console.log('Selecting row:', rowId);
  //   }
  //   setSelectedRows(newSelectedRows);
  // };

  return (
    <Box sx={{
      flex: 2,
      position: 'relative'
    }}>
      {/* Dark overlay when configurations panel is open */}
      {isConfigurationsOpen && (
        <Box 
          onClick={() => setIsConfigurationsOpen(false)}
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            cursor: 'pointer'
          }} 
        />
      )}
      <Box sx={{
        backgroundColor: '#ffffff',
        borderRadius: '0.5rem',
        border: '1px solid #E0E0E0',
        overflow: 'hidden',
        position: 'relative'
      }}>
      {/* Header */}
      <Box 
        onClick={() => setIsExpanded(!isExpanded)}
        sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.969rem 1.25rem',
        backgroundColor: '#F8FAFD',
        cursor: 'pointer'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Typography
          variant="heading2Medium"  
           sx={{
            fontSize: '1.125rem',
            fontWeight: 500,
            color: '#1F1F1F',
            lineHeight: '1.5em'
          }}>
            Current Rules
          </Typography>
          <Tooltip title="Current rules signifies the rules applied to define and run data quality checks on the asset" arrow>
            <InfoOutline
                sx={{
                    fontWeight: 800,
                    width: "18px",
                    height: "18px",
                    opacity: 0.9
                }}
            />
          </Tooltip>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleConfigurationsClick();
            }}
            sx={{
              textTransform: 'none',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#0B57D0',
              padding: '0.375rem 0.75rem',
              minWidth: 'auto',
              '&:hover': {
                backgroundColor: 'transparent',
                textDecoration: 'underline'
              }
            }}
          >
            Configurations
          </Button>
          <IconButton
            size="small"
            onClick={() => setIsExpanded(!isExpanded)}
            sx={{
              padding: '0.25rem',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            <ExpandLess sx={{ 
              fontSize: '1.5rem',
              transform: isExpanded ? 'rotate(0deg)' : 'rotate(180deg)',
              transition: 'transform 0.2s ease'
            }} />
          </IconButton>
        </Box>
      </Box>

      {/* Filter Bar */}
      <Collapse in={isExpanded} timeout={300}>
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            border: '1px solid #DADCE0',
            borderTopRightRadius: '0.5rem',
            borderTopLeftRadius: '0.5rem',
            backgroundColor: '#FFFFFF',
            margin: '0.625rem 0.625rem 0rem 0.625rem',
        }}>
          {/* Filter Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', marginLeft: '-0.5rem', }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Tooltip title="Filter by selecting property and values" arrow>
                <IconButton
                  size="small"
                  onClick={handleFilterClick}
                  sx={{
                    padding: '4px',
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
                  variant="heading2Medium"  
                  onClick={handleFilterClick}
                  sx={{
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    lineHeight: 1.67,
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
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Enter property name or value"
              variant="outlined"
              size="small"
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  fontSize: '0.75rem',
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
                  padding: '4px 8px',
                  fontSize: '0.75rem',
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
                  fontSize: '0.6875rem',
                  color: '#0B57D0',
                  textTransform: 'none',
                  padding: '0.125rem 0.5rem',
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
              gap: '0.375rem',
              paddingTop: '4px'
            }}>
              {activeFilters.map((filter) => (
                <Box
                  key={filter.property}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.25rem 0.5rem',
                    backgroundColor: '#E7F0FE',
                    border: '1px solid #0E4DCA',
                    borderRadius: '16px',
                    fontSize: '11px'
                  }}
                >
                  <Typography sx={{ 
                    fontSize: '0.6875rem', 
                    fontWeight: 500,
                    color: '#0E4DCA'
                  }}>
                    {filter.property}:
                  </Typography>
                  <Typography sx={{ 
                    fontSize: '0.6875rem', 
                    color: '#1F1F1F'
                  }}>
                    {filter.values.join(', ')}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveFilter(filter.property)}
                    sx={{
                      padding: '0.125rem',
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
                      fontSize: '0.75rem', 
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
        PaperProps={{
          sx: {
            maxHeight: 300,
            width: 250
          }
        }}
      >
        {!selectedProperty ? (
          // Show property names
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
          {availablePropertyNames.map((property) => (
            <MenuItem 
              key={property} 
              onClick={() => handlePropertySelect(property)}
              sx={{ fontSize: '12px' }}
            >
              <ListItemText primary={property} primaryTypographyProps={{ fontSize: '12px'}}/>
            </MenuItem>
          ))}
          </>
        ) : (
          // Show values for selected property
          <>
            <MenuItem 
              onClick={() => setSelectedProperty('')}
              sx={{ fontSize: '0.6875rem', 
                fontWeight: 400,
                backgroundColor: '#F8F9FA',
                borderBottom: '1px solid #E0E0E0',
                marginTop: '-8px',
                paddingTop: 1.30,
                paddingBottom: 1.30, }}
            >
              <ListItemText primary={`← Back to Properties`} primaryTypographyProps={{ fontSize: '12px' }} />
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
                        <ListItemText primary={`Filter by: ${selectedProperty}`} primaryTypographyProps={{
                    fontSize: '12px',
                  }}/>
                      </MenuItem>
            {getPropertyValues(selectedProperty).map((value) => (
              <MenuItem 
                key={value} 
                onClick={() => handleValueToggle(value)}
                sx={{ fontSize: '12px', 
                      paddingTop: '2px',
                      paddingBottom: '2px',
                      paddingLeft: '8px',
                      paddingRight: '8px',
                      minHeight: 'auto'
                    }}
              >
                <Checkbox 
                  checked={selectedValues.includes(value)}
                  size="small"
                />
                <ListItemText primary={value} primaryTypographyProps={{ fontSize: '12px'}}/>
              </MenuItem>
            ))}
          </>
        )}
      </Menu>

      {/* Table */}
      <Collapse in={isExpanded} timeout={300}>
        <TableContainer sx={{ 
          maxHeight: '400px', 
          overflowY: 'auto',
          overflowX: 'hidden',
          border: '1px solid #DADCE0',
          borderTop: 'none', 
          borderBottomRightRadius: '8px', 
          borderBottomLeftRadius: '8px', 
          margin: '0px 10px 10px 10px',
          width: 'calc(100% - 20px)',
          '&::-webkit-scrollbar': {
            width: '8px'
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#f1f1f1',
            borderRadius: '4px'
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#c1c1c1',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: '#a8a8a8'
            }
          }
        }}>
        <Table stickyHeader sx={{ tableLayout: 'fixed', width: '100%' }}>
          <TableHead>
            <TableRow>
              <TableCell 
                sx={{
                  backgroundColor: '#F0F4F8',
                  borderBottom: '1px solid #DADCE0',
                  padding: '0.375rem 0.5rem',
                  minHeight: '40px',
                  width: '15%'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', '&:hover .MuiIconButton-root': {
    opacity: 1,
  } }}>
                  <Typography sx={{
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: '#444746',
                    lineHeight: 1.33,
                    letterSpacing: '0.1px',
                    whiteSpace: 'nowrap'
                  }}>
                    Column Name
                  </Typography>
                  <Tooltip title="Sort" arrow>
                    <IconButton size="small" onClick={() => handleSort('columnName')}  sx={{ opacity: (sortColumn === 'columnName' && sortDirection !== null) ? 1 : 0 }}>
                      {getSortIcon('columnName')}
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
              <TableCell sx={{
                backgroundColor: '#F0F4F8',
                borderBottom: '1px solid #DADCE0',
                padding: '6px 8px',
                minHeight: '40px',
                width: '12%'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', '&:hover .MuiIconButton-root': {
    opacity: 1,
  } }}>
                  <Typography sx={{
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: '#444746',
                    lineHeight: 1.33,
                    letterSpacing: '0.1px',
                    whiteSpace: 'nowrap'
                  }}>
                    Rule Name
                  </Typography>
                  <Tooltip title="Sort" arrow>
                    <IconButton size="small" onClick={() => handleSort('ruleName')} sx={{ opacity: (sortColumn === 'ruleName' && sortDirection !== null) ? 1 : 0 }}>
                      {getSortIcon('ruleName')}
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
              <TableCell sx={{
                backgroundColor: '#F0F4F8',
                borderBottom: '1px solid #DADCE0',
                padding: '6px 8px',
                minHeight: '40px',
                width: '12%'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', '&:hover .MuiIconButton-root': {
    opacity: 1,
  } }}>
                  <Typography sx={{
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: '#444746',
                    lineHeight: 1.33,
                    letterSpacing: '0.1px',
                    whiteSpace: 'nowrap'
                  }}>
                    Rule Type
                  </Typography>
                  <Tooltip title="Sort" arrow>
                    <IconButton size="small" onClick={() => handleSort('ruleType')} sx={{ opacity: (sortColumn === 'ruleType' && sortDirection !== null) ? 1 : 0 }}>
                      {getSortIcon('ruleType')}
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
              <TableCell sx={{
                backgroundColor: '#F0F4F8',
                borderBottom: '1px solid #DADCE0',
                padding: '6px 8px',
                minHeight: '40px',
                width: '12%'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', '&:hover .MuiIconButton-root': {
    opacity: 1,
  } }}>
                  <Typography sx={{
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: '#444746',
                    lineHeight: 1.33,
                    letterSpacing: '0.1px',
                    whiteSpace: 'nowrap'
                  }}>
                    Evaluation
                  </Typography>
                  <Tooltip title="Sort" arrow>
                    <IconButton size="small" onClick={() => handleSort('evaluation')} sx={{ opacity: (sortColumn === 'evaluation' && sortDirection !== null) ? 1 : 0 }}>
                      {getSortIcon('evaluation')}
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
              <TableCell sx={{
                backgroundColor: '#F0F4F8',
                borderBottom: '1px solid #DADCE0',
                padding: '6px 8px',
                minHeight: '40px',
                width: '15%'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', '&:hover .MuiIconButton-root': {
    opacity: 1,
  } }}>
                  <Typography sx={{
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: '#444746',
                    lineHeight: 1.33,
                    letterSpacing: '0.1px',
                    whiteSpace: 'nowrap'
                  }}>
                    Dimensions
                  </Typography>
                  <Tooltip title="Sort" arrow>
                    <IconButton size="small" onClick={() => handleSort('dimensions')} sx={{ opacity: (sortColumn === 'dimensions' && sortDirection !== null) ? 1 : 0 }}>
                      {getSortIcon('dimensions')}
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
              <TableCell sx={{
                backgroundColor: '#F0F4F8',
                borderBottom: '1px solid #DADCE0',
                padding: '6px 8px',
                minHeight: '40px',
                width: '25%'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', '&:hover .MuiIconButton-root': {
    opacity: 1,
  } }}>
                  <Typography sx={{
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: '#444746',
                    lineHeight: 1.33,
                    letterSpacing: '0.1px',
                    whiteSpace: 'nowrap'
                  }}>
                    Parameters
                  </Typography>
                  <Tooltip title="Sort" arrow>
                    <IconButton size="small" onClick={() => handleSort('parameters')} sx={{ opacity: (sortColumn === 'parameters' && sortDirection !== null) ? 1 : 0 }}>
                      {getSortIcon('parameters')}
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
              <TableCell sx={{
                backgroundColor: '#F0F4F8',
                borderBottom: '1px solid #DADCE0',
                padding: '6px 8px',
                minHeight: '40px',
                width: '12%'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', '&:hover .MuiIconButton-root': {
    opacity: 1,
  } }}>
                  <Typography sx={{
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: '#444746',
                    lineHeight: 1.33,
                    letterSpacing: '0.1px',
                    whiteSpace: 'nowrap'
                  }}>
                    Threshold
                  </Typography>
                  <Tooltip title="Sort" arrow>
                    <IconButton size="small" onClick={() => handleSort('threshold')} sx={{ opacity: (sortColumn === 'threshold' && sortDirection !== null) ? 1 : 0 }}>
                      {getSortIcon('threshold')}
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.map((rule, index) => (
              <TableRow key={rule.id} sx={{ 
                '&:hover': { backgroundColor: '#F8F9FA' } 
              }}>
                <TableCell sx={{ 
                  padding: '0.375rem 0.5rem', 
                  borderBottom: index === filteredData.length - 1 ? 'none' : '1px solid #DADCE0',
                  fontSize: '0.75rem',
                  color: '#1F1F1F',
                  fontWeight: 400,
                  lineHeight: 1.33,
                  letterSpacing: '0.1px',
                  wordWrap: 'break-word',
                  wordBreak: 'break-word',
                  hyphens: 'auto',
                  WebkitHyphens: 'auto',
                  msHyphens: 'auto',
                  verticalAlign: 'top'
                }}>
                  {rule.columnName}
                </TableCell>
                <TableCell sx={{ 
                  padding: '0.375rem 0.5rem', 
                  borderBottom: index === filteredData.length - 1 ? 'none' : '1px solid #DADCE0',
                  fontSize: '0.75rem',
                  color: '#1F1F1F',
                  fontWeight: 400,
                  lineHeight: 1.33,
                  letterSpacing: '0.1px',
                  wordWrap: 'break-word',
                  wordBreak: 'break-word',
                  hyphens: 'auto',
                  WebkitHyphens: 'auto',
                  msHyphens: 'auto',
                  verticalAlign: 'top'
                }}>
                  {rule.ruleName}
                </TableCell>
                <TableCell sx={{ 
                  padding: '0.375rem 0.5rem', 
                  borderBottom: index === filteredData.length - 1 ? 'none' : '1px solid #DADCE0',
                  fontSize: '0.75rem',
                  color: '#1F1F1F',
                  fontWeight: 400,
                  lineHeight: 1.33,
                  letterSpacing: '0.1px',
                  wordWrap: 'break-word',
                  wordBreak: 'break-word',
                  hyphens: 'auto',
                  WebkitHyphens: 'auto',
                  msHyphens: 'auto',
                  verticalAlign: 'top'
                }}>
                  {rule.ruleType}
                </TableCell>
                <TableCell sx={{ 
                  padding: '0.375rem 0.5rem', 
                  borderBottom: index === filteredData.length - 1 ? 'none' : '1px solid #DADCE0',
                  fontSize: '0.75rem',
                  color: '#1F1F1F',
                  fontWeight: 400,
                  lineHeight: 1.33,
                  letterSpacing: '0.1px',
                  wordWrap: 'break-word',
                  wordBreak: 'break-word',
                  hyphens: 'auto',
                  WebkitHyphens: 'auto',
                  msHyphens: 'auto',
                  verticalAlign: 'top'
                }}>
                  {rule.evaluation}
                </TableCell>
                <TableCell sx={{ 
                  padding: '0.375rem 0.5rem', 
                  borderBottom: index === filteredData.length - 1 ? 'none' : '1px solid #DADCE0',
                  fontSize: '0.75rem',
                  color: '#1F1F1F',
                  fontWeight: 400,
                  lineHeight: 1.33,
                  letterSpacing: '0.1px',
                  wordWrap: 'break-word',
                  wordBreak: 'break-word',
                  hyphens: 'auto',
                  WebkitHyphens: 'auto',
                  msHyphens: 'auto',
                  verticalAlign: 'top'
                }}>
                  {rule.dimensions}
                </TableCell>
                <TableCell sx={{ 
                  padding: '0.375rem 0.5rem', 
                  borderBottom: index === filteredData.length - 1 ? 'none' : '1px solid #DADCE0',
                  fontSize: '0.75rem',
                  color: '#1F1F1F',
                  fontWeight: 400,
                  lineHeight: 1.33,
                  letterSpacing: '0.1px',
                  wordWrap: 'break-word',
                  wordBreak: 'break-word',
                  hyphens: 'auto',
                  WebkitHyphens: 'auto',
                  msHyphens: 'auto',
                  verticalAlign: 'top'
                }}>
                  {rule.parameters}
                </TableCell>
                <TableCell sx={{ 
                  padding: '0.375rem 0.5rem', 
                  borderBottom: index === filteredData.length - 1 ? 'none' : '1px solid #DADCE0',
                  fontSize: '0.75rem',
                  color: '#1F1F1F',
                  fontWeight: 400,
                  lineHeight: 1.33,
                  letterSpacing: '0.1px',
                  wordWrap: 'break-word',
                  wordBreak: 'break-word',
                  hyphens: 'auto',
                  WebkitHyphens: 'auto',
                  msHyphens: 'auto',
                  verticalAlign: 'top'
                }}>
                  {rule.threshold}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      </Collapse>

      {/* Configurations Panel */}
      <ConfigurationsPanel 
        isOpen={isConfigurationsOpen}
        onClose={handleConfigurationsClose}
        dataQualtyScan={dataQualtyScan}
      />
      </Box>
    </Box>
  );
};

export default CurrentRules;
