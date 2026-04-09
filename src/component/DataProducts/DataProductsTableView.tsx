import React, { useState } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Tooltip } from '@mui/material';
import { useSelector } from 'react-redux';
import { useColumnResize } from '../../hooks/useColumnResize';
import ResizeHandle from '../Schema/ResizeHandle';
import { getMimeType } from '../../utils/resourceUtils';

interface DataProduct {
  name: string;
  displayName: string;
  description?: string;
  updateTime: string;
  ownerEmails: string[];
  assetCount?: number;
  icon?: string;
}

interface DataProductsTableViewProps {
  dataProducts: DataProduct[];
  onRowClick: (dataProduct: DataProduct) => void;
}

const OverflowTooltip: React.FC<{ text: string; children: React.ReactElement<{ onMouseEnter?: React.MouseEventHandler<HTMLElement> }> }> = ({ text, children }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    setShowTooltip(el.scrollWidth > el.clientWidth);
  };

  return (
    <Tooltip title={text} arrow disableHoverListener={!showTooltip}>
      {React.cloneElement(children, { onMouseEnter: handleMouseEnter })}
    </Tooltip>
  );
};

const DataProductsTableView: React.FC<DataProductsTableViewProps> = ({
  dataProducts,
  onRowClick,
}) => {
  const mode = useSelector((state: any) => state.user.mode) as string;
  const isDark = mode === 'dark';
  const [sortColumn, setSortColumn] = useState<'name' | 'date' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const COLUMN_CONFIGS = React.useMemo(() => [
    { key: 'name', initialWidth: 250, minWidth: 120 },
    { key: 'description', initialWidth: 300, minWidth: 120 },
    { key: 'owner', initialWidth: 200, minWidth: 100 },
    { key: 'location', initialWidth: 130, minWidth: 80 },
    { key: 'lastModified', initialWidth: 150, minWidth: 100 },
  ], []);

  const { columnWidths, activeIndex, handleMouseDown } = useColumnResize({
    columns: COLUMN_CONFIGS,
    mode: 'coupled',
  });

  const columnPercents = React.useMemo(() => {
    const total = columnWidths.reduce((s, w) => s + w, 0);
    return columnWidths.map(w => `${((w / total) * 100).toFixed(2)}%`);
  }, [columnWidths]);

  const displayedProducts = React.useMemo(() => {
    if (!sortColumn) return dataProducts;

    if (sortColumn === 'date') {
      const sorted = [...dataProducts].sort((a, b) => {
        const aTs = a.updateTime ? new Date(a.updateTime).getTime() : 0;
        const bTs = b.updateTime ? new Date(b.updateTime).getTime() : 0;
        return aTs - bTs;
      });
      return sortOrder === 'asc' ? sorted : sorted.reverse();
    }

    if (sortColumn === 'name') {
      const sorted = [...dataProducts].sort((a, b) => {
        return a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' });
      });
      return sortOrder === 'asc' ? sorted : sorted.reverse();
    }

    return dataProducts;
  }, [dataProducts, sortColumn, sortOrder]);

  const handleToggleNameSort = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (sortColumn === 'name') {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else {
        setSortColumn(null);
        setSortOrder('asc');
      }
    } else {
      setSortColumn('name');
      setSortOrder('asc');
    }
  };

  const handleToggleDateSort = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (sortColumn === 'date') {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else {
        setSortColumn(null);
        setSortOrder('asc');
      }
    } else {
      setSortColumn('date');
      setSortOrder('asc');
    }
  };

  const getNameSortTooltip = (): string => {
    if (sortColumn === 'name' && sortOrder === 'asc') return 'Sort Z to A';
    if (sortColumn === 'name' && sortOrder === 'desc') return '';
    return 'Sort A to Z';
  };

  const getDateSortTooltip = (): string => {
    if (sortColumn === 'date' && sortOrder === 'asc') return 'Sort new to old';
    if (sortColumn === 'date' && sortOrder === 'desc') return '';
    return 'Sort old to new';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
  };

  return (
    <TableContainer
      component={Paper}
      sx={{
        backgroundColor: isDark ? '#131314' : '#FFFFFF',
        borderRadius: '8px',
        boxShadow: 'none',
        maxHeight: 'calc(100vh - 200px)',
        overflowY: 'auto',
        overflowX: 'auto',
        width: '100%',
      }}
    >
      <Table sx={{ width: '100%', tableLayout: 'fixed' }} aria-label="data products table">
        <colgroup>
          {columnPercents.map((w, i) => (
            <col key={i} style={{ width: w }} />
          ))}
        </colgroup>
        <TableHead>
          <TableRow
            sx={{
              position: 'relative',
              '& .MuiTableCell-root': {
                borderBottom: 'none',
                padding: '12px 20px 4px',
              },
              '& .MuiTableCell-root:first-of-type': {
                paddingLeft: '20px',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: 0,
                left: '12px',
                right: '10px',
                height: '1px',
                backgroundColor: isDark ? '#3c4043' : '#DADCE0',
              },
            }}
          >
            {/* Name */}
            <TableCell
              sx={{
                fontSize: '12px',
                fontWeight: '500',
                color: isDark ? '#dedfe0' : '#444746',
                fontFamily: '"Google Sans", sans-serif',
                position: 'relative',
              }}
            >
              <Tooltip title={getNameSortTooltip()} slotProps={{ popper: { modifiers: [{ name: 'offset', options: { offset: [0, -14] } }] } }}>
                <Box
                  role="button"
                  onClick={handleToggleNameSort}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    margin: '-4px -8px',
                    transition: 'background-color 0.2s ease',
                    '&:hover': {
                      backgroundColor: isDark ? '#3c4043' : '#F8F9FA',
                    },
                  }}
                >
                  <span>Name</span>
                  <Box
                    component="span"
                    className="sort-btn"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      flexShrink: 0,
                      opacity: sortColumn === 'name' ? 1 : 0,
                      transform: (sortColumn === 'name' && sortOrder === 'desc') ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s ease-in-out, opacity 0.2s ease',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="24" height="24" rx="12" fill={isDark ? '#004a77' : '#C2E7FF'}/>
                      <path d="M11.168 15.4818L11.168 5.33594L12.8346 5.33594L12.8346 15.4818L17.5013 10.8151L18.668 12.0026L12.0013 18.6693L5.33464 12.0026L6.5013 10.8151L11.168 15.4818Z" fill={isDark ? '#8ab4f8' : '#004A77'}/>
                    </svg>
                  </Box>
                </Box>
              </Tooltip>
              <ResizeHandle
                onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(0, e); }}
                isActive={activeIndex === 0}
                darkMode={isDark}
              />
            </TableCell>

            {/* Description */}
            <TableCell
              sx={{
                fontFamily: '"Google Sans", sans-serif',
                fontSize: '12px',
                fontWeight: '500',
                color: isDark ? '#dedfe0' : '#444746',
                position: 'relative',
              }}
            >
              Description
              <ResizeHandle
                onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(1, e); }}
                isActive={activeIndex === 1}
                darkMode={isDark}
              />
            </TableCell>

            {/* Owner */}
            <TableCell
              sx={{
                fontFamily: '"Google Sans", sans-serif',
                fontSize: '12px',
                fontWeight: '500',
                color: isDark ? '#dedfe0' : '#444746',
                position: 'relative',
              }}
            >
              Owner
              <ResizeHandle
                onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(2, e); }}
                isActive={activeIndex === 2}
                darkMode={isDark}
              />
            </TableCell>

            {/* Location */}
            <TableCell
              sx={{
                fontFamily: '"Google Sans", sans-serif',
                fontSize: '12px',
                fontWeight: '500',
                color: isDark ? '#dedfe0' : '#444746',
                position: 'relative',
              }}
            >
              Location
              <ResizeHandle
                onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(3, e); }}
                isActive={activeIndex === 3}
                darkMode={isDark}
              />
            </TableCell>

            {/* Last Modified */}
            <TableCell
              sx={{
                fontFamily: '"Google Sans", sans-serif',
                fontSize: '12px',
                fontWeight: '500',
                color: isDark ? '#dedfe0' : '#444746',
              }}
            >
              <Tooltip title={getDateSortTooltip()} slotProps={{ popper: { modifiers: [{ name: 'offset', options: { offset: [0, -14] } }] } }}>
                <Box
                  role="button"
                  onClick={handleToggleDateSort}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '4px',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    margin: '-4px -8px',
                    transition: 'background-color 0.2s ease',
                    '&:hover': {
                      backgroundColor: isDark ? '#3c4043' : '#F8F9FA',
                    },
                  }}
                >
                  <Box
                    component="span"
                    className="sort-btn"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      flexShrink: 0,
                      opacity: sortColumn === 'date' ? 1 : 0,
                      transform: (sortColumn === 'date' && sortOrder === 'desc') ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s ease-in-out, opacity 0.2s ease',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="24" height="24" rx="12" fill={isDark ? '#004a77' : '#C2E7FF'}/>
                      <path d="M11.168 15.4818L11.168 5.33594L12.8346 5.33594L12.8346 15.4818L17.5013 10.8151L18.668 12.0026L12.0013 18.6693L5.33464 12.0026L6.5013 10.8151L11.168 15.4818Z" fill={isDark ? '#8ab4f8' : '#004A77'}/>
                    </svg>
                  </Box>
                  <span style={{ whiteSpace: 'nowrap' }}>Last modified</span>
                </Box>
              </Tooltip>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {displayedProducts.map((dp) => (
            <TableRow
              key={dp.name}
              onClick={() => onRowClick(dp)}
              sx={{
                position: 'relative',
                cursor: 'pointer',
                height: '40px',
                backgroundColor: isDark ? '#131314' : '#FFFFFF',
                '& .MuiTableCell-root': {
                  borderBottom: 'none',
                },
                '&:hover .MuiTableCell-root': {
                  backgroundColor: isDark ? '#3c4043' : '#F8F9FA',
                },
                '&:hover .MuiTableCell-root:first-of-type': {
                  background: isDark ? 'linear-gradient(to right, transparent 12px, #3c4043 12px)' : 'linear-gradient(to right, transparent 12px, #F8F9FA 12px)',
                },
                '&:hover .MuiTableCell-root:last-of-type': {
                  background: isDark ? 'linear-gradient(to left, transparent 10px, #3c4043 10px)' : 'linear-gradient(to left, transparent 10px, #F8F9FA 10px)',
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: '12px',
                  right: '10px',
                  height: '1px',
                  backgroundColor: isDark ? '#3c4043' : '#DADCE0',
                },
              }}
            >
              {/* Name */}
              <TableCell
                sx={{
                  fontFamily: '"Google Sans", sans-serif',
                  fontSize: '12px',
                  color: isDark ? '#dedfe0' : '#1F1F1F',
                  padding: '10px 20px',
                  paddingLeft: '20px',
                  overflow: 'hidden',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  <img
                    src={dp.icon ? `data:${getMimeType(dp.icon)};base64,${dp.icon}` : '/assets/images/data-product-card.png'}
                    alt={dp.displayName}
                    style={{ width: '32px', height: '32px', flexShrink: 0 }}
                  />
                  <OverflowTooltip text={dp.displayName}>
                    <Typography
                      sx={{
                        flex: 1,
                        fontFamily: '"Google Sans", sans-serif',
                        fontSize: '14px',
                        fontWeight: 400,
                        color: isDark ? '#dedfe0' : '#1F1F1F',
                        cursor: 'pointer',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {dp.displayName}
                    </Typography>
                  </OverflowTooltip>
                </Box>
              </TableCell>

              {/* Description */}
              <TableCell
                sx={{
                  fontFamily: '"Product Sans", "Google Sans Text", sans-serif',
                  fontSize: '12px',
                  color: isDark ? '#dedfe0' : '#575757',
                  padding: '10px 20px',
                  overflow: 'hidden',
                }}
              >
                <Typography
                  sx={{
                    fontFamily: '"Product Sans", "Google Sans Text", sans-serif',
                    fontSize: '14px',
                    fontWeight: '400',
                    color: isDark ? '#dedfe0' : '#575757',
                    letterSpacing: '0.1px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {dp.description || 'No description available.'}
                </Typography>
              </TableCell>

              {/* Owner */}
              <TableCell
                sx={{
                  padding: '10px 20px',
                  overflow: 'hidden',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  {dp.ownerEmails.length > 0 && (
                    <div style={{
                      width: '1.5rem',
                      height: '1.5rem',
                      borderRadius: '50%',
                      backgroundColor: '#FFDCD2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#9C3A1F',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      flexShrink: 0,
                    }}>
                      {dp.ownerEmails[0].charAt(0).toUpperCase()}
                    </div>
                  )}
                  <Typography
                    sx={{
                      fontFamily: '"Product Sans", "Google Sans Text", sans-serif',
                      fontSize: '14px',
                      fontWeight: '400',
                      color: isDark ? '#dedfe0' : '#575757',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {dp.ownerEmails.length > 0 ? dp.ownerEmails[0] : '-'}
                    {dp.ownerEmails.length > 1 ? ` +${dp.ownerEmails.length - 1}` : ''}
                  </Typography>
                </Box>
              </TableCell>

              {/* Location */}
              <TableCell
                sx={{
                  padding: '10px 20px',
                  overflow: 'hidden',
                }}
              >
                <OverflowTooltip text={dp.name.split('/')[3] || '-'}>
                  <Typography
                    sx={{
                      fontFamily: '"Product Sans", "Google Sans Text", sans-serif',
                      fontSize: '14px',
                      fontWeight: '400',
                      color: isDark ? '#dedfe0' : '#575757',
                      letterSpacing: '0.1px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {dp.name.split('/')[3] || '-'}
                  </Typography>
                </OverflowTooltip>
              </TableCell>

              {/* Last Modified */}
              <TableCell
                sx={{
                  fontFamily: '"Product Sans", "Google Sans Text", sans-serif',
                  fontSize: '14px',
                  fontWeight: '400',
                  color: isDark ? '#dedfe0' : '#575757',
                  padding: '10px 20px',
                  letterSpacing: '0.1px',
                  textAlign: 'right',
                }}
              >
                {formatDate(dp.updateTime)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default DataProductsTableView;
