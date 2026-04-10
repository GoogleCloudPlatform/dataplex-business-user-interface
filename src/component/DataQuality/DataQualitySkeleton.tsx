import React from 'react';
import { Box, Skeleton } from '@mui/material';

const DataQualitySkeleton: React.FC = () => {
  return (
    <Box
      data-testid="data-quality-skeleton"
      sx={{
        display: 'flex',
        gap: '0.125rem',
        padding: '0 1.25rem 1.25rem 1.25rem',
        height: '100%',
        minHeight: '31.25rem',
        marginLeft: '-1.25rem',
        width: 'calc(100% + 2.5rem)',
      }}
    >
      {/* CurrentRules Skeleton - Left Panel */}
      <Box sx={{
        flex: 2,
        backgroundColor: '#ffffff',
        borderRadius: '0.5rem',
        border: '1px solid #E0E0E0',
        overflow: 'hidden',
        maxHeight: 'calc(100vh - 200px)',
      }}>
        {/* Header */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.969rem 1.25rem',
          backgroundColor: '#F8FAFD',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Skeleton variant="text" width={120} height={28} />
            <Skeleton variant="circular" width={18} height={18} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Skeleton variant="text" width={90} height={24} />
            <Skeleton variant="circular" width={24} height={24} />
          </Box>
        </Box>

        {/* Filter Bar */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          border: '1px solid #DADCE0',
          borderTopRightRadius: '0.5rem',
          borderTopLeftRadius: '0.5rem',
          backgroundColor: '#FFFFFF',
          margin: '0.625rem 0.625rem 0rem 0.625rem',
        }}>
          <Skeleton variant="circular" width={16} height={16} />
          <Skeleton variant="text" width={40} height={20} />
          <Skeleton variant="text" width="60%" height={20} />
        </Box>

        {/* Table */}
        <Box sx={{
          border: '1px solid #DADCE0',
          borderTop: 'none',
          borderRadius: '0 0 0.5rem 0.5rem',
          margin: '0px 10px 10px 10px',
          overflow: 'hidden',
          maxHeight: 'calc(100vh - 350px)',
        }}>
          {/* Table Header */}
          <Box sx={{
            display: 'flex',
            backgroundColor: '#F0F4F8',
            borderBottom: '1px solid #DADCE0',
            padding: '0.375rem 0.5rem',
          }}>
            <Box sx={{ width: '15%', px: 0.5 }}><Skeleton variant="text" width="80%" height={20} /></Box>
            <Box sx={{ width: '12%', px: 0.5 }}><Skeleton variant="text" width="80%" height={20} /></Box>
            <Box sx={{ width: '12%', px: 0.5 }}><Skeleton variant="text" width="80%" height={20} /></Box>
            <Box sx={{ width: '12%', px: 0.5 }}><Skeleton variant="text" width="80%" height={20} /></Box>
            <Box sx={{ width: '15%', px: 0.5 }}><Skeleton variant="text" width="80%" height={20} /></Box>
            <Box sx={{ width: '25%', px: 0.5 }}><Skeleton variant="text" width="80%" height={20} /></Box>
            <Box sx={{ width: '12%', px: 0.5 }}><Skeleton variant="text" width="80%" height={20} /></Box>
          </Box>

          {/* Table Rows */}
          {[1, 2, 3, 4, 5].map((row) => (
            <Box
              key={row}
              sx={{
                display: 'flex',
                padding: '0.375rem 0.5rem',
                borderBottom: row < 5 ? '1px solid #DADCE0' : 'none',
              }}
            >
              <Box sx={{ width: '15%', px: 0.5 }}><Skeleton variant="text" width="90%" height={18} /></Box>
              <Box sx={{ width: '12%', px: 0.5 }}><Skeleton variant="text" width="70%" height={18} /></Box>
              <Box sx={{ width: '12%', px: 0.5 }}><Skeleton variant="text" width="85%" height={18} /></Box>
              <Box sx={{ width: '12%', px: 0.5 }}><Skeleton variant="text" width="60%" height={18} /></Box>
              <Box sx={{ width: '15%', px: 0.5 }}><Skeleton variant="text" width="75%" height={18} /></Box>
              <Box sx={{ width: '25%', px: 0.5 }}><Skeleton variant="text" width="95%" height={18} /></Box>
              <Box sx={{ width: '12%', px: 0.5 }}><Skeleton variant="text" width="50%" height={18} /></Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* DataQualityStatus Skeleton - Right Panel */}
      <Box sx={{
        flex: 1,
        alignSelf: 'flex-start',
        backgroundColor: '#ffffff',
        borderRadius: '0.5rem',
        border: '1px solid #DADCE0',
        marginLeft: '1rem',
        height: '17rem',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem',
          backgroundColor: '#F8FAFD',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Skeleton variant="text" width={150} height={28} />
            <Skeleton variant="circular" width={18} height={18} />
          </Box>
          <Skeleton variant="circular" width={24} height={24} />
        </Box>

        {/* Content */}
        <Box sx={{ padding: '0px 0px 0px 20px' }}>
          {/* Overall Score Section */}
          <Box sx={{
            display: 'flex',
            flexDirection: 'row',
            borderBottom: '1px solid #DADCE0',
            padding: '14px 20px 14px 0px',
          }}>
            <Box sx={{ width: '101px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Skeleton variant="text" width={70} height={16} />
              <Skeleton variant="text" width={50} height={20} />
            </Box>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'center' }}>
              <Skeleton variant="rounded" width="80%" height={17} sx={{ borderRadius: '4px' }} />
              <Skeleton variant="text" width={80} height={16} />
            </Box>
          </Box>

          {/* Passed Rules / Completeness Row */}
          <Box sx={{
            display: 'flex',
            flexDirection: 'row',
            borderBottom: '1px solid #DADCE0',
            padding: '14px 20px 14px 0px',
          }}>
            <Box sx={{ width: '101px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Skeleton variant="text" width={70} height={16} />
              <Skeleton variant="text" width={30} height={20} />
            </Box>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <Skeleton variant="text" width={80} height={16} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Skeleton variant="circular" width={14} height={14} />
                <Skeleton variant="text" width={50} height={20} />
              </Box>
            </Box>
          </Box>

          {/* Uniqueness / Validity Row */}
          <Box sx={{
            display: 'flex',
            flexDirection: 'row',
            padding: '14px 20px 14px 0px',
          }}>
            <Box sx={{ width: '101px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Skeleton variant="text" width={70} height={16} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Skeleton variant="circular" width={14} height={14} />
                <Skeleton variant="text" width={40} height={20} />
              </Box>
            </Box>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <Skeleton variant="text" width={50} height={16} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Skeleton variant="circular" width={14} height={14} />
                <Skeleton variant="text" width={50} height={20} />
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default DataQualitySkeleton;
