import React from 'react';
import { Box, Divider, Grid, Skeleton } from '@mui/material';

/**
 * @file DetailPageOverviewSkeleton.tsx
 * @summary Skeleton loader component for DetailPageOverview
 *
 * @description
 * This component displays a skeleton loading state that mimics the
 * DetailPageOverview card-based layout. It uses a 9:3 grid ratio with
 * card skeletons on the left (Table Info, Documentation) and right sidebar
 * (Contacts, Usage Metrics, Timestamps, Labels).
 */

const CardSkeleton: React.FC<{
  headerWidth?: number;
  children: React.ReactNode;
}> = ({ headerWidth = 120, children }) => (
  <Box
    sx={{
      border: '1px solid #DADCE0',
      borderRadius: '12px',
      marginTop: '10px',
      overflow: 'hidden',
      backgroundColor: '#FFFFFF',
    }}
  >
    {/* Card Header */}
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px 20px',
      }}
    >
      <Skeleton variant="rounded" width={32} height={32} sx={{ borderRadius: '6px', flexShrink: 0 }} />
      <Skeleton variant="text" width={headerWidth} height={24} />
    </Box>
    <Divider sx={{ width: '100%', borderColor: '#DADCE0' }} />
    {/* Card Content */}
    <Box sx={{ padding: '16px 20px' }}>
      {children}
    </Box>
  </Box>
);

const DetailPageOverviewSkeleton: React.FC = () => {
  return (
    <Grid container spacing={0}>
      {/* Left Panel - 9 columns */}
      <Grid size={9} sx={{ padding: '10px 0px 10px 0px' }}>
        {/* Table Info Card */}
        <CardSkeleton headerWidth={100}>
          {/* Schema tab skeleton */}
          <Box sx={{ display: 'flex', gap: '16px', mb: 2 }}>
            <Skeleton variant="text" width={60} height={20} />
            <Skeleton variant="text" width={80} height={20} />
          </Box>
          {/* Table rows */}
          {[...Array(6)].map((_, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
              <Skeleton variant="text" width={120} height={18} />
              <Skeleton variant="text" width="40%" height={18} />
              <Skeleton variant="text" width={80} height={18} />
            </Box>
          ))}
        </CardSkeleton>

        {/* Documentation Card */}
        <CardSkeleton headerWidth={140}>
          <Skeleton variant="text" width="100%" height={18} />
          <Skeleton variant="text" width="95%" height={18} />
          <Skeleton variant="text" width="90%" height={18} />
          <Skeleton variant="text" width="85%" height={18} />
          <Skeleton variant="text" width="70%" height={18} />
        </CardSkeleton>
      </Grid>

      {/* Right Sidebar - 3 columns */}
      <Grid size={3} sx={{ padding: '10px 0px 10px 10px' }}>
        {/* Contacts Card */}
        <CardSkeleton headerWidth={90}>
          {[1, 2].map((i) => (
            <Box
              key={i}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 0px',
                borderBottom: i < 2 ? '1px solid #DADCE0' : 'none',
              }}
            >
              <Skeleton variant="circular" width={32} height={32} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="50%" height={16} />
                <Skeleton variant="text" width="70%" height={14} />
              </Box>
            </Box>
          ))}
        </CardSkeleton>

        {/* Usage Metrics Card */}
        <CardSkeleton headerWidth={130}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width={80} height={12} />
              <Skeleton variant="text" width={50} height={40} />
              <Skeleton variant="text" width={70} height={12} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width={80} height={12} />
              <Skeleton variant="text" width={40} height={40} />
              <Skeleton variant="text" width={50} height={12} />
            </Box>
          </Box>
        </CardSkeleton>

        {/* Timestamps Card */}
        <CardSkeleton headerWidth={110}>
          {['Created', 'Last modified'].map((_, i) => (
            <Box
              key={i}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 0px',
                borderBottom: i < 1 ? '1px solid #DADCE0' : 'none',
              }}
            >
              <Skeleton variant="text" width={80} height={14} />
              <Skeleton variant="text" width={120} height={14} />
            </Box>
          ))}
        </CardSkeleton>

        {/* Additional Info Card */}
        <CardSkeleton headerWidth={120}>
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 0px',
                borderBottom: i < 2 ? '1px solid #DADCE0' : 'none',
              }}
            >
              <Skeleton variant="text" width={70} height={14} />
              <Skeleton variant="text" width={100} height={14} />
            </Box>
          ))}
        </CardSkeleton>

        {/* Labels Card */}
        <CardSkeleton headerWidth={70}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton
                key={i}
                variant="rounded"
                width={70 + i * 10}
                height={20}
                sx={{ borderRadius: '8px' }}
              />
            ))}
          </Box>
        </CardSkeleton>
      </Grid>
    </Grid>
  );
};

export default DetailPageOverviewSkeleton;
