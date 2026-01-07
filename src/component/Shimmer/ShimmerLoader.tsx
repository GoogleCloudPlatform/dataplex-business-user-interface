import React from 'react';
import { Box } from '@mui/material';

/**
 * @file ShimmerLoader.tsx
 * @description
 * This component renders a "shimmer" loading placeholder, commonly used to
 * indicate that content is being fetched. It displays a repeating pattern of
 * greyed-out shapes that mimic the structure of the content being loaded,
 * along with a sweeping gradient animation to create the shimmer effect.
 *
 * It supports three distinct visual types:
 * - **'list' (default)**: Renders placeholders that resemble a search result
 * card (icon, title, description, tags).
 * - **'table'**: Renders placeholders that resemble table rows.
 * - **'card'**: Renders simple rectangular placeholders.
 *
 * The number of items rendered is configurable via the `count` prop.
 *
 * @param {ShimmerLoaderProps} props - The props for the component.
 * @param {number} [props.count=6] - (Optional) The number of shimmer items
 * to render. Defaults to 6.
 * @param {'list' | 'table' | 'card'} [props.type='list'] - (Optional) The
 * visual style of the shimmer loader. Defaults to 'list'.
 *
 * @returns {React.ReactElement} A React element (`Box`) containing the
 * specified number of shimmer placeholders in the chosen style.
 */

interface ShimmerLoaderProps {
  count?: number;
  type?: 'list' | 'table' | 'card'| 'simple-list'| 'header'| 'title';
}

