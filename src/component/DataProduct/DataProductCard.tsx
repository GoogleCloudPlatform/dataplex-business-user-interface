import React from 'react';
import { Box, Typography, Card, CardContent, Chip, Badge } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AccessTime } from '@mui/icons-material';
import type { DataProduct } from '../../types/DataProduct';
import { getFormattedDateTimeParts } from '../../utils/resourceUtils';
import './DataProductCard.css';

interface DataProductCardProps {
  dataProduct: DataProduct;
  isSelected?: boolean;
  onDoubleClick?: (dataProduct: DataProduct) => void;
}

/**
 * Data Product Card Component
 * Displays a Data Product in search results with "Coming Soon" badge if applicable
 */
const DataProductCard: React.FC<DataProductCardProps> = ({ 
  dataProduct, 
  isSelected = false,
  onDoubleClick 
}) => {
  const navigate = useNavigate();
  const isComingSoon = dataProduct.status === 'coming-soon';

  const handleClick = () => {
    navigate(`/data-product/${dataProduct.id}`);
  };

  const handleDoubleClick = () => {
    if (onDoubleClick) {
      onDoubleClick(dataProduct);
    } else {
      navigate(`/data-product/${dataProduct.id}`);
    }
  };

  return (
    <Card
      className={`data-product-card ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      sx={{
        cursor: 'pointer',
        border: isSelected ? '2px solid #0B57D0' : '1px solid #E0E0E0',
        borderRadius: '8px',
        mb: 1,
        '&:hover': {
          boxShadow: 2,
          borderColor: '#0B57D0',
        },
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                {dataProduct.displayName}
              </Typography>
              {isComingSoon && (
                <Badge 
                  badgeContent="Coming Soon" 
                  color="warning"
                  sx={{ 
                    '& .MuiBadge-badge': { 
                      fontSize: '0.7rem', 
                      padding: '2px 6px',
                      borderRadius: '4px'
                    } 
                  }} 
                />
              )}
              {dataProduct.status === 'active' && (
                <Chip label="Active" color="success" size="small" sx={{ height: '20px', fontSize: '0.7rem' }} />
              )}
            </Box>
            <Chip 
              label="Data Product" 
              size="small" 
              sx={{ 
                backgroundColor: '#E8F0FE', 
                color: '#0B57D0',
                fontSize: '0.7rem',
                height: '20px',
                mb: 1
              }} 
            />
          </Box>
        </Box>

        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            mb: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.4
          }}
        >
          {dataProduct.description}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          {dataProduct.owner && (
            <Typography variant="caption" color="text.secondary">
              Owner: {dataProduct.owner}
            </Typography>
          )}
          {dataProduct.updatedAt && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AccessTime sx={{ fontSize: '0.875rem', color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {getFormattedDateTimeParts(parseInt(dataProduct.updatedAt)).date}
              </Typography>
            </Box>
          )}
        </Box>

        {dataProduct.tags && dataProduct.tags.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, mt: 1.5, flexWrap: 'wrap' }}>
            {dataProduct.tags.slice(0, 3).map((tag) => (
              <Chip 
                key={tag} 
                label={tag} 
                size="small" 
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: '20px' }}
              />
            ))}
            {dataProduct.tags.length > 3 && (
              <Typography variant="caption" color="text.secondary">
                +{dataProduct.tags.length - 3} more
              </Typography>
            )}
          </Box>
        )}

        {!isComingSoon && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {dataProduct.tables?.length || 0} table{dataProduct.tables?.length !== 1 ? 's' : ''}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default DataProductCard;



