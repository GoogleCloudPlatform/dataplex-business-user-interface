import React from 'react';
import { Box, Skeleton } from '@mui/material';

const TableInsightsSkeleton: React.FC = () => {
  return (
    <Box className="insights-skeleton">
      {/* Table Description Section Skeleton */}
      <Box className="insights-section" sx={{ mb: 2 }}>
        <Box className="insights-section__header" sx={{ p: 2, backgroundColor: '#F8FAFD', borderRadius: '8px 8px 0 0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Skeleton variant="circular" width={24} height={24} />
            <Skeleton variant="text" width={150} height={24} />
            <Skeleton variant="circular" width={16} height={16} />
          </Box>
          <Skeleton variant="circular" width={24} height={24} />
        </Box>
        <Box sx={{ p: 2, backgroundColor: '#FFFFFF', borderRadius: '0 0 8px 8px', border: '1px solid #DADCE0', borderTop: 'none' }}>
          <Skeleton variant="text" width="100%" height={20} />
          <Skeleton variant="text" width="90%" height={20} />
          <Skeleton variant="text" width="30%" height={20} sx={{ mt: 1 }} />
        </Box>
      </Box>

      {/* Generated Queries Section Skeleton */}
      <Box className="insights-section">
        <Box className="insights-section__header" sx={{ p: 2, backgroundColor: '#F8FAFD', borderRadius: '8px 8px 0 0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Skeleton variant="circular" width={24} height={24} />
            <Skeleton variant="text" width={150} height={24} />
            <Skeleton variant="circular" width={16} height={16} />
          </Box>
          <Skeleton variant="circular" width={24} height={24} />
        </Box>

        {/* Filter Bar Skeleton */}
        <Box sx={{ p: 1.5, borderBottom: '1px solid #DADCE0', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Skeleton variant="circular" width={16} height={16} />
          <Skeleton variant="text" width={40} height={20} />
          <Skeleton variant="text" width={200} height={20} />
        </Box>

        {/* Query Items Skeleton */}
        {[1, 2, 3].map((item) => (
          <Box
            key={item}
            sx={{
              p: 2,
              borderBottom: '1px solid #E1E3E1',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
              <Skeleton variant="circular" width={20} height={20} />
              <Skeleton variant="text" width="60%" height={20} />
            </Box>
            <Skeleton variant="circular" width={24} height={24} />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default TableInsightsSkeleton;