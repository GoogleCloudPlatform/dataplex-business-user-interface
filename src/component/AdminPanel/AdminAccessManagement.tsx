import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Checkbox,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack,
  Refresh,
  CheckCircle,
  Cancel,
  Delete,
  PersonAdd,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { useAppDispatch, useAppSelector } from '../../app/store';
import {
  checkAdminStatus,
  fetchAllAdmins,
  fetchGrantedAccesses,
  revokeAccess,
  bulkApproveRequests,
  bulkRejectRequests,
  setAdminRole,
  removeAdminRole,
  type AccessRequest,
  type GrantedAccess,
} from '../../features/admin/adminSlice';
import { useNotification } from '../../contexts/NotificationContext';
import axios from 'axios';
import { URLS } from '../../constants/urls';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminAccessManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { showSuccess, showError } = useNotification();

  const { isDataOwner, hasAdminCapabilities, currentUserRole, allAdmins, grantedAccesses } = useAppSelector(
    (state) => state.admin
  );

  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState<AccessRequest[]>([]);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('AWAITING');
  const [accessStatusFilter, setAccessStatusFilter] = useState<string>('all');
  const [projectFilter] = useState<string>('');

  // Dialog states
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<GrantedAccess | null>(null);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'super-admin' | 'project-admin'>('project-admin');
  const [newAdminProjects, setNewAdminProjects] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [singleRejectDialogOpen, setSingleRejectDialogOpen] = useState(false);
  const [singleRejectRequestId, setSingleRejectRequestId] = useState<string | null>(null);
  const [singleRejectReason, setSingleRejectReason] = useState('');

  // Statuses that represent "awaiting action" (needs approval or rejection)
  const AWAITING_STATUSES = ['PENDING', 'PARTIALLY_APPROVED'];

  // Client-side filtering
  const filteredRequests = pendingRequests.filter((req) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'AWAITING') {
      return AWAITING_STATUSES.includes(req.status?.toUpperCase());
    }
    return req.status?.toUpperCase() === statusFilter.toUpperCase();
  });

  // Build unified access history: granted (ACTIVE/REVOKED) + rejected requests
  const rejectedAsHistory = pendingRequests
    .filter((req) => req.status === 'REJECTED')
    .map((req) => ({
      id: req.id,
      userEmail: req.requesterEmail,
      assetName: req.assetName,
      assetType: req.assetType || '',
      gcpProjectId: req.gcpProjectId || req.projectId,
      role: req.requestedRole || '',
      grantedAt: '',
      grantedBy: '',
      originalRequestId: req.id,
      status: 'REJECTED' as const,
      revokedAt: null,
      revokedBy: null,
      reviewedBy: req.reviewedBy || null,
      reviewedAt: req.reviewedAt || null,
      submittedAt: req.submittedAt,
    }));

  const allAccessHistory = [...grantedAccesses, ...rejectedAsHistory];

  const filteredAccesses = allAccessHistory.filter((access) => {
    if (accessStatusFilter === 'all') return true;
    return access.status?.toUpperCase() === accessStatusFilter.toUpperCase();
  });

  const token = user?.token || '';
  const email = user?.email || '';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Check admin status
      await dispatch(checkAdminStatus({ token, email }));

      // Fetch pending requests
      const params: Record<string, string> = { userEmail: email, userRole: 'admin' };
      // REMOVED status filter from params to enable client-side filtering
      if (projectFilter) params.projectId = projectFilter;

      const response = await axios.get(`${URLS.API_URL}${URLS.GET_ACCESS_REQUESTS}`, {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
          'x-user-email': email,
          'x-user-role': 'admin',
        },
      });

      if (response.data.success) {
        setPendingRequests(response.data.data || []);
      }

      // Fetch all granted accesses (active + revoked) for history
      await dispatch(fetchGrantedAccesses({ token, email }));

      // Fetch all admins if super-admin
      if (currentUserRole?.role === 'super-admin') {
        await dispatch(fetchAllAdmins({ token, email }));
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [dispatch, token, email, statusFilter, projectFilter, currentUserRole?.role]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setSelectedRequests([]);
  };

  const handleSelectAllRequests = (checked: boolean) => {
    if (checked) {
      setSelectedRequests(filteredRequests.filter((r) => r.status === 'PENDING').map((r) => r.id));
    } else {
      setSelectedRequests([]);
    }
  };

  const handleSelectRequest = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedRequests((prev) => [...prev, id]);
    } else {
      setSelectedRequests((prev) => prev.filter((r) => r !== id));
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      await axios.post(
        `${URLS.API_URL}${URLS.UPDATE_ACCESS_REQUEST}`,
        { requestId, status: 'APPROVED', reviewerEmail: email },
        { headers: { Authorization: `Bearer ${token}`, 'x-user-email': email } }
      );
      showSuccess('Access request approved successfully');
      fetchData();
    } catch (err) {
      showError('Failed to approve request');
    }
  };

  const handleReject = async (requestId: string, reason?: string) => {
    try {
      await axios.post(
        `${URLS.API_URL}${URLS.UPDATE_ACCESS_REQUEST}`,
        { requestId, status: 'REJECTED', reviewerEmail: email, adminNote: reason },
        { headers: { Authorization: `Bearer ${token}`, 'x-user-email': email } }
      );
      showSuccess('Access request rejected');
      fetchData();
    } catch (err) {
      showError('Failed to reject request');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedRequests.length === 0) return;
    try {
      await dispatch(bulkApproveRequests({ token, email, requestIds: selectedRequests }));
      showSuccess(`Approved ${selectedRequests.length} requests`);
      setSelectedRequests([]);
      fetchData();
    } catch (err) {
      showError('Failed to bulk approve');
    }
  };

  const handleBulkReject = async () => {
    if (selectedRequests.length === 0) return;
    try {
      await dispatch(bulkRejectRequests({ token, email, requestIds: selectedRequests, reason: rejectReason }));
      showSuccess(`Rejected ${selectedRequests.length} requests`);
      setSelectedRequests([]);
      setRejectDialogOpen(false);
      setRejectReason('');
      fetchData();
    } catch (err) {
      showError('Failed to bulk reject');
    }
  };

  const handleRevokeAccess = async () => {
    if (!revokeTarget) return;
    try {
      await dispatch(revokeAccess({ token, email, grantId: revokeTarget.id }));
      showSuccess('Access revoked successfully');
      setRevokeDialogOpen(false);
      setRevokeTarget(null);
      fetchData();
    } catch (err) {
      showError('Failed to revoke access');
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail) return;
    try {
      const projects = newAdminProjects.split(',').map((p) => p.trim()).filter(Boolean);
      await dispatch(
        setAdminRole({
          token,
          creatorEmail: email,
          email: newAdminEmail,
          role: newAdminRole,
          assignedProjects: projects,
        })
      );
      showSuccess(`Admin role assigned to ${newAdminEmail}`);
      setAdminDialogOpen(false);
      setNewAdminEmail('');
      setNewAdminProjects('');
      fetchData();
    } catch (err) {
      showError('Failed to add admin');
    }
  };

  const handleRemoveAdmin = async (adminEmail: string) => {
    try {
      await dispatch(removeAdminRole({ token, requesterEmail: email, targetEmail: adminEmail }));
      showSuccess(`Admin role removed from ${adminEmail}`);
      fetchData();
    } catch (err) {
      showError('Failed to remove admin');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const getStatusChip = (status: string) => {
    const colors: Record<string, 'warning' | 'success' | 'error' | 'default'> = {
      pending: 'warning',
      approved: 'success',
      rejected: 'error',
      PENDING: 'warning',
      APPROVED: 'success',
      REJECTED: 'error',
      ACTIVE: 'success',
      REVOKED: 'error',
    };
    return <Chip label={status.toUpperCase()} color={colors[status] || 'default'} size="small" />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#F8FAFD' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!hasAdminCapabilities) {
    return (
      <Box sx={{ backgroundColor: '#F8FAFD', minHeight: '100vh', p: 3 }}>
        <Alert severity="error">You do not have admin access. Contact a super-admin to request access, or request OWNER role on a BigQuery dataset.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: '#F8FAFD', minHeight: '100vh', padding: { xs: '0px 0.5rem', sm: '0px 1rem' } }}>
      <Box sx={{ backgroundColor: '#FFFFFF', borderRadius: { xs: '16px', sm: '20px' }, width: '100%', minHeight: '95vh', padding: { xs: '16px', sm: '24px' }, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', mb: 3 }}>
          <IconButton onClick={() => navigate('/home')} sx={{ color: '#1F1F1F' }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h5" sx={{ fontWeight: 500, color: '#1F1F1F' }}>
            Access Management
          </Typography>
          <Chip
            label={
              currentUserRole?.role === 'super-admin'
                ? 'Super Admin'
                : currentUserRole?.role === 'project-admin'
                  ? 'Project Admin'
                  : isDataOwner
                    ? 'Data Owner'
                    : 'Admin'
            }
            color="primary"
            size="small"
            sx={{ ml: 2 }}
          />
          <IconButton onClick={fetchData} sx={{ ml: 'auto' }}>
            <Refresh />
          </IconButton>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Pending Requests" />
            <Tab label="Access History" />
            {currentUserRole?.role === 'super-admin' && <Tab label="Admin Roles" />}
          </Tabs>
        </Box>

        {/* Tab 0: Pending Requests */}
        <TabPanel value={tabValue} index={0}>
          {/* Filters */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="AWAITING">Awaiting Action</MenuItem>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="PARTIALLY_APPROVED">Partially Approved</MenuItem>
                <MenuItem value="APPROVED">Approved</MenuItem>
                <MenuItem value="REJECTED">Rejected</MenuItem>
              </Select>
            </FormControl>

            {selectedRequests.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
                <Button variant="contained" color="success" startIcon={<CheckCircle />} onClick={handleBulkApprove}>
                  Approve ({selectedRequests.length})
                </Button>
                <Button variant="contained" color="error" startIcon={<Cancel />} onClick={() => setRejectDialogOpen(true)}>
                  Reject ({selectedRequests.length})
                </Button>
              </Box>
            )}
          </Box>

          {/* Filter Logic */}

          <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #DADCE0' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#F8FAFD' }}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedRequests.length === filteredRequests.filter((r) => r.status === 'PENDING').length && selectedRequests.length > 0}
                      indeterminate={selectedRequests.length > 0 && selectedRequests.length < filteredRequests.filter((r) => r.status === 'PENDING').length}
                      onChange={(e) => handleSelectAllRequests(e.target.checked)}
                    />
                  </TableCell>
                  <TableCell><strong>Asset</strong></TableCell>
                  <TableCell><strong>Asset Type</strong></TableCell>
                  <TableCell><strong>Requester</strong></TableCell>
                  <TableCell><strong>Project</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Submitted</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">No access requests found</TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request) => (
                    <TableRow key={request.id} hover>
                      <TableCell padding="checkbox">
                        {request.status === 'PENDING' && (
                          <Checkbox
                            checked={selectedRequests.includes(request.id)}
                            onChange={(e) => handleSelectRequest(request.id, e.target.checked)}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Tooltip title={request.assetName}>
                          <Typography sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {request.assetName?.split('/').pop() || request.assetName}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        {request.assetType ? (
                          <Chip label={request.assetType} size="small" variant="outlined" />
                        ) : (
                          <Typography variant="caption" color="text.secondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell>{request.requesterEmail}</TableCell>
                      <TableCell>{request.projectId || request.gcpProjectId}</TableCell>
                      <TableCell>{getStatusChip(request.status)}</TableCell>
                      <TableCell>{formatDate(request.submittedAt)}</TableCell>
                      <TableCell>
                        {request.status === 'PENDING' ? (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton size="small" sx={{ backgroundColor: '#E6F4EA', color: '#137333' }} onClick={() => handleApprove(request.id)}>
                              <CheckCircle fontSize="small" />
                            </IconButton>
                            <IconButton size="small" sx={{ backgroundColor: '#FCE8E6', color: '#C5221F' }} onClick={() => { setSingleRejectRequestId(request.id); setSingleRejectReason(''); setSingleRejectDialogOpen(true); }}>
                              <Cancel fontSize="small" />
                            </IconButton>
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            {request.status === 'APPROVED' ? 'Granted' : 'Rejected'}
                            {request.reviewedBy && ` by ${request.reviewedBy}`}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Tab 1: Access History (Active + Revoked) */}
        <TabPanel value={tabValue} index={1}>
          {/* Status Filter */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select value={accessStatusFilter} label="Status" onChange={(e) => setAccessStatusFilter(e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="REJECTED">Rejected</MenuItem>
                <MenuItem value="REVOKED">Revoked</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #DADCE0' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#F8FAFD' }}>
                  <TableCell><strong>User</strong></TableCell>
                  <TableCell><strong>Asset</strong></TableCell>
                  <TableCell><strong>Asset Type</strong></TableCell>
                  <TableCell><strong>Project</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Date</strong></TableCell>
                  <TableCell><strong>Reviewed By</strong></TableCell>
                  <TableCell><strong>Revoked</strong></TableCell>
                  <TableCell><strong>Revoked By</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAccesses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center">No accesses found</TableCell>
                  </TableRow>
                ) : (
                  filteredAccesses.map((access) => (
                    <TableRow key={access.id} hover sx={access.status !== 'ACTIVE' ? { opacity: 0.7 } : {}}>
                      <TableCell>{access.userEmail}</TableCell>
                      <TableCell>
                        <Tooltip title={access.assetName}>
                          <Typography sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {access.assetName?.split('/').pop() || access.assetName}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        {access.assetType ? (
                          <Chip label={access.assetType} size="small" variant="outlined" />
                        ) : (
                          <Typography variant="caption" color="text.secondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell>{access.gcpProjectId}</TableCell>
                      <TableCell>{getStatusChip(access.status)}</TableCell>
                      <TableCell>{formatDate(access.status === 'REJECTED' ? (access as any).submittedAt : access.grantedAt)}</TableCell>
                      <TableCell>{access.status === 'REJECTED' ? ((access as any).reviewedBy || '-') : (access.grantedBy || '-')}</TableCell>
                      <TableCell>{access.revokedAt ? formatDate(access.revokedAt) : '-'}</TableCell>
                      <TableCell>{access.revokedBy || '-'}</TableCell>
                      <TableCell>
                        {access.status === 'ACTIVE' && (
                          <IconButton
                            size="small"
                            sx={{ backgroundColor: '#FCE8E6', color: '#C5221F' }}
                            onClick={() => {
                              setRevokeTarget(access);
                              setRevokeDialogOpen(true);
                            }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Tab 2: Admin Roles (Super-admin only) */}
        {currentUserRole?.role === 'super-admin' && (
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button variant="contained" startIcon={<PersonAdd />} onClick={() => setAdminDialogOpen(true)}>
                Add Admin
              </Button>
            </Box>

            <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #DADCE0' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#F8FAFD' }}>
                    <TableCell><strong>Email</strong></TableCell>
                    <TableCell><strong>Role</strong></TableCell>
                    <TableCell><strong>Assigned Projects</strong></TableCell>
                    <TableCell><strong>Created By</strong></TableCell>
                    <TableCell><strong>Created At</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allAdmins.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">No admins configured</TableCell>
                    </TableRow>
                  ) : (
                    allAdmins.map((admin) => (
                      <TableRow key={admin.email} hover>
                        <TableCell>{admin.email}</TableCell>
                        <TableCell>
                          <Chip
                            label={admin.role}
                            color={admin.role === 'super-admin' ? 'primary' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {admin.assignedProjects?.length > 0
                            ? admin.assignedProjects.join(', ')
                            : admin.role === 'super-admin'
                              ? 'All Projects'
                              : '-'}
                        </TableCell>
                        <TableCell>{admin.createdBy}</TableCell>
                        <TableCell>{formatDate(admin.createdAt)}</TableCell>
                        <TableCell>
                          {admin.email !== email && (
                            <IconButton
                              size="small"
                              sx={{ backgroundColor: '#FCE8E6', color: '#C5221F' }}
                              onClick={() => handleRemoveAdmin(admin.email)}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        )}
      </Box>

      {/* Revoke Confirmation Dialog */}
      <Dialog open={revokeDialogOpen} onClose={() => setRevokeDialogOpen(false)}>
        <DialogTitle>Confirm Revoke Access</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to revoke access for <strong>{revokeTarget?.userEmail}</strong> to{' '}
            <strong>{revokeTarget?.assetName?.split('/').pop()}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This will remove the IAM role from GCP and notify the user.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevokeDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRevokeAccess} color="error" variant="contained">
            Revoke
          </Button>
        </DialogActions>
      </Dialog>

      {/* Single Reject Dialog */}
      <Dialog open={singleRejectDialogOpen} onClose={() => setSingleRejectDialogOpen(false)}>
        <DialogTitle>Reject Access Request</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Optionally provide a reason for rejecting this request:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason (optional)"
            value={singleRejectReason}
            onChange={(e) => setSingleRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSingleRejectDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => { if (singleRejectRequestId) { handleReject(singleRejectRequestId, singleRejectReason); setSingleRejectDialogOpen(false); } }}
            color="error"
            variant="contained"
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
        <DialogTitle>Reject Access Requests</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            You are about to reject {selectedRequests.length} request(s). You can optionally provide a reason:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason (optional)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleBulkReject} color="error" variant="contained">
            Reject All
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Admin Dialog */}
      <Dialog open={adminDialogOpen} onClose={() => setAdminDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Admin Role</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Email"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              placeholder="user@example.com"
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select value={newAdminRole} label="Role" onChange={(e) => setNewAdminRole(e.target.value as 'super-admin' | 'project-admin')}>
                <MenuItem value="project-admin">Project Admin</MenuItem>
                <MenuItem value="super-admin">Super Admin</MenuItem>
              </Select>
            </FormControl>
            {newAdminRole === 'project-admin' && (
              <TextField
                fullWidth
                label="Assigned Projects"
                value={newAdminProjects}
                onChange={(e) => setNewAdminProjects(e.target.value)}
                placeholder="project-id-1, project-id-2"
                helperText="Comma-separated list of GCP project IDs"
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdminDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddAdmin} variant="contained" disabled={!newAdminEmail}>
            Add Admin
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminAccessManagement;
