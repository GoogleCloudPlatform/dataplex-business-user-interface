import React from 'react';
import { Box, Divider, Skeleton } from '@mui/material';

/**
 * Full-page skeleton loader for the BrowseByAnnotation page.
 * Matches the header layout (title, description, stats bar, tabs)
 * plus the annotation Overview body: Info card (flex:2) + Labels card (flex:1).
 */
const AnnotationPageSkeleton: React.FC = () => {
  return (
    <>
      {/* Header section */}
      <Box sx={{ flexShrink: 0 }}>
        {/* Row 0: Sections button */}
        <Box sx={{ padding: '12px 20px 0px' }}>
          <Skeleton variant="rounded" width={105} height={32} sx={{ borderRadius: '59px' }} />
        </Box>
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
          }}
        >
          {/* Row 1: Title - icon + title */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '20px', width: '100%', minHeight: '40px' }}>
            <Skeleton variant="rounded" width={48} height={48} sx={{ borderRadius: '10px', flexShrink: 0 }} />
            <Skeleton variant="text" width={300} height={36} />
          </Box>

          {/* Row 2: Description */}
          <Box sx={{ width: '100%' }}>
            <Skeleton variant="text" width="80%" height={20} />
            <Skeleton variant="text" width="50%" height={20} />
          </Box>
        </Box>
        {/* Row 3: Tabs */}
        <Box sx={{
            display: 'flex',
            gap: '40px',
            paddingLeft: '1.75rem',
            minHeight: '47px',
            alignItems: 'center'
          }}>
          <Skeleton variant="text" width={80} height={20} sx={{ borderRadius: '4px' }} />
          <Skeleton variant="text" width={80} height={20} sx={{ borderRadius: '4px' }} />
        </Box>
        <Box sx={{ mx: '20px', borderBottom: '1px solid #DADCE0' }} />
      </Box>

      {/* Body — matches annotation Overview: Info (flex:2) + Labels (flex:1) side by side */}
      <Box sx={{ p: '0px 20px 20px 20px', flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: '10px', alignItems: 'flex-start', mt: '10px' }}>

          {/* Info card — flex: 2 */}
          <Box sx={{ flex: 2, border: '1px solid #ECEEF4', borderRadius: '12px', backgroundColor: '#FFFFFF', overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 24px' }}>
              <Skeleton variant="rounded" width={40} height={40} sx={{ borderRadius: '8px', flexShrink: 0 }} />
              <Skeleton variant="text" width={60} height={24} />
            </Box>
            <Divider sx={{ borderColor: '#ECEEF4' }} />
            <Box sx={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {([95, 55, 65, 55, 55, 80] as number[]).map((labelWidth, i) => (
                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Skeleton variant="text" width={labelWidth} height={16} />
                  <Skeleton variant="text" width={([100, 130, 90, 40, 280, 80] as number[])[i]} height={16} />
                </Box>
              ))}
            </Box>
          </Box>

          {/* Labels card — flex: 1 */}
          <Box sx={{ flex: 1, border: '1px solid #ECEEF4', borderRadius: '12px', backgroundColor: '#FFFFFF', overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 24px' }}>
              <Skeleton variant="rounded" width={40} height={40} sx={{ borderRadius: '8px', flexShrink: 0 }} />
              <Skeleton variant="text" width={65} height={24} />
            </Box>
            <Divider sx={{ borderColor: '#ECEEF4' }} />
            <Box sx={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {([90, 70, 110, 80] as number[]).map((w, i) => (
                <Skeleton key={i} variant="rounded" width={w} height={24} sx={{ borderRadius: '8px' }} />
              ))}
            </Box>
          </Box>

        </Box>
      </Box>
    </>
  );
};

export default AnnotationPageSkeleton;
