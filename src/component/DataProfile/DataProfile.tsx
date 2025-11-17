import React, { useState, useMemo, useEffect } from 'react';
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
  IconButton,
  Collapse,
  Menu,
  MenuItem,
  ListItemText,
  Checkbox,
  CircularProgress,
  TextField,
  InputAdornment,
  Tooltip
} from '@mui/material';
import {
  ExpandLess,
  FilterList,
  Close,
  ArrowUpward,
  ArrowDownward,
  InfoOutline,
} from '@mui/icons-material';
import DataProfileConfigurationsPanel from './DataProfileConfigurationsPanel';
import { useAuth } from '../../auth/AuthProvider';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../../app/store';
import { fetchDataScan, selectScanData, selectScanStatus, selectIsScanLoading } from '../../features/dataScan/dataScanSlice';

/**
 * @file DataProfile.tsx
 * @summary Renders the "Profile Results" tab for a data entry.
 *
 * @description
 * This component displays the data profiling results associated with a given data
 * entry.
 *
 * 1.  **Data Fetching**: On mount, it inspects the `entry.entrySource.labels` to
 * find a Dataplex Data Scan ID (`dataplex-dp-published-scan`).
 * 2.  **Redux Integration**: It uses this scan ID (formatted as a full scan name)
 * to check the Redux store (via `dataScanSlice` selectors) to see if the
 * profile data has already been fetched.
 * 3.  **API Call**: If the data is not in the store, it dispatches the
 * `fetchDataScan` action to retrieve it.
 * 4.  **State Handling**: It manages loading (`CircularProgress`), error, and
 * "no data" states. If no scan is associated, it displays a "No published
 * Data Profile available" message.
 * 5.  **Data Transformation**: It parses the `dataProfileScan` result from Redux
 * into a standardized `profileData` array for stable rendering.
 * 6.  **UI & Features**:
 * - Renders the data in a collapsible accordion panel.
 * - Displays a feature-rich sticky-header `Table` of the profile results.
 * - **Filtering**: Provides a text search, a multi-select property/value
 * filter dropdown, and "filter chips" for active filters.
 * - **Sorting**: Allows three-state sorting (asc, desc, off) on the
 * main columns.
 * - **Visualization**: Renders 'Statistics' as a key-value list and
 * 'Top 10 values' as a custom horizontal bar chart within the table cells.
 * - **Configurations**: Includes a "Configurations" button that opens the
 * `DataProfileConfigurationsPanel` side panel to show the scan's setup.
 *
 * @param {object} props - The props for the DataProfile component.
 * @param {any} props.entry - The data entry object, which is inspected for
 * data profile scan labels.
 *
 * @returns {JSX.Element} The rendered React component, which will be one of:
 * - A `CircularProgress` loader.
 * - A "No published Data Profile" message.
 * - The full, interactive data profile table.
 */

interface ProfileData {
  columnName: string;
  type: string;
  nullPercentage: string;
  uniquePercentage: string;
  statistics: {
    [key: string]: string| number;
  };
  topValues: Array<{
    value: string;
    percentage: string;
  }>;
}
interface DataProfileProps {
  scanName: any;
}

