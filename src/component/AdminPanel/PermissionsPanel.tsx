import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    IconButton,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Alert,
    Chip
} from '@mui/material';
import { Delete, Add, Refresh, ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Api from '../../api/api';

interface IAMBinding {
    role: string;
    members: string[];
}

interface IAMPolicy {
    version?: number;
    bindings: IAMBinding[];
    etag?: string;
}

interface DataplexResource {
    name: string;
    displayName?: string;
}

const PermissionsPanel: React.FC = () => {
    const navigate = useNavigate();
    const [resources, setResources] = useState<DataplexResource[]>([]);
    const [selectedResource, setSelectedResource] = useState<string>('');
    const [policy, setPolicy] = useState<IAMPolicy | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Dialog state for adding member
    const [openAdd, setOpenAdd] = useState(false);
    const [newMember, setNewMember] = useState('');
    const [newRole, setNewRole] = useState('roles/dataplex.viewer');
    const [memberType, setMemberType] = useState<'user' | 'group' | 'serviceAccount'>('user');

    const dataplexRoles = [
        { value: 'roles/dataplex.viewer', label: 'Dataplex Viewer' },
        { value: 'roles/dataplex.metadataReader', label: 'Dataplex Metadata Reader' },
        { value: 'roles/dataplex.dataOwner', label: 'Dataplex Data Owner' },
        { value: 'roles/dataplex.editor', label: 'Dataplex Editor' },
        { value: 'roles/dataplex.admin', label: 'Dataplex Admin' },
    ];

    useEffect(() => {
        fetchResources();
    }, []);

    const fetchResources = async () => {
        try {
            setLoading(true);
            const response = await Api.get('/iam/resources');
            if (response.data && response.data.success) {
                const lakes = response.data.data;
                setResources(lakes);
                if (lakes.length > 0) {
                    setSelectedResource(lakes[0].name);
                    fetchPolicy(lakes[0].name);
                }
            }
        } catch (err: any) {
            setError("Failed to fetch Dataplex resources. Ensure you have the necessary permissions.");
        } finally {
            setLoading(false);
        }
    };

    const fetchPolicy = async (resourceName: string) => {
        if (!resourceName) return;
        try {
            setLoading(true);
            const response = await Api.post('/iam/get', { resourceName });
            if (response.data && response.data.success) {
                setPolicy(response.data.data);
            }
        } catch (err: any) {
            setError("Failed to fetch IAM Policy for this resource.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePolicy = async (updatedPolicy: IAMPolicy) => {
        try {
            setLoading(true);
            const response = await Api.post('/iam/set', {
                resourceName: selectedResource,
                policy: updatedPolicy
            });
            if (response.data && response.data.success) {
                setPolicy(response.data.data);
                setError(null);
            }
        } catch (err: any) {
            setError("Failed to update IAM Policy.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddMember = () => {
        if (!policy || !newMember) return;

        const memberToAdd = newMember.includes(':')
            ? newMember
            : `${memberType}:${newMember}`;

        const newPolicy = JSON.parse(JSON.stringify(policy)) as IAMPolicy;
        let binding = newPolicy.bindings.find(b => b.role === newRole);

        if (binding) {
            if (!binding.members.includes(memberToAdd)) {
                binding.members.push(memberToAdd);
            }
        } else {
            newPolicy.bindings.push({ role: newRole, members: [memberToAdd] });
        }

        handleUpdatePolicy(newPolicy);
        setOpenAdd(false);
        setNewMember('');
    };

    const handleRemoveMember = (roleValue: string, memberEmail: string) => {
        if (!policy) return;

        const newPolicy = JSON.parse(JSON.stringify(policy)) as IAMPolicy;
        const binding = newPolicy.bindings.find(b => b.role === roleValue);

        if (binding) {
            binding.members = binding.members.filter(m => m !== memberEmail);
            if (binding.members.length === 0) {
                newPolicy.bindings = newPolicy.bindings.filter(b => b.role !== roleValue);
            }
            handleUpdatePolicy(newPolicy);
        }
    };

    return (
        <Box sx={{ p: 4, backgroundColor: '#F8FAFD', minHeight: '100vh' }}>
            <Box sx={{ maxWidth: '1200px', margin: '0 auto' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                    <IconButton onClick={() => navigate('/admin-panel')} sx={{ mr: 2 }}>
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                        Permissions Management
                    </Typography>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}

                <Paper sx={{ p: 3, mb: 4, borderRadius: '12px' }}>
                    <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', mb: 3 }}>
                        <FormControl sx={{ minWidth: 300 }}>
                            <InputLabel>Resource (Lake)</InputLabel>
                            <Select
                                value={selectedResource}
                                label="Resource (Lake)"
                                onChange={(e) => {
                                    setSelectedResource(e.target.value);
                                    fetchPolicy(e.target.value);
                                }}
                            >
                                {resources.map(res => (
                                    <MenuItem key={res.name} value={res.name}>
                                        {res.displayName || res.name.split('/').pop()}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <IconButton onClick={() => fetchPolicy(selectedResource)}>
                            <Refresh />
                        </IconButton>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">Current Access Bindings</Typography>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => setOpenAdd(true)}
                            sx={{ backgroundColor: '#0E4DCA' }}
                        >
                            Add Member
                        </Button>
                    </Box>

                    {loading ? (
                        <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
                    ) : !policy || !policy.bindings || policy.bindings.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography color="text.secondary">No IAM bindings found for this resource.</Typography>
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: '#F8FAFD' }}>
                                        <TableCell><strong>Role</strong></TableCell>
                                        <TableCell><strong>Members</strong></TableCell>
                                        <TableCell align="right"><strong>Actions</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {policy.bindings.map((binding) => (
                                        <TableRow key={binding.role} hover>
                                            <TableCell sx={{ minWidth: 250 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {dataplexRoles.find(r => r.value === binding.role)?.label || binding.role.split('.').pop()}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">{binding.role}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                    {binding.members.map(member => (
                                                        <Chip
                                                            key={member}
                                                            label={member.split(':').pop()}
                                                            size="small"
                                                            color="primary"
                                                            variant="outlined"
                                                            sx={{ backgroundColor: '#E8F0FE', borderColor: '#ADC1EE' }}
                                                        />
                                                    ))}
                                                </Box>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                    {binding.members.map(member => (
                                                        <IconButton
                                                            key={`${binding.role}-${member}`}
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleRemoveMember(binding.role, member)}
                                                            title={`Remove ${member}`}
                                                        >
                                                            <Delete fontSize="small" />
                                                        </IconButton>
                                                    ))}
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Paper>
            </Box>

            {/* Add Member Dialog */}
            <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add New Access Binding</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <FormControl fullWidth>
                            <InputLabel>Member Type</InputLabel>
                            <Select
                                value={memberType}
                                label="Member Type"
                                onChange={(e) => setMemberType(e.target.value as any)}
                            >
                                <MenuItem value="user">User</MenuItem>
                                <MenuItem value="group">Google Group</MenuItem>
                                <MenuItem value="serviceAccount">Service Account</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            label={memberType === 'group' ? "Group Email" : memberType === 'serviceAccount' ? "Service Account Email" : "User Email"}
                            fullWidth
                            value={newMember}
                            onChange={(e) => setNewMember(e.target.value)}
                            variant="outlined"
                            placeholder={memberType === 'group' ? "my-group@googlegroups.com" : "user@company.com"}
                        />
                        <FormControl fullWidth>
                            <InputLabel>Dataplex Role</InputLabel>
                            <Select
                                value={newRole}
                                label="Dataplex Role"
                                onChange={(e) => setNewRole(e.target.value)}
                            >
                                {dataplexRoles.map(role => (
                                    <MenuItem key={role.value} value={role.value}>{role.label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAdd(false)}>Cancel</Button>
                    <Button onClick={handleAddMember} variant="contained" sx={{ backgroundColor: '#0E4DCA' }} disabled={!newMember}>
                        Grant Access
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PermissionsPanel;
