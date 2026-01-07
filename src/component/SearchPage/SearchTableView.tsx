import React, { useState } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Tooltip } from '@mui/material';
import { Lock, ArrowUpward, ArrowDownward } from '@mui/icons-material';
import Tag from '../Tags/Tag';

/**
 * @file SearchTableView.tsx
 * @description
 * This component renders search results in a Material-UI `Table` view.
 *
 * It displays a list of `resources` in rows, with columns for Name,
 * Description, Type (as `Tag` components), Owner, and Last Modified date.
 * It provides local state for sorting the "Name" and "Last modified" columns
 * in ascending, descending, or default order.
 *
 * The component relies on helper functions passed as props (`getFormatedDate`,
 * `getEntryType`) to correctly parse and display data.
 *
 * @param {SearchTableViewProps} props - The props for the component.
 * @param {any[]} props.resources - An array of resource objects to be
 * displayed in the table.
 * @param {(entry: any) => void} props.onRowClick - A callback function
 * triggered when a table row is clicked, passing the corresponding entry object.
 * @param {(entry: any) => void} props.onFavoriteClick - A callback function
 * triggered when the favorite (star) icon is clicked. (Note: This
 * functionality is currently commented out in the component's implementation).
 * @param {(date: any) => string} props.getFormatedDate - A utility function
 * to convert a timestamp (e.g., in seconds) into a formatted date string.
 * @param {(namePath: string, separator: string) => string} props.getEntryType -
 * A utility function to parse the entry's type from its full name path.
 *
 * @returns {React.ReactElement} A React element rendering the `TableContainer`
 * with the sortable list of search results.
 */

interface SearchTableViewProps {
  resources: any[];
  onRowClick: (entry: any) => void;
  onFavoriteClick: (entry: any) => void;
  getFormatedDate: (date: any) => string;
  getEntryType: (namePath: string, separator: string) => string;
}

// const capitalizeFirstLetter = (s: any) => {
//   if (typeof s !== 'string' || s.length === 0) {
//     return '';
//   }
//   return s.charAt(0).toUpperCase() + s.slice(1);
// };

