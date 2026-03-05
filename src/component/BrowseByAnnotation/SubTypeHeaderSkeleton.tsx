import React from 'react';
import { Box, Skeleton } from '@mui/material';

/**
 * @file SubTypeHeaderSkeleton.tsx
 * @summary Skeleton loader for Sub Type header in Browse by Annotation
 *
 * @description
 * Displays a skeleton loading state matching the Sub Type header layout
 * with back button, icon, and title placeholders. Shows while navigating
 * to the asset view for a sub-type.
 */

const SubTypeHeaderSkeleton: React.FC = () => {
  return (
    <Box
      sx={{
        height: '64px',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {/* Title Row Skeleton - positioned at top */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          position: 'absolute',
          top: '20px',
          left: '20px',
        }}
      >
        {/* Back Arrow Skeleton */}
        <Skeleton
          variant="circular"
          width={20}
          height={20}
          sx={{ bgcolor: '#E8EAED' }}
        />
        {/* Icon Skeleton */}
        <Skeleton
          variant="rounded"
          width={24}
          height={24}
          sx={{ borderRadius: '4px', bgcolor: '#E8EAED' }}
        />
        {/* Title Skeleton */}
        <Skeleton
          variant="text"
          width={180}
          height={24}
          sx={{ borderRadius: '4px', bgcolor: '#E8EAED' }}
        />
      </Box>
    </Box>
  );
};

export default SubTypeHeaderSkeleton;
