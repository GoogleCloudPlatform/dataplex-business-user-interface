import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  CircularProgress,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Checkbox,
  ListItemText,
  InputAdornment,
  Button,
} from '@mui/material';
import {
  FilterList,
  ArrowUpward,
  ArrowDownward,
  Close,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../../app/store';
import { fetchEntriesByParent } from '../../features/resources/resourcesSlice';
import { useAuth } from '../../auth/AuthProvider';
import { fetchEntry, pushToHistory } from '../../features/entry/entrySlice';

/**
 * @file EntryList.tsx
 * @description
 * This component renders a detailed list of child entries for a given parent resource.
 *
 * It performs the following functions:
 * 1.  **Fetches Data**: On mount, it dispatches a Redux action (`fetchEntriesByParent`)
 * using the parent `entry.name` to get a list of its child entries.
 * 2.  **Manages State**: It handles loading and error states for the data fetch.
 * 3.  **Displays Data**: It renders the fetched entries in a Material-UI `Table`.
 * 4.  **Provides Interactivity**:
 * - **Sorting**: Allows users to sort the table by "Name" and "Last Modification Time".
 * - **Filtering**: Provides a filter menu to filter entries by specific property
 * values (Name, Description, Last Modification Time).
 * - **Searching**: Includes a free-text search bar that filters the list based on
 * user input.
 * 5.  **Handles Navigation**: When a user clicks on an entry's name, it dispatches
 * Redux actions (`pushToHistory` and `fetchEntry`) to update the application
 * state and load the details for that specific entry.
 *
 * @param {EntryListProps} props - The props for the component.
 * @param {any} [props.entry] - The parent entry object. The component uses
 * `entry.name` to fetch its list of child entries.
 *
 * @returns {React.ReactElement} A React element displaying either:
 * - A `CircularProgress` component while data is loading.
 * - An error message if the data fetch fails.
 * - A filter/search bar and a sortable `Table` of child entries
 * once data is successfully loaded.
 */


interface EntryItem {
  id: string;
  name: string;
  full_name: string;
  description: string;
  lastModified: string;
}

interface EntryListProps {
  entry?: any;
}

const EntryList: React.FC<EntryListProps> = ({ entry }) => {

  const { user } = useAuth();
  const [searchText, setSearchText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchFailed, setFetchFailed] = useState<boolean>(false);
  const [entryData, setEntryData] =  useState<EntryItem[]>([]);
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);
  const [activeFilters, setActiveFilters] = useState<{ property: string; values: string[] }[]>([]);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [isNameHeaderHovered, setIsNameHeaderHovered] = useState(false); 
  const [isLastModifiedHeaderHovered, setIsLastModifiedHeaderHovered] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const id_token = user?.token || '';
  const resourcesEntryList = useSelector((state: any) => state.resources.entryListData);
  const resourcesEntryListStatus = useSelector((state: any) => state.resources.entryListStatus);
  const error = useSelector((state: any) => state.resources.entryListError);
  const getFormatedDate = (date: any) =>{
    const myDate = new Date(date * 1000);
    const formatedDate = new Intl.DateTimeFormat('en-US', { month: "short" , day: "numeric", year: "numeric" }).format(myDate);
    return (formatedDate);
  }
  const columnDisplayNames: { [key in keyof EntryItem]?: string } = {
  name: 'Name',
  description: 'Description',
  lastModified: 'Last Modification Time',
  };

  const propertyNames: (keyof EntryItem)[] = ['name', 'description', 'lastModified'];

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
    setSelectedProperty(''); // Reset on close
  };

  const handlePropertySelect = (property: string) => {
    setSelectedProperty(property);
  };

  // Gets unique values for a given property from the data
  const getPropertyValues = (property: keyof EntryItem) => {
    if (!property) return [];
    const allValues = entryData.map(item => item[property]);
    return [...new Set(allValues)].sort(); // Return unique, sorted values
  };

  // Toggles a filter value and applies it immediately
  const handleValueToggle = (value: string) => {
    setActiveFilters(prevFilters => {
      const newFilters = JSON.parse(JSON.stringify(prevFilters));
      const filterIndex = newFilters.findIndex((f: any) => f.property === selectedProperty);

      if (filterIndex === -1) {
        newFilters.push({ property: selectedProperty, values: [value] });
      } else {
        const valueIndex = newFilters[filterIndex].values.indexOf(value);
        if (valueIndex === -1) {
          newFilters[filterIndex].values.push(value);
        } else {
          newFilters[filterIndex].values.splice(valueIndex, 1);
        }
        if (newFilters[filterIndex].values.length === 0) {
          newFilters.splice(filterIndex, 1);
        }
      }
      return newFilters;
    });
  };
  
  // Removes a filter chip for a specific property
  const handleRemoveFilter = (property: string) => {
    setActiveFilters(prev => prev.filter(f => f.property !== property));
  };

  // Clears all active filters
  const handleClearFilters = () => {
    setActiveFilters([]);
    setSearchText('');
  };


  useEffect(()=>{
    dispatch(fetchEntriesByParent({parent : entry.name, id_token: id_token}));
  }, []);

  useEffect(() => {
    if (resourcesEntryListStatus === 'loading') {
      setLoading(true);
      setFetchFailed(false);
    }
    if (resourcesEntryListStatus === 'succeeded') {
        console.log("Resources fetched successfully:", resourcesEntryList);
        let d:EntryItem[] = [];
        resourcesEntryList.forEach((res:any, index:number)=>{
          d.push({
            id:""+index+1,
            name:res.dataplexEntry.name.split('/').pop(),
            full_name:res.dataplexEntry.name,
            description:res.dataplexEntry.entrySource.description,
            lastModified:getFormatedDate(res.dataplexEntry.updateTime.seconds)
          })
        });
        setEntryData(d);
        setLoading(false);
    }
    if(resourcesEntryListStatus === 'failed'){
      setFetchFailed(true);
      setLoading(false);
    }
  }, [resourcesEntryListStatus]);

  const handleSelectEntry = (fullName:string) => {
    // Push current entry to history before fetching new entry
    dispatch(pushToHistory());
    dispatch(fetchEntry({ entryName: fullName, id_token: id_token }));
    //navigate('/view-details');
  }

  // Filter and sort data based on search text
  const filteredData = React.useMemo(() => {
    let data = entryData;
    if (activeFilters.length > 0) {
      data = data.filter(row => {
        return activeFilters.every(filter => {
          const rowValue = (row as any)[filter.property];
          return filter.values.includes(rowValue);
        });
      });
    }

    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      data = data.filter(row => 
        row.name.toLowerCase().includes(searchLower) ||
        row.description.toLowerCase().includes(searchLower) ||
        row.lastModified.toLowerCase().includes(searchLower)
      );
    }

    if (sortDirection && sortColumn) {
      data = [...data].sort((a, b) => {
        let aValue: string;
        let bValue: string;

        switch (sortColumn) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'description':
            aValue = a.description.toLowerCase();
            bValue = b.description.toLowerCase();
            break;
          case 'lastModified':
            aValue = a.lastModified.toLowerCase();
            bValue = b.lastModified.toLowerCase();
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
  }, [entryData, searchText, sortColumn, sortDirection, activeFilters]);

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
      return <ArrowUpward sx={{ fontSize: '16px', color: '#575757', opacity: 0.3 }} />;
    }
    return sortDirection === 'asc' ? <ArrowUpward sx={{ fontSize: '16px', color: '#575757' }} /> : <ArrowDownward sx={{ fontSize: '16px', color: '#575757' }} />;
  };

  return !loading ? !fetchFailed ? (
    <Box sx={{
      flex: 1,
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      // borderBottom: '1px solid #DADCE0',
      overflow: 'hidden',
      marginTop: '1.25rem'
    }}>
      {/* Filter Bar */}
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: activeFilters.length > 0 ? '8px' : '0px',
        padding: '8px 12px 8px 10px', 
        border: '1px solid #DADCE0',
        borderBottom: 'none',
        borderTopRightRadius: '8px',
        borderTopLeftRadius: '8px',
        backgroundColor: '#FFFFFF'
      }}>
        {/* Filter Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', height: '19px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={handleFilterClick}>
            <Tooltip title="Filter by property" arrow>
              <IconButton size="small" sx={{ padding: '4px 4px 5px 4px', "&:hover": {backgroundColor: '#E8F4FF' } }}>
                <FilterList sx={{ fontSize: '16px', color: '#1F1F1F' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Filter by property" arrow>
              <Typography sx={{ fontSize: '12px', fontWeight: 500, color: '#1F1F1F', "&:hover": { textDecoration: 'underline' } }}>
                Filter
              </Typography>
            </Tooltip>
          </Box>
          
          {/* Search Input */}
          <TextField
            placeholder="Enter property name or value"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            variant="outlined"
            size="small"
            sx={{
              flex: 1,
              '& .MuiOutlinedInput-root': {
                fontSize: '12px',
                '& .MuiInputBase-input': {
                  paddingLeft: '8px', 
                },
                '& fieldset': { border: 'none' },
                '& input::placeholder': {
                color: '#575757',
                opacity: 1,
                },
              },
            }}
            InputProps={{
              endAdornment: searchText && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchText('')}>
                    <Close sx={{ fontSize: '14px' }} />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          {/* Clear All Button */}
          {activeFilters.length > 0 && (
            <Button onClick={handleClearFilters} sx={{ fontSize: '11px', textTransform: 'none' }}>
              Clear All
            </Button>
          )}
        </Box>
        
        {/* Active Filter Chips */}
        {activeFilters.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {activeFilters.map((filter) => (
              <Box key={filter.property} sx={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '4px 8px', backgroundColor: '#E7F0FE',
                  border: '1px solid #0E4DCA', borderRadius: '16px',
                }}
              >
                <Typography sx={{ fontSize: '12px', fontWeight: 500, color: '#0E4DCA' }}>
                  {columnDisplayNames[filter.property as keyof EntryItem]}:
                </Typography>
                <Typography sx={{ fontSize: '12px', color: '#1F1F1F' }}>
                  {filter.values.join(', ')}
                </Typography>
                <IconButton size="small" onClick={() => handleRemoveFilter(filter.property)} sx={{ padding: '2px' }}>
                  <Close sx={{ fontSize: '12px', color: '#0E4DCA' }} />
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
        PaperProps={{ sx: { maxHeight: 300, width: 250, mt: 1 } }}
      >
        {!selectedProperty ? (
          // Show property names
          <div>
            <MenuItem sx={{ 
                fontSize: '0.6875rem', fontWeight: 450, backgroundColor: '#F8F9FA',
                borderBottom: '1px solid #E0E0E0', height: "32px", minHeight: "32px",
                paddingTop: 0, paddingBottom: 1,
                "&.Mui-disabled": { opacity: 1, color: "#575757 !important", backgroundColor: "transparent !important" },
              }}
              disabled>
              <ListItemText primary="Select Property to Filter" primaryTypographyProps={{ fontSize: '12px', fontWeight: 500 }} />
            </MenuItem>
            {propertyNames.map((property) => (
              <MenuItem key={property} onClick={() => handlePropertySelect(property)} sx={{ fontSize: '12px' }}>
                <ListItemText primary={columnDisplayNames[property]} primaryTypographyProps={{ fontSize: '12px' }} />
              </MenuItem>
            ))}
          </div>
        ) : (
          // Show values for selected property
          <div>
            <MenuItem onClick={() => setSelectedProperty('')} 
                      sx={{ 
                          fontSize: '0.6875rem', fontWeight: 400, backgroundColor: '#F8F9FA',
                          borderBottom: '1px solid #E0E0E0',
                          marginTop: '-8px',
                                  paddingTop: 1.30,
                                  paddingBottom: 1.30,
                        }}>
              <ListItemText primary="← Back to Properties" primaryTypographyProps={{ fontSize: '12px' }} />
            </MenuItem>
            <MenuItem sx={{ 
                fontSize: '0.6875rem', fontWeight: 400, backgroundColor: '#F8F9FA',
                borderBottom: '1px solid #E0E0E0'
              }}
            disabled>
                <ListItemText primary={`Filter by: ${columnDisplayNames[selectedProperty as keyof EntryItem]}`} primaryTypographyProps={{ fontSize: '12px', fontWeight: 500 }} />
            </MenuItem>
            {getPropertyValues(selectedProperty as keyof EntryItem).map((value) => (
              <MenuItem key={value} onClick={() => handleValueToggle(value)} sx={{ padding: '0 8px' }}>
                <Checkbox
                  checked={activeFilters.find(f => f.property === selectedProperty)?.values.includes(value) ?? false}
                  size="small"
                />
                <ListItemText primary={value} primaryTypographyProps={{ fontSize: '12px' }} />
              </MenuItem>
            ))}
          </div>
        )}
      </Menu>

      {/* Table */}
      <TableContainer sx={{ 
        maxHeight: '600px', 
        overflow: 'auto', 
        border: '1px solid #E1E3E1', 
        borderBottomRightRadius: '8px', 
        borderBottomLeftRadius: '8px',
        marginTop: '0px'
      }}>
        <Table stickyHeader sx={{ tableLayout: 'fixed', borderCollapse: 'collapse' }}>
          <TableHead>
            <TableRow sx={{ height: '36px', maxHeight: '36px', boxSizing: 'border-box'  }}>
              <TableCell 
              onMouseEnter={() => setIsNameHeaderHovered(true)}
              onMouseLeave={() => setIsNameHeaderHovered(false)}
              sx={{
                backgroundColor: '#F0F4F8',
                borderBottom: '1px solid #DADCE0',
                padding: '8px 16px',
                width: '200px'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <Typography sx={{
                    fontFamily: '"Google Sans", sans-serif',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#444746',
                    lineHeight: '1.33em',
                    letterSpacing: '0.83%'
                  }}>
                    Name
                  </Typography>
                  {isNameHeaderHovered && (
                    <Tooltip title="Sort" arrow>
                      <IconButton size="small" onClick={() => handleSort('name')} sx={{ padding: 0, width: '16px', height: '16px' }}>
                        {getSortIcon('name')}
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </TableCell>
              <TableCell sx={{
                backgroundColor: '#F0F4F8',
                borderBottom: '1px solid #DADCE0',
                padding: '8px 16px',
                width: '600px'
              }}>
                <Typography sx={{
                  fontFamily: 'Google Sans',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#444746',
                  lineHeight: '1.67em'
                }}>
                  Description
                </Typography>
              </TableCell>
              <TableCell
              onMouseEnter={() => setIsLastModifiedHeaderHovered(true)}
              onMouseLeave={() => setIsLastModifiedHeaderHovered(false)}
              sx={{
                backgroundColor: '#F0F4F8',
                borderBottom: '1px solid #DADCE0',
                padding: '8px 16px',
                width: '200px'
              }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <Typography sx={{
                  fontFamily: 'Google Sans',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#444746',
                  lineHeight: '1.67em'
                }}>
                  Last Modification Time
                </Typography>
                {isLastModifiedHeaderHovered && (
                  <Tooltip title="Sort" arrow>
                    <IconButton size="small" onClick={() => handleSort('lastModified')} sx={{ padding: 0, width: '16px', height: '16px' }}>
                      {getSortIcon('lastModified')}
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.map((row, index) => (
              <TableRow key={row.id} sx={{ height: '36px', maxHeight: '36px', boxSizing: 'border-box' }}>
                <TableCell sx={{
                  padding: '8px 16px', 
                  borderBottom: index < filteredData.length - 1 ? '1px solid #DADCE0' : 'none',
                  verticalAlign: 'top'
                }}>
                  <Typography 
                  onClick={() => 
                    //window.open(`#/resource/${encodeURIComponent(row.full_name)}`, '_blank')
                    handleSelectEntry(row.full_name)
                  }
                  sx={{
                    fontFamily: 'Google Sans Text',
                    fontSize: '12px',
                    fontWeight: 400,
                    color: '#0B57D0',
                    lineHeight: '1.33em',
                    letterSpacing: '0.83%',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}>
                    {row.name}
                  </Typography>
                </TableCell>
                <TableCell sx={{
                  padding: '8px 16px',
                  borderBottom: index < filteredData.length - 1 ? '1px solid #DADCE0' : 'none',
                  verticalAlign: 'top'
                }}>
                  <Typography sx={{
                    fontFamily: 'Google Sans Text',
                    fontSize: '12px',
                    fontWeight: 400,
                    color: '#1F1F1F',
                    lineHeight: '1.33em',
                    letterSpacing: '0.83%'
                  }}>
                    {row.description ? row.description : '-'}
                  </Typography>
                </TableCell>
                <TableCell sx={{
                  padding: '8px 16px',
                  borderBottom: index < filteredData.length - 1 ? '1px solid #DADCE0' : 'none',
                  verticalAlign: 'top'
                }}>
                  <Typography sx={{
                    fontFamily: 'Google Sans Text',
                    fontSize: '12px',
                    fontWeight: 400,
                    color: '#1F1F1F',
                    lineHeight: '1.33em',
                    letterSpacing: '0.83%'
                  }}>
                    {row.lastModified}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  ):(
    <Box sx={{
      flex: 1, backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #DADCE0',
      overflow: 'hidden', marginTop: '5rem', alignItems:'center', justifyContent:'center',
      display: 'flex', minHeight: '400px'
    }}>
      <p>{error}</p>
    </Box>
  ):(
    <Box sx={{
      flex: 1, backgroundColor: '#ffffff', borderRadius: '8px', overflow: 'hidden',
      marginTop: '5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '400px'
    }}>
      <CircularProgress/>
    </Box>
  );
};

export default EntryList;