const DataProfile: React.FC<DataProfileProps> = ({ scanName }) => {

  const { user } = useAuth();
  const id_token = user?.token || '';
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState<boolean>(true);
  const [dataProfileAvailable, setDataProfileAvailable] = useState<boolean>(false);

  // Use selectors to get data for this specific scan
  const dataProfileScan = useSelector(selectScanData(scanName || ''));
  const dataProfileScanStatus = useSelector(selectScanStatus(scanName || ''));
  const isScanLoading = useSelector(selectIsScanLoading(scanName || ''));

  const getStatsColumnKey = (type: string) => {
    switch (type) {
      case 'STRING':
        return 'stringProfile';
      case 'INTEGER':
        return 'integerProfile';
      case 'FLOAT':
        return 'doubleProfile';
      case 'DOUBLE':
        return 'doubleProfile';
      case 'NUMERIC':
        return 'numericProfile';
      case 'BOOLEAN':
        return 'booleanProfile';
      case 'TIMESTAMP':
      case 'DATE':
        return 'dateProfile';
      default:
        return 'otherProfile';
    }
  };

 useEffect(() => {
    if (scanName && id_token && !dataProfileScan && !isScanLoading) {
      console.log("Data Profile Scan Name:", scanName);
      dispatch(fetchDataScan({ name: scanName, id_token: id_token }));
    } else if (scanName && dataProfileScan) {
      // We already have the data, no need to fetch
      setDataProfileAvailable(true);
      setLoading(false);
    } else if (!scanName) {
      setDataProfileAvailable(false);
      setLoading(false);
    }
  }, [scanName, id_token, dataProfileScan, isScanLoading, dispatch]);

  useEffect(() => {
    // Handle data scan status changes
    if (dataProfileScanStatus === 'succeeded' && dataProfileScan) {
      setDataProfileAvailable(true);
      setLoading(false);
      console.log("Data Profile Scan:", dataProfileScan);
    } else if (dataProfileScanStatus === 'failed') {
      setDataProfileAvailable(false);
      setLoading(false);
      console.log("Data Profile Scan failed");
    } else if (dataProfileScanStatus === 'idle' && !scanName) {
      setLoading(false);
    }
  }, [dataProfileScanStatus, dataProfileScan, scanName]);

  const [isExpanded, setIsExpanded] = useState(true);
  const [isConfigurationsOpen, setIsConfigurationsOpen] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<Array<{property: string, values: string[]}>>([]);
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);

  // Dummy data based on Figma design
  const profileData: ProfileData[] = [];

  dataProfileScan?.scan?.dataProfileResult?.profile?.fields.forEach((profile: any) => {
    profileData.push({
      columnName: profile.name,
      type: profile.type,
      nullPercentage: profile.profile.nullRatio ? `${(profile.profile.nullRatio * 100).toFixed(2)}%` : '0%',
      uniquePercentage: profile.profile.distinctRatio ? `${(profile.profile.distinctRatio * 100).toFixed(2)}%` : '0%',
      statistics: Object.fromEntries(
        Object.entries(profile.profile[getStatsColumnKey(profile.type)] || {}).map(([key, value]) => [key, value as string ])
      ),
      topValues: (profile.profile.topNValues || []).map((item: any) => ({
        value: item.value,
        percentage: item.ratio ? `${(item.ratio * 100).toFixed(2)}%` : '0%'
      }))
    });
  });
  console.log("Profile Data:", profileData);
  // Property names for filter dropdown
  const propertyNames = [
    'Column name',
    'Type', 
    'Null %',
    'Unique %',
    'Statistics',
    'Top 10 values'
  ];

  // Get unique values for selected property
  const getPropertyValues = (property: string) => {
    const values = new Set<string>();
    
    profileData.forEach(row => {
      switch (property) {
        case 'Column name':
          values.add(row.columnName);
          break;
        case 'Type':
          values.add(row.type);
          break;
        case 'Null %':
          values.add(row.nullPercentage);
          break;
        case 'Unique %':
          values.add(row.uniquePercentage);
          break;
        case 'Statistics':
          Object.values(row.statistics).forEach(value => values.add(value as string));
          break;
        case 'Top 10 values':
          row.topValues.forEach(item => {
            values.add(item.value);
            values.add(item.percentage);
          });
          break;
      }
    });
    
    return Array.from(values).sort();
  };

  // Filter and sort data based on selected values
  const filteredData = useMemo(() => {
    let data = profileData;
    
    // Apply text filter first
    if (filterText) {
      data = profileData.filter(row =>
        row.columnName.toLowerCase().includes(filterText.toLowerCase()) ||
        row.type.toLowerCase().includes(filterText.toLowerCase()) ||
        row.nullPercentage.toLowerCase().includes(filterText.toLowerCase()) ||
        row.uniquePercentage.toLowerCase().includes(filterText.toLowerCase()) ||
        Object.values(row.statistics).some(stat => 
          String(stat).toLowerCase().includes(filterText.toLowerCase())
        ) ||
        row.topValues.some(item => 
          item.value.toLowerCase().includes(filterText.toLowerCase()) ||
          item.percentage.toLowerCase().includes(filterText.toLowerCase())
        )
      );
    }
    
    // Apply property filters
    if (activeFilters.length > 0) {
      data = data.filter(row => {
        return activeFilters.every(filter => {
          const isMatch = filter.values.some(value => {
            switch (filter.property) {
              case 'Column name':
                return row.columnName === value;
              case 'Type':
                return row.type === value;
              case 'Null %':
                return row.nullPercentage === value;
              case 'Unique %':
                return row.uniquePercentage === value;
              case 'Statistics':
                return Object.values(row.statistics).includes(value);
              case 'Top 10 values':
                return row.topValues.some(item => 
                  item.value === value || item.percentage === value
                );
              default:
                return false;
            }
          });
          return isMatch;
        });
      });
    }

    // Apply sorting
    if (sortDirection && sortColumn) {
      data = [...data].sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        switch (sortColumn) {
          case 'columnName':
            aValue = a.columnName.toLowerCase();
            bValue = b.columnName.toLowerCase();
            break;
          case 'type':
            aValue = a.type.toLowerCase();
            bValue = b.type.toLowerCase();
            break;
          case 'nullPercentage':
            aValue = parseFloat(a.nullPercentage.replace('%', ''));
            bValue = parseFloat(b.nullPercentage.replace('%', ''));
            break;
          case 'uniquePercentage':
            aValue = parseFloat(a.uniquePercentage.replace('%', ''));
            bValue = parseFloat(b.uniquePercentage.replace('%', ''));
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
  }, [profileData, activeFilters, filterText, sortColumn, sortDirection]);

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

  // Sorting functions
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

  return loading ? (
    <Box sx={{
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #DADCE0',
        overflow: 'hidden',
        marginTop: '20px',
        display: 'flex',
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '500px'
      }}>
      <CircularProgress />
    </Box>
  ) : (dataProfileAvailable ? (
        <Box sx={{
          flex: 1,
          position: 'relative',
          marginTop: '20px',
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
            borderRadius: '8px',
            border: '1px solid #DADCE0',
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
            padding: '16px',
            backgroundColor: '#F8FAFD',
            cursor: 'pointer'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Typography
              variant="heading2Medium"  
              sx={{
                fontSize: '1.125rem',
                fontWeight: 500,
                color: '#1F1F1F',
                lineHeight: '1.33em'
              }}>
                Profile Results
              </Typography>
              <Tooltip title="Profile results provide an analysis of the data's characteristics, such as null percentages, unique value counts, and statistical properties like averages and distributions for columns" arrow>
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsConfigurationsOpen(true)
                }}
                sx={{
                  color: '#0B57D0',
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: 0,
                  minWidth: 'auto',
                  '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' }
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

          {/* Content */}
          <Collapse in={isExpanded} timeout={300}>
            <Box sx={{ padding: '20px', paddingBottom: '10px'}}>
              {/* Filter Bar */}
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '8px 16px',
                border: '1px solid #DADCE0',
                borderBottom: 'none',
                borderTopRightRadius: '8px',
                borderTopLeftRadius: '8px',
                backgroundColor: '#FFFFFF'
              }}>
                {/* Filter Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', marginLeft: '-0.5rem',}}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
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
                        <FilterList sx={{ fontSize: '16px', color: '#1f1f1f' }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Filter by selecting property and values" arrow>
                      <Typography 
                        variant="heading2Medium"  
                        onClick={handleFilterClick}
                        sx={{
                          fontSize: '12px',
                          fontWeight: 500,
                          color: '#1f1f1f',
                          lineHeight: '1.67em',
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
                        padding: '4px 8px',
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
                          color: '#0E4DCA',
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
                      }} />
                    </MenuItem>
                    {propertyNames.map((property) => (
                      <MenuItem
                        key={property}
                        onClick={() => handlePropertySelect(property)}
                        sx={{ fontSize: '12px' }}
                      >
                        <ListItemText primary={property} primaryTypographyProps={{ fontSize: '12px' }} />
                      </MenuItem>
                    ))}
                  </>
                ) : (
                  // Show values for selected property
                  <>
                    <MenuItem
                      onClick={() => setSelectedProperty('')}
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
                      }} />
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
                          minHeight: 'auto'
                        }}
                      >
                        <Checkbox
                          checked={selectedValues.includes(value)}
                          size="small"
                        />
                        <ListItemText primary={value} primaryTypographyProps={{ fontSize: '12px' }} />
                      </MenuItem>
                    ))}
                  </>
                )}
              </Menu>
              {/* Table */}
              <TableContainer sx={{ 
                maxHeight: '463px', 
                overflow: 'auto', 
                border: '1px solid #DADCE0', 
                borderBottomRightRadius: '8px', 
                borderBottomLeftRadius: '8px',
                marginTop: '0px',
                marginLeft: '0px',
                marginRight: '0px'
              }}>
                <Table stickyHeader sx={{ tableLayout: 'fixed' }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{
                        backgroundColor: '#F0F4F8',
                        borderBottom: '1px solid #DADCE0',
                        padding: '8px 16px',
                        width: '120px'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', '&:hover .MuiIconButton-root': {
    opacity: 1,
  }, }}>
                          <Typography sx={{
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: '#444746',
                            lineHeight: '1.33em',
                            letterSpacing: '0.1px'
                          }}>
                            Column name
                          </Typography>
                          <Tooltip title="Sort" arrow>
                            <IconButton size="small" onClick={() => handleSort('columnName')} sx={{ opacity: (sortColumn === 'columnName' && sortDirection !== null) ? 1 : 0 }} >
                              {getSortIcon('columnName')}
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                      <TableCell sx={{
                        backgroundColor: '#F0F4F8',
                        borderBottom: '1px solid #DADCE0',
                        padding: '8px 16px',
                        width: '100px'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', '&:hover .MuiIconButton-root': {
    opacity: 1,
  } }}>
                          <Typography sx={{
                            fontSize: '12px',
                            fontWeight: 500,
                            color: '#444746',
                            lineHeight: '1.33em',
                            letterSpacing: '0.1px'
                          }}>
                            Type
                          </Typography>
                          <Tooltip title="Sort" arrow>
                            <IconButton size="small" onClick={() => handleSort('type')} sx={{ opacity: (sortColumn === 'type' && sortDirection !== null) ? 1 : 0 }}>
                              {getSortIcon('type')}
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                      <TableCell sx={{
                        backgroundColor: '#F0F4F8',
                        borderBottom: '1px solid #DADCE0',
                        padding: '8px 16px',
                        width: '80px'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', '&:hover .MuiIconButton-root': {
    opacity: 1,
  } }}>
                          <Typography sx={{
                            fontSize: '12px',
                            fontWeight: 500,
                            color: '#444746',
                            lineHeight: '1.33em',
                            letterSpacing: '0.1px'
                          }}>
                            Null %
                          </Typography>
                          <Tooltip title="Sort" arrow>
                            <IconButton size="small" onClick={() => handleSort('nullPercentage')} sx={{ opacity: (sortColumn === 'nullPercentage' && sortDirection !== null) ? 1 : 0 }}>
                              {getSortIcon('nullPercentage')}
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                      <TableCell sx={{
                        backgroundColor: '#F0F4F8',
                        borderBottom: '1px solid #DADCE0',
                        padding: '8px 16px',
                        width: '100px'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', '&:hover .MuiIconButton-root': {
    opacity: 1,
  } }}>
                          <Typography sx={{
                            fontSize: '12px',
                            fontWeight: 500,
                            color: '#444746',
                            lineHeight: '1.33em',
                            letterSpacing: '0.1px'
                          }}>
                            Unique %
                          </Typography>
                          <Tooltip title="Sort" arrow>
                            <IconButton size="small" onClick={() => handleSort('uniquePercentage')} sx={{ opacity: (sortColumn === 'uniquePercentage' && sortDirection !== null) ? 1 : 0 }}>
                              {getSortIcon('uniquePercentage')}
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                      <TableCell sx={{
                        backgroundColor: '#F0F4F8',
                        borderBottom: '1px solid #DADCE0',
                        padding: '8px 0px',
                        width: '200px'
                      }}>
                        <Typography sx={{
                          fontSize: '12px',
                          fontWeight: 500,
                          color: '#444746',
                          lineHeight: '1.33em',
                          letterSpacing: '0.1px'
                        }}>
                          Statistics
                        </Typography>
                      </TableCell>
                      <TableCell sx={{
                        backgroundColor: '#F0F4F8',
                        borderBottom: '1px solid #DADCE0',
                        padding: '8px 8px',
                        width: '250px',
                      }}>
                        <Typography sx={{
                          fontSize: '12px',
                          fontWeight: 500,
                          color: '#444746',
                          lineHeight: '1.33em',
                          letterSpacing: '0.1px',
                          marginLeft: '10px',
                          textAlign:"center",
                        }}>
                          Top 10 values
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredData.map((row, index) => (
                      <React.Fragment key={row.columnName}>
                        <TableRow sx={{ height: '152px' }}>
                          <TableCell sx={{
                            padding: '7px 16px',
                            borderBottom: index < profileData.length - 1 ? '1px solid #DADCE0' : 'none',
                            verticalAlign: 'top'
                          }}>
                            <Typography sx={{
                              fontSize: '12px',
                              fontWeight: 400,
                              color: '#1F1F1F',
                              lineHeight: '1.33em',
                              letterSpacing: '0.1px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              width: '100%'
                            }}>
                              {row.columnName}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{
                            padding: '7px 16px',
                            borderBottom: index < profileData.length - 1 ? '1px solid #DADCE0' : 'none',
                            verticalAlign: 'top'
                          }}>
                            <Typography sx={{
                              fontSize: '12px',
                              fontWeight: 400,
                              color: '#1F1F1F',
                              lineHeight: '1.33em',
                              letterSpacing: '0.1px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              width: '100%'
                            }}>
                              {row.type}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{
                            padding: '7px 16px',
                            borderBottom: index < profileData.length - 1 ? '1px solid #DADCE0' : 'none',
                            verticalAlign: 'top'
                          }}>
                            <Typography sx={{
                              fontSize: '12px',
                              fontWeight: 400,
                              color: '#1F1F1F',
                              lineHeight: '1.33em',
                              letterSpacing: '0.1px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              width: '100%'
                            }}>
                              {row.nullPercentage}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{
                            padding: '7px 16px',
                            borderBottom: index < profileData.length - 1 ? '1px solid #DADCE0' : 'none',
                            verticalAlign: 'top'
                          }}>
                            <Typography sx={{
                              fontSize: '12px',
                              fontWeight: 400,
                              color: '#1F1F1F',
                              lineHeight: '1.33em',
                              letterSpacing: '0.1px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              width: '100%'
                            }}>
                              {row.uniquePercentage}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{
                            padding: '0px 20px 0px 0px',
                            borderBottom: index < profileData.length - 1 ? '1px solid #DADCE0' : 'none',
                            verticalAlign: 'top'
                          }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              {Object.entries(row.statistics).map(([key, value], statIndex) => (
                                <Box key={key} sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '8px 20px 8px 0px',
                                  borderBottom: statIndex < Object.keys(row.statistics).length - 1 ? '1px solid #DADCE0' : 'none',
                                  minHeight: '34px'
                                }}>
                                  <Typography sx={{
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    color: '#1F1F1F',
                                    lineHeight: '1.33em',
                                    letterSpacing: '0.1px',
                                    width: '101px', 
                                  }}>
                                    {key.charAt(0).toUpperCase() + key.slice(1)}
                                  </Typography>
                                  <Typography sx={{
                                    fontSize: '12px',
                                    fontWeight: 400,
                                    color: '#1F1F1F',
                                    lineHeight: '1.33em',
                                    letterSpacing: '0.1px'
                                  }}>
                                    {typeof value === 'number' 
                                      ? (Math.floor(value * 100) / 100).toString() 
                                      : value}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          </TableCell>
                         <TableCell sx={{
                            padding: '0px 16px',
                            borderBottom: index < profileData.length - 1 ? '1px solid #DADCE0' : 'none',
                            verticalAlign: 'top'
                          }}>
                            {(() => {
                              const numBars = row.topValues.length;
                              if (numBars === 0) return null;
                              const topOffset = 6.5;
                              const bottomLabelAreaHeight = 46;
                              const minBarHeight = 6;
                              const minGap = 8;
                              const minStep = minBarHeight + minGap;
                              const defaultTotalAvailableHeight = 142 - bottomLabelAreaHeight - topOffset;
                              const minHeightForInternalText = 16; 
                              const minWidthForInternalText = 40;  
                              let barStep;
                              let barHeight;
                              let totalAvailableHeight;
                              const slimBarStep = defaultTotalAvailableHeight / numBars;
                              const slimBarHeight = slimBarStep - minGap;

                              if (slimBarHeight < minBarHeight) {
                                  barHeight = minBarHeight;
                                  barStep = minStep;
                                  totalAvailableHeight = numBars * barStep;
                              } else {
                                  barHeight = slimBarHeight;
                                  barStep = slimBarStep;
                                  totalAvailableHeight = defaultTotalAvailableHeight;
                              }

                              const isBarTooSmall = barHeight < minHeightForInternalText;
                              const finalChartHeight = totalAvailableHeight + topOffset + bottomLabelAreaHeight;
                              const finalGridLineHeight = totalAvailableHeight + topOffset;
                              const maxPercentage = Math.max(...row.topValues.map(item => parseFloat(item.percentage) || 0), 0);
                              
                              let axisMax;
                              if (maxPercentage > 70) {
                                  axisMax = 100;
                              } else {
                                  axisMax = Math.ceil(maxPercentage / 10) * 10;
                              }
                              
                              if (axisMax === 0) {
                                  axisMax = 10;
                              }

                              return (
                                <Box sx={{
                                  display: 'flex',
                                  alignItems:"center",
                                  justifyContent:"center"
                                }}>
                                  <Box sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px',
                                    padding: '7px 0px',
                                    width: '216px',
                                    height: `${finalChartHeight}px`,
                                    position: 'relative'
                                  }}>
                                    <Box sx={{
                                      position: 'absolute',
                                      top: '0px',
                                      left: '47px',
                                      width: '152px',
                                      height: `${finalGridLineHeight}px`
                                    }}>
                                      <Box sx={{ position: 'absolute', left: '8px', width: '1px', height: '100%', backgroundColor: '#DADCE0' }} />
                                      <Box sx={{ position: 'absolute', left: '44px', width: '1px', height: '100%', backgroundColor: '#DADCE0' }} />
                                      <Box sx={{ position: 'absolute', left: '80px', width: '1px', height: '100%', backgroundColor: '#DADCE0' }} />
                                      <Box sx={{ position: 'absolute', left: '116px', width: '1px', height: '100%', backgroundColor: '#DADCE0' }} />
                                      <Box sx={{ position: 'absolute', left: '152px', width: '1px', height: '100%', backgroundColor: '#DADCE0' }} />
                                    </Box>
                                    {row.topValues.map((item, valueIndex) => {
                                      const percentage = parseFloat(item.percentage) || 0;
                                      const barWidth = (Math.min(percentage, axisMax) / axisMax) * 144; 
                                      const showTextOutside = isBarTooSmall || barWidth < minWidthForInternalText;

                                      return (
                                        <Box key={valueIndex} sx={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '7px', 
                                          position: 'absolute',
                                          top: `${topOffset + (valueIndex * barStep)}px`,
                                          left: '0px',
                                          width: '100%',
                                        }}>
                                          <Tooltip title={item.value} arrow>
                                            <Typography sx={{
                                              fontSize: '12px',
                                              fontWeight: 400,
                                              color: '#1F1F1F',
                                              lineHeight: '1.33em',
                                              letterSpacing: '0.1px',
                                              width: '48px',
                                              textAlign: 'right',
                                              overflow: 'hidden',
                                              whiteSpace: 'nowrap',
                                              cursor: 'pointer',
                                              flexShrink: 0 
                                            }}>
                                              {item.value.length > 5 ? 
                                                item.value.substring(0, item.value.lastIndexOf(' ', 5)) || item.value.substring(0, 5) : 
                                                item.value
                                              }
                                            </Typography>
                                          </Tooltip>
                                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Box sx={{
                                              width: `${barWidth}px`, 
                                              height: `${barHeight}px`,
                                              backgroundColor: '#0B57D0',
                                              borderRadius: '4px',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              flexShrink: 0
                                            }}>
                                              <Typography sx={{
                                                fontSize: '12px',
                                                fontWeight: 400,
                                                color: '#FFFFFF',
                                                lineHeight: '1.33em',
                                                letterSpacing: '0.1px',
                                                display: showTextOutside ? 'none' : 'block'
                                              }}>
                                                {item.percentage}
                                              </Typography>
                                            </Box>
                                            {showTextOutside && (
                                              <>
                                                <Box sx={{ 
                                                  width: '10px', 
                                                  height: '1px', 
                                                  backgroundColor: '#1F1F1F',
                                                }}/>
                                                <Typography sx={{
                                                  fontSize: '12px',
                                                  fontWeight: 400,
                                                  color: '#1F1F1F', 
                                                  lineHeight: '1.33em',
                                                  letterSpacing: '0.1px',
                                                  whiteSpace: 'nowrap',
                                                  marginLeft: '2px'
                                                }}>
                                                  {item.percentage}
                                                </Typography>
                                              </>
                                            )}
                                          </Box>

                                        </Box>
                                      )
                                    })}
                                   <Box sx={{
                                      position: 'absolute',
                                      bottom: '16px',
                                      left: '47px',
                                      width: '152px',
                                      height: '16px'
                                    }}>
                                      <Typography sx={{
                                        position: 'absolute',
                                        left: '8px', 
                                        transform: 'translateX(-50%)', 
                                        fontSize: '11px',
                                        fontWeight: 500,
                                        color: '#1F1F1F',
                                        lineHeight: '1.45em',
                                      }}>
                                        0%
                                      </Typography>
                                      <Typography sx={{
                                        position: 'absolute',
                                        left: '80px', 
                                        transform: 'translateX(-50%)', 
                                        fontSize: '11px',
                                        fontWeight: 500,
                                        color: '#1F1F1F',
                                        lineHeight: '1.45em',
                                      }}>
                                        {`${axisMax / 2}%`}
                                      </Typography>
                                      <Typography sx={{
                                        position: 'absolute',
                                        left: '152px', 
                                        transform: 'translateX(-50%)', 
                                        fontSize: '11px',
                                        fontWeight: 500,
                                        color: '#1F1F1F',
                                        lineHeight: '1.45em',
                                      }}>
                                        {`${axisMax}%`}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Box>
                              );
                            })()}
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Collapse>
          <DataProfileConfigurationsPanel
            isOpen={isConfigurationsOpen}
            onClose={() => setIsConfigurationsOpen(false)}
            dataProfileScan={dataProfileScan}
          />
          </Box>
        </Box>
      ) : (
      <Box sx={{
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #DADCE0',
        overflow: 'hidden',
        marginTop: '20px',
        display: 'flex',
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '500px'
      }}>
        <Typography sx={{
          fontSize: '14px',
          fontWeight: 400,
          color: '#575757',
          lineHeight: '1.43em'
        }}>
          No published Data Profile available for this entry
        </Typography>
    </Box>)
  );
};

export default DataProfile;
