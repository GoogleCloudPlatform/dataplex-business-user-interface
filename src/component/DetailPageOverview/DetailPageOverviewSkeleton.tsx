import React from 'react';
import { Box, Grid, Skeleton } from '@mui/material';

/**
 * @file DetailPageOverviewSkeleton.tsx
 * @summary Skeleton loader component for DetailPageOverview
 *
 * @description
 * This component displays a skeleton loading state that mimics the
 * DetailPageOverview layout. It uses a 9:3 grid ratio with accordion-like
 * skeleton boxes on the left (Details, Documentation) and right sidebar
 * (Contacts, Info, Usage Metrics, Labels).
 */

const AccordionSkeleton: React.FC<{
  rows?: number;
  showAvatar?: boolean;
  showChips?: boolean;
}> = ({ rows = 4, showAvatar = false, showChips = false }) => (
  <Box
    sx={{
      border: '1px solid #DADCE0',
      borderRadius: '8px',
      mb: 2,
      overflow: 'hidden',
    }}
  >
    {/* Accordion Header */}
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 2,
        borderBottom: '1px solid #DADCE0',
      }}
    >
      <Skeleton variant="circular" width={24} height={24} />
      <Skeleton variant="text" width={120} height={24} />
    </Box>
    {/* Accordion Content */}
    <Box sx={{ p: 2 }}>
      {showAvatar ? (
        // Contact-style rows with avatar
        [1, 2].map((i) => (
          <Box
            key={i}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mb: i < 2 ? 2 : 0,
            }}
          >
            <Skeleton variant="circular" width={40} height={40} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" height={20} />
              <Skeleton variant="text" width="40%" height={16} />
            </Box>
          </Box>
        ))
      ) : showChips ? (
        // Chip-style content for labels
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton
              key={i}
              variant="rounded"
              width={80 + i * 10}
              height={24}
              sx={{ borderRadius: '12px' }}
            />
          ))}
        </Box>
      ) : (
        // Standard field rows
        [...Array(rows)].map((_, i) => (
          <Box
            key={i}
            sx={{
              display: 'flex',
              gap: 2,
              mb: i < rows - 1 ? 2 : 0,
            }}
          >
            <Skeleton variant="text" width={100} height={20} />
            <Skeleton variant="text" width="60%" height={20} />
          </Box>
        ))
      )}
    </Box>
  </Box>
);

const DocumentationSkeleton: React.FC = () => (
  <Box
    sx={{
      border: '1px solid #DADCE0',
      borderRadius: '8px',
      overflow: 'hidden',
    }}
  >
    {/* Accordion Header */}
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 2,
        borderBottom: '1px solid #DADCE0',
      }}
    >
      <Skeleton variant="circular" width={24} height={24} />
      <Skeleton variant="text" width={140} height={24} />
    </Box>
    {/* Documentation Content */}
    <Box sx={{ p: 2 }}>
      <Skeleton variant="text" width="100%" height={20} />
      <Skeleton variant="text" width="95%" height={20} />
      <Skeleton variant="text" width="90%" height={20} />
      <Skeleton variant="text" width="85%" height={20} />
      <Skeleton variant="text" width="70%" height={20} />
    </Box>
  </Box>
);

const DetailPageOverviewSkeleton: React.FC = () => {
  return (
    <Box sx={{ p: 0 }}>
      <Grid container spacing={2}>
        {/* Left Panel - 9 columns */}
        <Grid size={9}>
          {/* Details Accordion Skeleton */}
          <AccordionSkeleton rows={5} />

          {/* Documentation Accordion Skeleton */}
          <DocumentationSkeleton />
        </Grid>

        {/* Right Sidebar - 3 columns */}
        <Grid size={3}>
          {/* Contacts Accordion Skeleton */}
          <AccordionSkeleton showAvatar />

          {/* Info Accordion Skeleton */}
          <AccordionSkeleton rows={2} />

          {/* Usage Metrics Accordion Skeleton */}
          <AccordionSkeleton rows={3} />

          {/* Labels Accordion Skeleton */}
          <AccordionSkeleton showChips />
        </Grid>
      </Grid>
    </Box>
  );
};

export default DetailPageOverviewSkeleton;