const ShimmerLoader: React.FC<ShimmerLoaderProps> = ({ count = 6, type = 'list' }) => {
  const renderTitleShimmer = () => (
    <>
      <Box 
        sx={{ 
          width: '250px', // Typical length for a title
          height: '24px', // Matches h5 line-height/font-size
          backgroundColor: '#F0F0F0', 
          borderRadius: '4px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
          {/* Shimmer Animation Overlay */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
              animation: 'shimmer 1.5s infinite',
              '@keyframes shimmer': { '0%': { left: '-100%' }, '100%': { left: '100%' } }
            }}
          />
      </Box>
    </>
  );
  const renderHeaderShimmer = () => (
    <>
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1, // Matches the gap={1} in your real header
          width: '100%',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
          {/* Shimmer Animation Overlay */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(240,240,240,0.8), transparent)',
              animation: 'shimmer 1.5s infinite',
              '@keyframes shimmer': { '0%': { left: '-100%' }, '100%': { left: '100%' } }
            }}
          />

          {/* Icon Placeholder: 24px square (matching your medium icon) */}
          <Box 
            sx={{ 
              width: 24, 
              height: 24, 
              backgroundColor: '#F0F0F0', 
              borderRadius: '4px',
              flexShrink: 0 
            }} 
          />
          
          {/* Title Placeholder: Mimics h5 text height */}
          <Box 
            sx={{ 
              width: '200px', 
              height: '24px', 
              backgroundColor: '#F0F0F0', 
              borderRadius: '4px' 
            }} 
          />
      </Box>
    </>
  );
  const renderSimpleListShimmer = () => (
    <>
      {[...Array(count)].map((_, index) => (
        <Box
          key={index}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px',
            padding: '8px 12px', // Minimal padding
            // No border, No background color, No box shadow
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Shimmer Animation */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(240,240,240,0.8), transparent)', // Lighter gradient for white bg
              animation: 'shimmer 1.5s infinite',
              '@keyframes shimmer': { '0%': { left: '-100%' }, '100%': { left: '100%' } }
            }}
          />

          {/* Icon placeholder (Circle or small square) */}
          <Box
            sx={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#F0F0F0',
              flexShrink: 0
            }}
          />

          {/* Text placeholder (Line) */}
          <Box
            sx={{
              width: '70%',
              height: '14px',
              backgroundColor: '#F0F0F0',
              borderRadius: '4px'
            }}
          />
        </Box>
      ))}
    </>
  );
  const renderListShimmer = () => (
    <>
      {[...Array(count)].map((_, index) => (
        <Box
          key={index}
          sx={{
            marginBottom: '10px',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '16px',
            border: '1px solid #E0E0E0',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Shimmer Animation */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
              animation: 'shimmer 1.5s infinite',
              '@keyframes shimmer': {
                '0%': {
                  left: '-100%'
                },
                '100%': {
                  left: '100%'
                }
              }
            }}
          />
          
          {/* Shimmer Content Structure */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            {/* Icon placeholder */}
            <Box
              sx={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: '#F0F0F0',
                flexShrink: 0
              }}
            />
            
            {/* Title placeholder */}
            <Box sx={{ flex: 1 }}>
              <Box
                sx={{
                  width: '60%',
                  height: '16px',
                  backgroundColor: '#F0F0F0',
                  borderRadius: '4px',
                  marginBottom: '4px'
                }}
              />
              <Box
                sx={{
                  width: '40%',
                  height: '12px',
                  backgroundColor: '#F0F0F0',
                  borderRadius: '4px'
                }}
              />
            </Box>
          </Box>
          
          {/* Description placeholder */}
          <Box
            sx={{
              width: '80%',
              height: '12px',
              backgroundColor: '#F0F0F0',
              borderRadius: '4px',
              marginBottom: '8px'
            }}
          />
          
          {/* Tags placeholder */}
          <Box sx={{ display: 'flex', gap: '8px' }}>
            <Box
              sx={{
                width: '60px',
                height: '20px',
                backgroundColor: '#F0F0F0',
                borderRadius: '12px'
              }}
            />
            <Box
              sx={{
                width: '80px',
                height: '20px',
                backgroundColor: '#F0F0F0',
                borderRadius: '12px'
              }}
            />
          </Box>
        </Box>
      ))}
    </>
  );

  const renderTableShimmer = () => (
    <>
      {[...Array(count)].map((_, index) => (
        <Box
          key={index}
          sx={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: '1px solid #E0E0E0',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Shimmer Animation */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
              animation: 'shimmer 1.5s infinite',
              '@keyframes shimmer': {
                '0%': {
                  left: '-100%'
                },
                '100%': {
                  left: '100%'
                }
              }
            }}
          />
          
          {/* Table row content */}
          <Box sx={{ display: 'flex', gap: '16px', width: '100%' }}>
            <Box
              sx={{
                width: '30%',
                height: '16px',
                backgroundColor: '#F0F0F0',
                borderRadius: '4px'
              }}
            />
            <Box
              sx={{
                width: '25%',
                height: '16px',
                backgroundColor: '#F0F0F0',
                borderRadius: '4px'
              }}
            />
            <Box
              sx={{
                width: '25%',
                height: '16px',
                backgroundColor: '#F0F0F0',
                borderRadius: '4px'
              }}
            />
            <Box
              sx={{
                width: '20%',
                height: '16px',
                backgroundColor: '#F0F0F0',
                borderRadius: '4px'
              }}
            />
          </Box>
        </Box>
      ))}
    </>
  );

  const renderCardShimmer = () => (
    <>
      {[...Array(count)].map((_, index) => (
        <Box
          key={index}
          sx={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '16px',
            border: '1px solid #E0E0E0',
            position: 'relative',
            overflow: 'hidden',
            marginBottom: '16px'
          }}
        >
          {/* Shimmer Animation */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
              animation: 'shimmer 1.5s infinite',
              '@keyframes shimmer': {
                '0%': {
                  left: '-100%'
                },
                '100%': {
                  left: '100%'
                }
              }
            }}
          />
          
          {/* Card content */}
          <Box
            sx={{
              width: '70%',
              height: '20px',
              backgroundColor: '#F0F0F0',
              borderRadius: '4px',
              marginBottom: '12px'
            }}
          />
          <Box
            sx={{
              width: '90%',
              height: '14px',
              backgroundColor: '#F0F0F0',
              borderRadius: '4px',
              marginBottom: '8px'
            }}
          />
          <Box
            sx={{
              width: '60%',
              height: '14px',
              backgroundColor: '#F0F0F0',
              borderRadius: '4px'
            }}
          />
        </Box>
      ))}
    </>
  );

  const renderShimmer = () => {
    switch (type) {
      case 'title':
        return renderTitleShimmer();
      case 'header':
        return renderHeaderShimmer();
      case 'simple-list':
        return renderSimpleListShimmer();
      case 'table':
        return renderTableShimmer();
      case 'card':
        return renderCardShimmer();
      case 'list':
      default:
        return renderListShimmer();
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {renderShimmer()}
    </Box>
  );
};

export default ShimmerLoader;
