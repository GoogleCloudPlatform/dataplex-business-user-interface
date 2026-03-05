import React from 'react';
import { Box, Skeleton } from '@mui/material';

const DataProfileSkeleton: React.FC = () => {
  return (
    <Box
      data-testid="data-profile-skeleton"
      sx={{
        flex: 1,
        position: 'relative',
        marginTop: '20px',
      }}
    >
      <Box sx={{
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #DADCE0',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px',
          backgroundColor: '#F8FAFD',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Skeleton variant="text" width={120} height={28} />
            <Skeleton variant="circular" width={18} height={18} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Skeleton variant="text" width={90} height={24} />
            <Skeleton variant="circular" width={24} height={24} />
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ padding: '20px', paddingBottom: '10px', overflow: 'hidden' }}>
          {/* Filter Bar */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            border: '1px solid #DADCE0',
            borderBottom: 'none',
            borderTopRightRadius: '8px',
            borderTopLeftRadius: '8px',
            backgroundColor: '#FFFFFF',
          }}>
            <Skeleton variant="circular" width={16} height={16} />
            <Skeleton variant="text" width={40} height={20} />
            <Skeleton variant="text" width="60%" height={20} />
          </Box>

          {/* Table */}
          <Box sx={{
            border: '1px solid #DADCE0',
            borderBottomRightRadius: '8px',
            borderBottomLeftRadius: '8px',
            overflow: 'hidden',
            maxHeight: 'calc(100vh - 400px)',
          }}>
            {/* Table Header */}
            <Box sx={{
              display: 'flex',
              backgroundColor: '#F0F4F8',
              borderBottom: '1px solid #DADCE0',
              padding: '8px 16px',
            }}>
              <Box sx={{ width: '14%', minWidth: '100px', px: 1 }}><Skeleton variant="text" width="80%" height={20} /></Box>
              <Box sx={{ width: '10%', minWidth: '80px', px: 1 }}><Skeleton variant="text" width="60%" height={20} /></Box>
              <Box sx={{ width: '10%', minWidth: '70px', px: 1 }}><Skeleton variant="text" width="70%" height={20} /></Box>
              <Box sx={{ width: '10%', minWidth: '80px', px: 1 }}><Skeleton variant="text" width="80%" height={20} /></Box>
              <Box sx={{ width: '25%', minWidth: '150px', px: 1 }}><Skeleton variant="text" width="60%" height={20} /></Box>
              <Box sx={{ flex: 1, minWidth: '150px', px: 1 }}><Skeleton variant="text" width="70%" height={20} /></Box>
            </Box>

            {/* Table Rows - reduced to 3 rows with smaller height */}
            {[1, 2, 3].map((row) => (
              <Box
                key={row}
                sx={{
                  display: 'flex',
                  padding: '7px 16px',
                  borderBottom: row < 3 ? '1px solid #DADCE0' : 'none',
                  minHeight: '120px',
                }}
              >
                {/* Column name */}
                <Box sx={{ width: '14%', minWidth: '100px', px: 1, pt: 0.5 }}>
                  <Skeleton variant="text" width="85%" height={18} />
                </Box>
                {/* Type */}
                <Box sx={{ width: '10%', minWidth: '80px', px: 1, pt: 0.5 }}>
                  <Skeleton variant="text" width="70%" height={18} />
                </Box>
                {/* Null % */}
                <Box sx={{ width: '10%', minWidth: '70px', px: 1, pt: 0.5 }}>
                  <Skeleton variant="text" width="60%" height={18} />
                </Box>
                {/* Unique % */}
                <Box sx={{ width: '10%', minWidth: '80px', px: 1, pt: 0.5 }}>
                  <Skeleton variant="text" width="65%" height={18} />
                </Box>
                {/* Statistics */}
                <Box sx={{ width: '25%', minWidth: '150px', px: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[1, 2, 3].map((stat) => (
                    <Box key={stat} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Skeleton variant="text" width={60} height={16} />
                      <Skeleton variant="text" width={40} height={16} />
                    </Box>
                  ))}
                </Box>
                {/* Top 10 values - Bar chart skeleton */}
                <Box sx={{ flex: 1, minWidth: '150px', px: 1, display: 'flex', flexDirection: 'column', gap: '6px', pt: 0.5 }}>
                  {[80, 60, 40, 25].map((width, idx) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Skeleton variant="text" width={40} height={14} sx={{ flexShrink: 0 }} />
                      <Skeleton variant="rounded" width={`${width}px`} height={12} sx={{ borderRadius: '4px', flexShrink: 0 }} />
                    </Box>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default DataProfileSkeleton;
