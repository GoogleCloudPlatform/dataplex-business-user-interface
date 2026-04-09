import React from 'react';
import { Box, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { useSelector } from 'react-redux';

const COLUMN_WIDTHS = ['24.27%', '29.13%', '19.42%', '12.62%', '14.56%'];
const SKELETON_ROWS = 6;

const DataProductsTableViewSkeleton: React.FC = () => {
  const mode = useSelector((state: any) => state.user.mode) as string;
  const isDark = mode === 'dark';

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
      <Table sx={{ width: '100%', tableLayout: 'fixed' }} aria-label="data products table skeleton">
        <colgroup>
          {COLUMN_WIDTHS.map((w, i) => (
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
            {['Name', 'Description', 'Owner', 'Location', 'Last modified'].map((header) => (
              <TableCell
                key={header}
                sx={{
                  fontFamily: '"Google Sans", sans-serif',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: isDark ? '#dedfe0' : '#444746',
                  ...(header === 'Last modified' && { textAlign: 'right' }),
                }}
              >
                {header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
            <TableRow
              key={index}
              sx={{
                position: 'relative',
                height: '40px',
                '& .MuiTableCell-root': {
                  borderBottom: 'none',
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
              <TableCell sx={{ padding: '10px 20px' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Skeleton variant="rounded" width={32} height={32} sx={{ flexShrink: 0 }} />
                  <Skeleton variant="text" width="60%" height={20} />
                </Box>
              </TableCell>

              {/* Description */}
              <TableCell sx={{ padding: '10px 20px' }}>
                <Skeleton variant="text" width="80%" height={20} />
              </TableCell>

              {/* Owner */}
              <TableCell sx={{ padding: '10px 20px' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Skeleton variant="circular" width={24} height={24} sx={{ flexShrink: 0 }} />
                  <Skeleton variant="text" width="50%" height={20} />
                </Box>
              </TableCell>

              {/* Location */}
              <TableCell sx={{ padding: '10px 20px' }}>
                <Skeleton variant="text" width="40%" height={20} />
              </TableCell>

              {/* Last Modified */}
              <TableCell sx={{ padding: '10px 20px' }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Skeleton variant="text" width="60%" height={20} />
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default DataProductsTableViewSkeleton;
