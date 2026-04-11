import React, { useState, useEffect } from 'react';
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
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Button,
  TextField,
  InputAdornment,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { ArrowBack, CheckCircle, Cancel, Refresh, Person, Assignment, AdminPanelSettings, Search } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import axios from 'axios';
import { URLS } from '../../constants/urls';

interface AccessRequest {
  id: string;
  assetName: string;
  assetType?: string;
  message: string;
  requesterEmail: string;
  projectId: string;
  projectAdmin: string[];
  status: 'pending' | 'partially_approved' | 'approved' | 'rejected' | 'revoked';
  submittedAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  autoApproved: boolean;
  requestedRole?: string;
  approvals?: string[]; // Emails of stewards who already approved
  serviceNowTicket?: string;
  serviceNowSysId?: string;
  serviceNowState?: string;
  serviceNowLink?: string;
}

const AccessRequestsDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('awaiting');
  const [projectFilter, setProjectFilter] = useState<string>('');
  const [tabValue, setTabValue] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Determine user role (admin, manager, or user)
  const userRole = user?.isAdmin || user?.role === 'admin' || user?.role === 'manager' ? 'admin' : 'user';

  useEffect(() => {
    fetchAccessRequests();
  }, [user?.email, userRole, statusFilter, projectFilter]);

  // Statuses that represent "awaiting action" (needs approval or rejection)
  const AWAITING_STATUSES = ['PENDING', 'PARTIALLY_APPROVED'];

  const fetchAccessRequests = async () => {
    setLoading(true);
    setError(null);

    try {
      const params: any = {
        userEmail: user?.email,
        userRole: userRole
      };

      // Only send specific status to backend; 'all' and 'awaiting' are handled client-side
      if (statusFilter !== 'all' && statusFilter !== 'awaiting') {
        params.status = statusFilter;
      }

      if (projectFilter) {
        params.projectId = projectFilter;
      }

      const response = await axios.get(`${URLS.API_URL}${URLS.GET_ACCESS_REQUESTS}`, {
        params,
        headers: {
          Authorization: `Bearer ${user?.token}`,
          'x-user-email': user?.email,
          'x-user-role': userRole
        }
      });

      if (response.data.success) {
        setRequests(response.data.data || []);
      } else {
        setError(response.data.error || 'Failed to fetch access requests');
      }
    } catch (err: any) {
      console.error('Error fetching access requests:', err);
      setError(err.response?.data?.error || 'Failed to fetch access requests');
    } finally {
      setLoading(false);
    }
  };

  // Reject dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectRequestId, setRejectRequestId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleUpdateStatus = async (requestId: string, newStatus: 'approved' | 'rejected' | 'revoked', reason?: string) => {
    try {
      const response = await axios.post(`${URLS.API_URL}${URLS.UPDATE_ACCESS_REQUEST}`, {
        requestId,
        status: newStatus.toUpperCase(),
        reviewerEmail: user?.email,
        ...(reason ? { adminNote: reason } : {})
      }, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
          'x-user-email': user?.email
        }
      });

      if (response.data.success) {
        // Refresh the list
        fetchAccessRequests();
      } else {
        setError(response.data.error || 'Failed to update request');
      }
    } catch (err: any) {
      console.error('Error updating request:', err);
      setError(err.response?.data?.error || 'Failed to update request');
    }
  };

  const getStatusColor = (status: string) => {
    const s = status?.toUpperCase();
    switch (s) {
      case 'APPROVED':
        return 'success';
      case 'PARTIALLY_APPROVED':
        return 'info';
      case 'REJECTED':
        return 'error';
      case 'PENDING':
        return 'warning';
      case 'REVOKED':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (request: AccessRequest) => {
    const s = request.status?.toUpperCase();
    if (s === 'PARTIALLY_APPROVED') {
      const count = request.approvals?.length || 0;
      const threshold = Math.max(1, Math.min(request.projectAdmin?.length || 2, 2));
      return `CONSENSUS (${count}/${threshold})`;
    }
    return s || '';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  };

  // Get unique projects for filter
  const uniqueProjects = Array.from(new Set(requests.map((r: AccessRequest) => r.projectId)));

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const filteredRequests = requests.filter((req: AccessRequest) => {
    const isAdmin = userRole === 'admin';
    let passesTab = true;

    if (isAdmin) {
      // If admin, they have two tabs: 0 = Management, 1 = My Requests
      if (tabValue === 1) {
        passesTab = req.requesterEmail === user?.email;
      }
    } else {
      // If not admin, they only have one tab: 0 = My Requests
      passesTab = req.requesterEmail === user?.email;
    }

    if (!passesTab) return false;

    // Apply status filter (client-side for 'awaiting' virtual filter)
    if (statusFilter === 'awaiting') {
      if (!AWAITING_STATUSES.includes(req.status?.toUpperCase())) return false;
    } else if (statusFilter !== 'all') {
      if (req.status?.toUpperCase() !== statusFilter.toUpperCase()) return false;
    }

    // Apply text search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        req.assetName.toLowerCase().includes(search) ||
        req.requesterEmail.toLowerCase().includes(search) ||
        req.projectId.toLowerCase().includes(search) ||
        (req.assetType && req.assetType.toLowerCase().includes(search))
      );
    }

    return true;
  });

  return (
    <Box sx={{
      backgroundColor: '#F8FAFD',
      minHeight: '100vh',
      padding: { xs: '0px 0.5rem', sm: '0px 1rem' }
    }}>
      <Box sx={{
        backgroundColor: '#FFFFFF',
        borderRadius: { xs: '16px', sm: '20px' },
        width: '100%',
        minHeight: '95vh',
        padding: { xs: '16px', sm: '24px' },
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '24px'
        }}>
          <IconButton
            onClick={() => navigate('/home')}
            sx={{ color: '#1F1F1F' }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h5" sx={{ fontWeight: 500, color: '#1F1F1F' }}>
            Access Requests
          </Typography>
          {user?.isAdmin && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate('/admin-access')}
              sx={{ ml: 2, borderRadius: '20px', textTransform: 'none' }}
              startIcon={<AdminPanelSettings />}
            >
              Admin Management
            </Button>
          )}
          <IconButton onClick={fetchAccessRequests} sx={{ marginLeft: 'auto' }}>
            <Refresh />
          </IconButton>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="access request tabs">
            {userRole === 'admin' && (
              <Tab label="Access Management" icon={<Assignment />} iconPosition="start" />
            )}
            <Tab label="My Requests" icon={<Person />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Filters */}
        <Box sx={{
          display: 'flex',
          gap: 2,
          marginBottom: 3,
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <Box sx={{ flexGrow: 1, minWidth: 250 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by email, asset or project..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '20px',
                  backgroundColor: '#F1F3F4',
                  '& fieldset': { border: 'none' }
                }
              }}
            />
          </Box>
          <FormControl sx={{ minWidth: 150 }} size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="awaiting">Awaiting Action</MenuItem>
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="partially_approved">Partially Approved</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
              <MenuItem value="revoked">Revoked</MenuItem>
            </Select>
          </FormControl>

          {userRole === 'admin' && (
            <FormControl sx={{ minWidth: 200 }} size="small">
              <InputLabel>Project</InputLabel>
              <Select
                value={projectFilter}
                label="Project"
                onChange={(e) => setProjectFilter(e.target.value)}
              >
                <MenuItem value="">All Projects</MenuItem>
                {uniqueProjects.map(project => (
                  <MenuItem key={project} value={project}>{project}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Table */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', padding: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredRequests.length === 0 ? (
          <Box sx={{ textAlign: 'center', padding: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No access requests found
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #DADCE0', borderRadius: '12px', overflow: 'hidden' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#F8FAFD' }}>
                  <TableCell><strong>Asset Name</strong></TableCell>
                  <TableCell><strong>Asset Type</strong></TableCell>
                  <TableCell><strong>Requester</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Submitted</strong></TableCell>
                  <TableCell><strong>Message</strong></TableCell>
                  {userRole === 'admin' && (
                    <TableCell align="right"><strong>Actions</strong></TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRequests.map((request: AccessRequest) => (
                  <TableRow key={request.id} hover>
                    <TableCell>
                      <div style={{ fontWeight: 500, color: '#1F1F1F' }}>{request.assetName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#5F6368' }}>{request.projectId}</div>
                    </TableCell>
                    <TableCell>
                      {request.assetType ? (
                        <Chip label={request.assetType} size="small" variant="outlined" sx={{ fontSize: '11px', height: '22px' }} />
                      ) : (
                        <Typography variant="caption" sx={{ color: '#9AA0A6' }}>—</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#1F1F1F' }}>{request.requesterEmail}</Typography>
                      {request.serviceNowTicket && (
                        request.serviceNowTicket === 'ERROR-CREATING-SN' ? (
                          <Tooltip title="Failed to create ServiceNow ticket. Check ServiceNow configuration.">
                            <Chip
                              label="SN: Error"
                              size="small"
                              variant="outlined"
                              sx={{
                                fontSize: '10px', height: '20px', mt: 0.5,
                                borderColor: '#EA4335', color: '#EA4335',
                                cursor: 'default'
                              }}
                            />
                          </Tooltip>
                        ) : request.serviceNowTicket.startsWith('MOCK-SN-') ? (
                          <Tooltip title="ServiceNow integration is not configured. Contact your administrator to enable it.">
                            <Chip
                              label="SN: Not configured"
                              size="small"
                              variant="outlined"
                              sx={{
                                fontSize: '10px', height: '20px', mt: 0.5,
                                borderColor: '#9AA0A6', color: '#9AA0A6',
                                cursor: 'default'
                              }}
                            />
                          </Tooltip>
                        ) : (
                          <Tooltip title={`ServiceNow: ${request.serviceNowState || 'Click to view'}`}>
                            <Chip
                              label={`SN: ${request.serviceNowTicket}${request.serviceNowState ? ' - ' + request.serviceNowState : ''}`}
                              size="small"
                              variant="outlined"
                              clickable={!!request.serviceNowLink}
                              onClick={() => request.serviceNowLink && window.open(request.serviceNowLink, '_blank')}
                              sx={{
                                fontSize: '10px', height: '20px', mt: 0.5,
                                borderColor: request.serviceNowState === 'Approved' ? '#34A853' :
                                  request.serviceNowState === 'Rejected' ? '#EA4335' : '#1A73E8',
                                color: request.serviceNowState === 'Approved' ? '#34A853' :
                                  request.serviceNowState === 'Rejected' ? '#EA4335' : '#1A73E8',
                                cursor: request.serviceNowLink ? 'pointer' : 'default'
                              }}
                            />
                          </Tooltip>
                        )
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(request)}
                        color={getStatusColor(request.status) as any}
                        size="small"
                        sx={{ fontWeight: 500, fontSize: '0.7rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(request.submittedAt)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <Typography variant="body2" color="text.secondary">
                        {request.message || '-'}
                      </Typography>
                    </TableCell>
                    {(userRole === 'admin') && (
                      <TableCell align="right">
                        {(request.status?.toLowerCase() === 'pending' || request.status?.toLowerCase() === 'partially_approved') ? (
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              disabled={request.approvals?.includes(user?.email || '')}
                              startIcon={<CheckCircle sx={{ fontSize: '16px !important' }} />}
                              onClick={() => handleUpdateStatus(request.id, 'approved')}
                              sx={{ textTransform: 'none', borderRadius: '16px', py: 0 }}
                            >
                              {request.status?.toLowerCase() === 'partially_approved'
                                ? `Confirm (${(request.approvals?.length || 0) + 1}/${Math.max(1, Math.min(request.projectAdmin?.length || 2, 2))})`
                                : 'Approve'}
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              startIcon={<Cancel sx={{ fontSize: '16px !important' }} />}
                              onClick={() => { setRejectRequestId(request.id); setRejectReason(''); setRejectDialogOpen(true); }}
                              sx={{ textTransform: 'none', borderRadius: '16px', py: 0 }}
                            >
                              Reject
                            </Button>
                          </Box>
                        ) : request.status?.toLowerCase() === 'approved' ? (
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ color: '#5F6368', mr: 1 }}>
                              Granted {request.reviewedBy ? `by ${request.reviewedBy.split('@')[0]}` : ''}
                            </Typography>
                            <Button
                              size="small"
                              variant="outlined"
                              color="warning"
                              onClick={() => handleUpdateStatus(request.id, 'revoked')}
                              sx={{ textTransform: 'none', borderRadius: '16px', py: 0 }}
                            >
                              Revoke
                            </Button>
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            {request.status?.toLowerCase() === 'revoked' ? 'Access Revoked' : 'Rejected'}
                          </Typography>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Reject Confirmation Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
        <DialogTitle>Reject Access Request</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>Are you sure you want to reject this access request?</Typography>
          <TextField
            label="Reason (optional)"
            fullWidth
            multiline
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Provide a reason for rejection..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => { if (rejectRequestId) { handleUpdateStatus(rejectRequestId, 'rejected', rejectReason); setRejectDialogOpen(false); } }}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AccessRequestsDashboard;