const getNameFromEntry = (entry: any) => {
  var calculatedName = '';
  if (entry?.entrySource?.displayName && entry.entrySource.displayName.length > 0) {
    calculatedName = entry.entrySource.displayName;
  } else if (entry.name) {
    const segments = entry.name.split('/');
    calculatedName = segments[segments.length - 1];
  }
  return calculatedName;
}
const SearchTableView: React.FC<SearchTableViewProps> = ({
  resources,
  onRowClick,
  // onFavoriteClick,
  getFormatedDate,
  getEntryType
}) => {
  // const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [nameSortOrder, setNameSortOrder] = useState<'asc' | 'desc' | null>(null);
  const [dateSortOrder, setDateSortOrder] = useState<'asc' | 'desc' | null>(null);
  const [sortColumn, setSortColumn] = useState<'name' | 'date' | null>(null);

  const handleRowClick = (entry: any) => {
    onRowClick(entry);
  };

  // const handleFavoriteClick = (event: React.MouseEvent, entry: any) => {
  //   event.stopPropagation();
  //   const entryName = entry.name;
  //   const newFavorites = new Set(favorites);
    
  //   if (newFavorites.has(entryName)) {
  //     newFavorites.delete(entryName);
  //   } else {
  //     newFavorites.add(entryName);
  //   }
    
  //   setFavorites(newFavorites);
  //   onFavoriteClick(entry);
  // };

  const displayedResources = React.useMemo(() => {
    // Date sort has priority if active
    if (dateSortOrder) {
      const sortedByDate = [...resources].sort((a: any, b: any) => {
        const aTs = a?.dataplexEntry?.updateTime?.seconds || a?.dataplexEntry?.createTime?.seconds || 0;
        const bTs = b?.dataplexEntry?.updateTime?.seconds || b?.dataplexEntry?.createTime?.seconds || 0;
        return aTs - bTs;
      });
      return dateSortOrder === 'asc' ? sortedByDate : sortedByDate.reverse();
    }

    if (nameSortOrder) {
      const sortedByName = [...resources].sort((a: any, b: any) => {
        const aName = (a?.dataplexEntry?.name || '').split('/').pop() || '';
        const bName = (b?.dataplexEntry?.name || '').split('/').pop() || '';
        return aName.localeCompare(bName, undefined, { sensitivity: 'base' });
      });
      return nameSortOrder === 'asc' ? sortedByName : sortedByName.reverse();
    }

    return resources;
  }, [resources, nameSortOrder, dateSortOrder]);

  const handleToggleNameSort = (event: React.MouseEvent) => {
    event.stopPropagation();
    setDateSortOrder(null);
    setSortColumn('name');
    setNameSortOrder(prev => {
      const newOrder = prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc';
      if (newOrder === null) setSortColumn(null);
      return newOrder;
    });
  };

  const handleToggleDateSort = (event: React.MouseEvent) => {
    event.stopPropagation();
    setNameSortOrder(null);
    setSortColumn('date');
    setDateSortOrder(prev => {
      const newOrder = prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc';
      if (newOrder === null) setSortColumn(null);
      return newOrder;
    });
  };

  return (
    <TableContainer 
      component={Paper} 
      sx={{
        backgroundColor: '#FFFFFF',
        borderRadius: '8px',
        boxShadow: 'none',
        maxHeight: 'calc(100vh - 200px)',
        overflowY: 'auto'
      }}
    >
      <Table sx={{ minWidth: 800 }} aria-label="search results table">
        <TableHead>
          <TableRow 
            sx={{
              '& .MuiTableCell-root': {
                borderBottom: 'none',
                paddingTop: '0px',
                paddingBottom: '3px'
              }
            }}
          >
            {/* Name */}
            <TableCell 
              sx={{
                fontSize: '11px',
                fontWeight: '700',
                color: '#444746',
                fontFamily: '"Google Sans Text",sans-serif',
                paddingLeft: '16px'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', '&:hover .MuiIconButton-root': { opacity: 1 } }}>
                <span>Name</span>
                <Tooltip title="Sort" arrow>
                  <IconButton
                    size="small"
                    onClick={handleToggleNameSort}
                    sx={{ 
                      padding: '2px', 
                      color: '#444746',
                      opacity: (sortColumn === 'name' && nameSortOrder !== null) ? 1 : 0
                    }}
                  >
                    {nameSortOrder === 'asc' && <ArrowUpward sx={{ fontSize: '16px' }} />}
                    {nameSortOrder === 'desc' && <ArrowDownward sx={{ fontSize: '16px' }} />}
                    {nameSortOrder === null && <ArrowUpward sx={{ fontSize: '16px', opacity: 0.5 }} />}
                  </IconButton>
                </Tooltip>
              </Box>
            </TableCell>

            {/* Description */}
            <TableCell 
              sx={{
                fontFamily: '"Google Sans Text",sans-serif',
                fontSize: '11px',
                fontWeight: '700',
                color: '#444746',
                padding: '0px 12px'
              }}
            >
              Description
            </TableCell>

            {/* Type */}
            <TableCell 
              sx={{
                fontFamily: '"Google Sans Text",sans-serif',
                fontSize: '11px',
                fontWeight: '700',
                color: '#444746',
                padding: '0px 12px'
              }}
            >
              Type
            </TableCell>
            
            {/* Owner */}
            {/* <TableCell 
              sx={{
                fontFamily: '"Google Sans Text",sans-serif',
                fontSize: '11px',
                fontWeight: '700',
                color: '#444746',
                padding: '0px 12px',
                paddingLeft: '14px' 
              }}
            >
              Owner
            </TableCell> */}

            {/* Last Modified */}
            <TableCell 
              sx={{
                fontFamily: '"Google Sans Text",sans-serif',
                fontSize: '11px',
                fontWeight: '700',
                color: '#444746',
                padding: '0px 4px',
                paddingLeft: '3px'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' , '&:hover .MuiIconButton-root': { opacity: 1 } }}>
                <span>Last modified</span>
                <Tooltip title="Sort" arrow>
                  <IconButton
                    size="small"
                    onClick={handleToggleDateSort}
                    sx={{ 
                      padding: '2px', 
                      color: '#444746',
                      opacity: (sortColumn === 'date' && dateSortOrder !== null) ? 1 : 0
                    }}
                  >
                    {dateSortOrder === 'asc' && <ArrowUpward sx={{ fontSize: '16px' }} />}
                    {dateSortOrder === 'desc' && <ArrowDownward sx={{ fontSize: '16px' }} />}
                    {dateSortOrder === null && <ArrowUpward sx={{ fontSize: '16px', opacity: 0.5 }} />}
                  </IconButton>
                </Tooltip>
              </Box>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {displayedResources.map((resource: any) => {
            const entry = resource.dataplexEntry;
            // const isFavorite = favorites.has(entry.name);
            const hasLock = entry.name.includes('Sales_Dataset') || entry.name.includes('sales_reporting'); // Demo logic
            
            return (
              <TableRow
                key={entry.name}
                onClick={() => handleRowClick(entry)}
                sx={{
                  borderBottom: '1px solid #DADCE0',
                  cursor: 'pointer',
                  height: '36px',
                  '&:hover': {
                    backgroundColor: '#F8F9FA'
                  }
                }}
              >
                <TableCell 
                   sx={{
                     fontFamily: '"Google Sans Text",sans-serif',
                     fontSize: '11px',
                     color: '#1F1F1F',
                     padding: '10px 6px',
                     paddingLeft: '16px',
                     display: 'flex',
                     borderBottom: 'none',
                     alignItems: 'center',
                     gap: '8px',
                     maxWidth: '200px'
                   }}
                 >
                  {/* <IconButton
                    onClick={(e) => handleFavoriteClick(e, entry)}
                    sx={{
                      padding: '4px',
                      color: isFavorite ? '#F4B400' : '#575757',
                      '&:hover': {
                        backgroundColor: 'rgba(244, 180, 0, 0.1)'
                      }
                    }}
                  >
                    {isFavorite ? <Star sx={{ fontSize: '18px' }} /> : <StarOutline sx={{ fontSize: '18px' }} />}
                  </IconButton> */}
                  <Typography
                    sx={{
                      flex: 1,
                      fontFamily: '"Google Sans Text",sans-serif',
                      fontSize: '1.125rem',
                      fontWeight: '400',
                      color: '#0B57D0',
                      cursor: 'pointer',
                      '&:hover': {
                        color: '#0A4BC0'
                      },
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {getNameFromEntry(entry)}
                  </Typography>
                  {hasLock && (
                    <Lock sx={{ fontSize: '12px', color: '#575757' }} />
                  )}
                </TableCell>
                <TableCell 
                   sx={{
                     fontFamily: '"Google Sans Text",sans-serif',
                     fontSize: '0.75rem',
                     color: '#575757',
                     padding: '3px 12px',
                     maxWidth: '200px'
                   }}
                 >
                  <Typography
                    sx={{
                      fontFamily: '"Google Sans Text",sans-serif',
                      fontSize: '0.875rem',
                      color: '#000000DE',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {entry.entrySource?.description || 'No Description Available'}
                  </Typography>
                </TableCell>
                <TableCell 
                   sx={{
                     padding: '3px 12px'
                   }}
                 >
                  <Box sx={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    <Tag 
                      text={(() => {
                        return entry.entrySource?.system.toLowerCase() === 'bigquery' ? 'BigQuery' : entry.entrySource?.system.charAt(0).toUpperCase() + entry.entrySource?.system.slice(1).toLowerCase();
                      })()} 
                      css={{
                        fontFamily: '"Google Sans Text",sans-serif',
                        backgroundColor: '#C2E7FF',
                        color: '#004A77',
                        borderRadius: '8px',
                        height:'20px',
                        padding: '1px 8px',
                        fontSize: '12px',
                        fontWeight: '500',
                        textTransform: 'capitalize',
                        border: 'none'
                      }}
                    />
                    <Tag 
                      text={getEntryType(entry.name, '/')} 
                      css={{
                        fontFamily: '"Google Sans Text",sans-serif',
                        backgroundColor: '#C2E7FF',
                        color: '#004A77',
                        height:'20px',
                        borderRadius: '8px',
                        padding: '1px 8px',
                        fontSize: '12px',
                        fontWeight: '500',
                        border: 'none'
                      }}
                    />
                  </Box>
                </TableCell>
                {/* <TableCell 
                   sx={{
                     fontFamily: '"Google Sans Text",sans-serif',
                     fontSize: '12px',
                     color: '#575757',
                     padding: '3px 12px',
                     paddingLeft: '16px'
                   }}
                 >
                   {entry.entrySource?.owner || '-'}
                </TableCell> */}
                <TableCell 
                   sx={{
                     fontFamily: '"Google Sans Text",sans-serif',
                     fontSize: '12px',
                     color: '#575757',
                     padding: '3px 12px',
                     paddingLeft: '3px'
                   }}
                 >
                   {getFormatedDate(entry?.updateTime || entry?.createTime)}
                 </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default SearchTableView;
