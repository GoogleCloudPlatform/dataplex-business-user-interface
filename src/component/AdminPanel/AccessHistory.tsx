
import { useState, useEffect } from 'react';
import axios from 'axios';
import { URLS } from '../../constants/urls';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    Chip
} from '@mui/material';
import { useNotification } from '../../contexts/NotificationContext';
import DeleteIcon from '@mui/icons-material/Delete';

const AccessHistory = () => {
    const [grants, setGrants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();
    const userEmail = localStorage.getItem('userEmail') || ''; // Assuming stored

    // In Admin view we probably want to see ALL active grants or filterable
    // For now showing all active grants
    useEffect(() => {
        fetchGrants();
    }, []);

    const fetchGrants = async () => {
        try {
            const response = await axios.get(`${URLS.API_URL}${URLS.GRANTED_ACCESSES}`, {
                params: { status: 'ACTIVE' }
            });
            if (response.data) {
                setGrants(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch grants:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRevoke = async (grant: any) => {
        if (!window.confirm(`Are you sure you want to revoke access for ${grant.userEmail} on ${grant.assetName}?`)) return;

        try {
            const response = await axios.post(`${URLS.API_URL}${URLS.REVOKE_ACCESS}`, {
                grantId: grant.id, // Firestore ID
                userEmail: grant.userEmail,
                assetName: grant.assetName,
                grantedBy: userEmail
            });

            if (response.data.success) {
                showNotification('Access revoked successfully!', 'success');
                fetchGrants(); // Refresh
            } else {
                showNotification(`Revoke failed: ${response.data.error}`, 'error');
            }
        } catch (err: any) {
            showNotification(`Error revoking access: ${err.message}`, 'error');
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 3 }}>Active Access Grants (History)</Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell>Asset Name</TableCell>
                            <TableCell>User Email</TableCell>
                            <TableCell>Role</TableCell>
                            <TableCell>Granted By</TableCell>
                            <TableCell>Granted At</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {grants.map((grant) => (
                            <TableRow key={grant.id}>
                                <TableCell>{grant.assetName}</TableCell>
                                <TableCell>{grant.userEmail}</TableCell>
                                <TableCell>
                                    <Chip label={grant.role} size="small" color="primary" variant="outlined" />
                                </TableCell>
                                <TableCell>{grant.grantedBy}</TableCell>
                                <TableCell>
                                    {grant.grantedAt && new Date(grant.grantedAt._seconds * 1000).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        size="small"
                                        startIcon={<DeleteIcon />}
                                        onClick={() => handleRevoke(grant)}
                                    >
                                        Revoke
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {grants.length === 0 && !loading && (
                            <TableRow>
                                <TableCell colSpan={6} align="center">No active grants found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default AccessHistory;
