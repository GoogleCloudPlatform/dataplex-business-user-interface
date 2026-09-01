import React from 'react';
import { Box, Skeleton } from '@mui/material';

/**
 * @file SubTypeHeaderSkeleton.tsx
 * @summary Skeleton loader for Sub Type header in Browse by Annotation
 *
 * @description
 * Displays a skeleton loading state matching the Sub Type header layout —
 * a bordered white card (mirroring MainComponent.tsx's resourceViewerHeader)
 * with back button, icon, title, and description placeholders.
 */

const SubTypeHeaderSkeleton: React.FC = () => {
  return (
    <Box
      sx={{
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px',
        gap: '20px',
        margin: '20px 20px 15px 20px',
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #ECEEF4',
        // flexShrink (not the `flex: 'none'` shorthand) — that shorthand triggers a
        // jsdom/cssstyle getComputedStyle bug in tests (crashes on any property
        // access once the rule exists), unrelated to real browsers.
        flexShrink: 0,
      }}
    >
      {/* Back Arrow, Icon, and Title Row */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          width: '100%',
          minHeight: '40px',
        }}
      >
        {/* Back Arrow Skeleton — matches the real 40x40 IconButton */}
        <Skeleton
          variant="circular"
          width={40}
          height={40}
          sx={{ bgcolor: '#E8EAED', flexShrink: 0 }}
        />
        {/* Icon Skeleton — matches ThemedIconContainer's default (medium) size */}
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
      <Skeleton
        variant="text"
        width="60%"
        height={20}
        sx={{ borderRadius: '4px', bgcolor: '#E8EAED' }}
      />
    </Box>
  );
};

export default SubTypeHeaderSkeleton;
