import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Chip, Badge, CircularProgress } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';

import type { DataProduct } from '../../types/DataProduct';
import SearchEntriesCard from '../SearchEntriesCard/SearchEntriesCard';
import Api from '../../api/api';
import ChatTab from '../ConversationalAnalytics/ChatTab';

/**
 * Data Product Page Component
 * Displays details of a specific Data Product and its associated tables/assets
 */
const DataProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // const { user } = useAuth(); // Not currently used
  const [dataProduct, setDataProduct] = useState<DataProduct | null>(null);
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!id) {
      navigate('/search');
      return;
    }

    const fetchDataProduct = async () => {
      try {
        setLoading(true);
        const response = await Api.get(`/dataproducts/${id}`);
        // Response data extraction depends on API format.
        // Assuming response.data.data is the product object
        if (response.data && response.data.data) {
          const product = response.data.data;
          setDataProduct(product);
          // If product has assets/tables, set them.
          // Note: Dataplex API might use different field names like 'assets' or 'tables'.
          // We'll check both.
          const assets = product.tables || product.assets || [];
          if (assets.length > 0) {
            setTables(assets); // If they are full objects
            // If they are just refs, we might need fetchTableDetails(assets)
          }
        } else {
          console.error("Product data missing in response");
          // Optional: Navigate away or show error
        }
      } catch (error) {
        console.error("Error fetching data product:", error);
        // Optional: Navigate away or show error
      } finally {
        setLoading(false);
      }
    };

    fetchDataProduct();
  }, [id, navigate]);



  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!dataProduct) {
    return (
      <Box p={3}>
        <Typography variant="h5">Data Product not found</Typography>
      </Box>
    );
  }

  const isComingSoon = dataProduct.status === 'coming-soon';

  return (
    <Box sx={{ p: 3, backgroundColor: '#F8FAFD', minHeight: '100vh' }}>
      <Box sx={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              {dataProduct.displayName}
            </Typography>
            {isComingSoon && (
              <Badge badgeContent="Coming Soon" color="warning" sx={{ '& .MuiBadge-badge': { fontSize: '0.75rem', padding: '4px 8px' } }} />
            )}
            {dataProduct.status === 'active' && (
              <Chip label="Active" color="success" size="small" />
            )}
          </Box>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {dataProduct.description}
          </Typography>
          {dataProduct.owner && (
            <Typography variant="body2" color="text.secondary">
              Owner: {dataProduct.owner}
            </Typography>
          )}
          {dataProduct.tags && dataProduct.tags.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
              {dataProduct.tags.map((tag) => (
                <Chip key={tag} label={tag} size="small" variant="outlined" />
              ))}
            </Box>
          )}
        </Box>

        {/* Tables/Assets Section */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '3fr 2fr' }, gap: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Tables & Assets ({tables.length})
              </Typography>
              {isComingSoon ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    This Data Product is coming soon. Tables and assets will be available here once the product is active.
                  </Typography>
                </Box>
              ) : tables.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    No tables or assets are currently associated with this Data Product.
                  </Typography>
                </Box>
              ) : (
                <Box>
                  {tables.map((table: any, index: number) => (
                    <Box key={table?.name || index} sx={{ mb: 2 }}>
                      <SearchEntriesCard
                        entry={table}
                        onDoubleClick={(entry: any) => {
                          navigate('/view-details', { state: { entry } });
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Chat Section */}
          <Card>
            <CardContent>
              <ChatTab entry={{ ...dataProduct, _isDataProduct: true, _dataProduct: { ...dataProduct, tables } }} />
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default DataProductPage;

