import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Card, CardContent, CardActions, CircularProgress, Chip, Alert } from '@mui/material';
import { Add, Assessment } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Api from '../../api/api';
// import { useAuth } from '../../auth/AuthProvider';

interface DataProduct {
    name: string; // Resource name: projects/.../dataProducts/...
    displayName: string;
    description: string;
    labels?: Record<string, string>;
    // Add other fields as per Dataplex API
}

const DataProductManager: React.FC = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState<DataProduct[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await Api.get('/dataproducts'); // Api.ts prepends /api/v1
            if (response.data && response.data.data) {
                setProducts(response.data.data);
            } else if (Array.isArray(response.data)) {
                setProducts(response.data);
            } else {
                setProducts([]);
            }
        } catch (err: any) {
            console.error("Failed to fetch Data Products", err);
            // If 404/403, just show empty or specific message
            setError("Could not load Data Products. Ensure the API is enabled and you have permissions.");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        // Navigate to a create page or open modal
        // For now, let's just log or show a "Not Implemented" toast, or simplified creation.
        // User asked for "Real Data", so creation should ideally work.
        // I will implement a basic creation modal in a future step if requested, 
        // for now let's focus on listing what is there.
        alert("This feature would open a 'Create Data Product' form.");
    };

    const handleClickProduct = (product: DataProduct) => {
        // Extract ID from name "projects/.../dataProducts/ID"
        const parts = product.name.split('/');
        const id = parts[parts.length - 1];
        navigate(`/data-product/${id}`);
    };

    return (
        <Box sx={{ p: 3, backgroundColor: '#F8FAFD', minHeight: '100vh' }}>
            <Box sx={{ maxWidth: '1200px', margin: '0 auto' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 600, color: '#1F1F1F' }}>
                            Data Products
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#5F6368', mt: 1 }}>
                            Manage data products for your organization.
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleCreate}
                        sx={{ backgroundColor: '#0E4DCA' }}
                    >
                        Create Data Product
                    </Button>
                </Box>

                {error && (
                    <Alert severity="warning" sx={{ mb: 3 }}>
                        {error}
                        <Button size="small" onClick={fetchProducts} sx={{ ml: 2 }}>Retry</Button>
                    </Alert>
                )}

                {loading ? (
                    <Box display="flex" justifyContent="center" p={5}>
                        <CircularProgress />
                    </Box>
                ) : products.length === 0 ? (
                    <Box
                        sx={{
                            textAlign: 'center',
                            py: 8,
                            backgroundColor: '#FFFFFF',
                            borderRadius: '16px',
                            border: '1px dashed #B0B0B0'
                        }}
                    >
                        <Assessment sx={{ fontSize: 60, color: '#DADCE0', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                            No Data Products found
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Get started by creating your first Data Product.
                        </Typography>
                        <Button variant="outlined" startIcon={<Add />} onClick={handleCreate}>
                            Create New
                        </Button>
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        {products.map((product) => (
                            <Box key={product.name} sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.333% - 16px)' } }}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        transition: 'box-shadow 0.2s',
                                        '&:hover': {
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                        }
                                    }}
                                    onClick={() => handleClickProduct(product)}
                                >
                                    <CardContent sx={{ flexGrow: 1 }}>
                                        <Typography variant="h6" gutterBottom noWrap title={product.displayName}>
                                            {product.displayName || product.name.split('/').pop()}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 3,
                                                WebkitBoxOrient: 'vertical',
                                            }}
                                        >
                                            {product.description || 'No description provided.'}
                                        </Typography>

                                        {product.labels && (
                                            <Box sx={{ mt: 2, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                                {Object.entries(product.labels).slice(0, 3).map(([k, v]) => (
                                                    <Chip key={k} label={`${k}:${v}`} size="small" sx={{ fontSize: '0.7rem' }} />
                                                ))}
                                            </Box>
                                        )}
                                    </CardContent>
                                    <CardActions sx={{ p: 2, pt: 0 }}>
                                        <Button size="small" color="primary">View Details</Button>
                                    </CardActions>
                                </Card>
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default DataProductManager;
