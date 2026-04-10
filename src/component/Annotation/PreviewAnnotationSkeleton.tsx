import React from 'react';
import { Box, Skeleton } from '@mui/material';

/**
 * Skeleton loader for PreviewAnnotation that mimics the accordion-based layout.
 * Shows 4 L1 aspect rows: first 2 expanded with L2 field skeletons, last 2 collapsed.
 */

const L2_CONFIGS = [
  [140, 100, 120], // Row 1: 3 fields with varying name widths
  [120, 80],       // Row 2: 2 fields
];

const L1_NAME_WIDTHS = [150, 180, 120, 160];

const L1Header: React.FC<{ nameWidth: number; expanded: boolean; isFirst: boolean; isLast: boolean }> = ({
  nameWidth, expanded, isFirst, isLast,
}) => (
  <Box sx={{
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minHeight: '48px',
    padding: '12px 8px',
    backgroundColor: expanded ? '#F0F4F8' : 'transparent',
    ...(isFirst && { borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }),
    ...(isLast && !expanded && { borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }),
  }}>
    <Skeleton variant="circular" width={24} height={24} sx={{ flexShrink: 0 }} />
    <Skeleton variant="rounded" width={20} height={20} sx={{ borderRadius: '4px', flexShrink: 0 }} />
    <Skeleton variant="text" width={nameWidth} height={20} />
  </Box>
);

const L2Row: React.FC<{ nameWidth: number; isLast: boolean }> = ({ nameWidth, isLast }) => (
  <Box sx={{
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px 8px 24px',
    background: '#F8FAFD',
    borderBottom: isLast ? 'none' : '1px solid #E9EEF6',
  }}>
    <Skeleton variant="circular" width={20} height={20} sx={{ flexShrink: 0 }} />
    <Skeleton variant="rounded" width={16} height={16} sx={{ borderRadius: '4px', flexShrink: 0 }} />
    <Skeleton variant="text" width={nameWidth} height={16} />
  </Box>
);

const PreviewAnnotationSkeleton: React.FC = () => {
  return (
    <Box data-testid="preview-annotation-skeleton" sx={{
      borderRadius: '12px',
      border: '1px solid #DADCE0',
      overflow: 'hidden',
    }}>
      {L1_NAME_WIDTHS.map((nameWidth, i) => {
        const expanded = i < L2_CONFIGS.length;
        const isFirst = i === 0;
        const isLast = i === L1_NAME_WIDTHS.length - 1;

        return (
          <Box key={i} sx={{
            borderBottom: isLast ? 'none' : '1px solid #DADCE0',
          }}>
            <L1Header
              nameWidth={nameWidth}
              expanded={expanded}
              isFirst={isFirst}
              isLast={isLast}
            />
            {expanded && (
              <Box sx={{ backgroundColor: '#F0F4F8' }}>
                {L2_CONFIGS[i].map((fieldWidth, j) => (
                  <L2Row
                    key={j}
                    nameWidth={fieldWidth}
                    isLast={j === L2_CONFIGS[i].length - 1}
                  />
                ))}
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
};

export default PreviewAnnotationSkeleton;
