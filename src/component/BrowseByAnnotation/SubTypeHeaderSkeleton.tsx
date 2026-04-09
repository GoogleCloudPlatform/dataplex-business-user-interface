import React from 'react';
import { Box, Skeleton } from '@mui/material';

/**
 * @file SubTypeHeaderSkeleton.tsx
 * @summary Skeleton loader for Sub Type header in Browse by Annotation
 *
 * @description
 * Displays a skeleton loading state matching the Sub Type header layout
 * with back button, icon, title, and description placeholders.
 */

const SubTypeHeaderSkeleton: React.FC = () => {
  return (
    <Box sx={{ flexShrink: 0 }}>
      {/* Title Row Skeleton */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          padding: '20px 20px 0px',
        }}
      >
        {/* Back Arrow Skeleton */}
        <Skeleton
          variant="circular"
          width={24}
          height={24}
          sx={{ bgcolor: '#E8EAED', flexShrink: 0 }}
        />
        {/* Icon Skeleton */}
        <Skeleton
          variant="rounded"
          width={48}
          height={48}
          sx={{ borderRadius: '10px', bgcolor: '#E8EAED', flexShrink: 0 }}
        />
        {/* Title Skeleton */}
        <Skeleton
          variant="text"
          width={250}
          height={36}
          sx={{ borderRadius: '4px', bgcolor: '#E8EAED' }}
        />
      </Box>
      {/* Description Skeleton */}
      <Box sx={{ padding: '16px 20px 0px' }}>
        <Skeleton
          variant="text"
          width={400}
          height={20}
          sx={{ borderRadius: '4px', bgcolor: '#E8EAED' }}
        />
      </Box>
    </Box>
  );
};

export default SubTypeHeaderSkeleton;
