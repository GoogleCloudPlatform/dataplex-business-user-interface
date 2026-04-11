import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { URLS } from '../../constants/urls';
import axios, { AxiosError } from 'axios';

// Types
export interface AdminRole {
  id: string;
  email: string;
  role: 'super-admin' | 'project-admin';
  assignedProjects: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isActive: boolean;
}

export interface GrantedAccess {
  id: string;
  userEmail: string;
  assetName: string;
  assetType?: string;
  gcpProjectId: string;
  role: string;
  grantedAt: string;
  grantedBy: string;
  originalRequestId: string | null;
  status: 'ACTIVE' | 'REVOKED';
  revokedAt: string | null;
  revokedBy: string | null;
}

export interface AccessRequest {
  id: string;
  assetName: string;
  assetType?: string;
  message: string;
  requesterEmail: string;
  projectId: string;
  gcpProjectId: string;
  projectAdmin: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  requestedRole?: string;
}

export interface PersistentNotification {
  id: string;
  recipientEmail: string;
  type: 'ACCESS_APPROVED' | 'ACCESS_REJECTED' | 'ACCESS_REVOKED' | 'NEW_REQUEST' | 'BULK_ACTION';
  title: string;
  message: string;
  metadata: Record<string, string>;
  read: boolean;
  createdAt: string;
}

interface AdminState {
  currentUserRole: AdminRole | null;
  isAdmin: boolean;
  isDataOwner: boolean;
  ownedDatasets: { projectId: string; datasetId: string }[];
  hasAdminCapabilities: boolean;
  allAdmins: AdminRole[];
  pendingRequests: AccessRequest[];
  grantedAccesses: GrantedAccess[];
  notifications: PersistentNotification[];
  unreadCount: number;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: AdminState = {
  currentUserRole: null,
  isAdmin: false,
  isDataOwner: false,
  ownedDatasets: [],
  hasAdminCapabilities: false,
  allAdmins: [],
  pendingRequests: [],
  grantedAccesses: [],
  notifications: [],
  unreadCount: 0,
  status: 'idle',
  error: null,
};

// Helper to get auth headers
const getAuthHeaders = (token?: string, email?: string) => ({
  Authorization: token ? `Bearer ${token}` : '',
  'x-user-email': email || '',
});

// Async Thunks

export const checkAdminStatus = createAsyncThunk(
  'admin/checkStatus',
  async (requestData: { token: string; email: string }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${URLS.API_URL}${URLS.ADMIN_CHECK}`, {
        params: { email: requestData.email },
        headers: getAuthHeaders(requestData.token, requestData.email),
      });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(error.response?.data || error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

export const fetchAllAdmins = createAsyncThunk(
  'admin/fetchAllAdmins',
  async (requestData: { token: string; email: string }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${URLS.API_URL}${URLS.ADMIN_ROLES}`, {
        headers: getAuthHeaders(requestData.token, requestData.email),
      });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(error.response?.data || error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

export const setAdminRole = createAsyncThunk(
  'admin/setRole',
  async (
    requestData: {
      token: string;
      creatorEmail: string;
      email: string;
      role: 'super-admin' | 'project-admin';
      assignedProjects?: string[];
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post(
        `${URLS.API_URL}${URLS.ADMIN_ROLES}`,
        {
          email: requestData.email,
          role: requestData.role,
          assignedProjects: requestData.assignedProjects || [],
        },
        {
          headers: getAuthHeaders(requestData.token, requestData.creatorEmail),
        }
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(error.response?.data || error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

export const removeAdminRole = createAsyncThunk(
  'admin/removeRole',
  async (
    requestData: { token: string; requesterEmail: string; targetEmail: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.delete(
        `${URLS.API_URL}${URLS.ADMIN_ROLES}/${encodeURIComponent(requestData.targetEmail)}`,
        {
          headers: getAuthHeaders(requestData.token, requestData.requesterEmail),
        }
      );
      return { ...response.data, email: requestData.targetEmail };
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(error.response?.data || error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

export const fetchGrantedAccesses = createAsyncThunk(
  'admin/fetchGrantedAccesses',
  async (
    requestData: { token: string; email: string; projectId?: string; status?: string },
    { rejectWithValue }
  ) => {
    try {
      const params: Record<string, string> = {};
      if (requestData.projectId) params.projectId = requestData.projectId;
      if (requestData.status) params.status = requestData.status;

      const response = await axios.get(`${URLS.API_URL}${URLS.GRANTED_ACCESSES}`, {
        params,
        headers: getAuthHeaders(requestData.token, requestData.email),
      });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(error.response?.data || error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

export const revokeAccess = createAsyncThunk(
  'admin/revokeAccess',
  async (
    requestData: { token: string; email: string; grantId: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post(
        `${URLS.API_URL}${URLS.REVOKE_ACCESS}`,
        { grantId: requestData.grantId },
        {
          headers: getAuthHeaders(requestData.token, requestData.email),
        }
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(error.response?.data || error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

export const bulkApproveRequests = createAsyncThunk(
  'admin/bulkApprove',
  async (
    requestData: { token: string; email: string; requestIds: string[] },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post(
        `${URLS.API_URL}${URLS.BULK_APPROVE}`,
        { requestIds: requestData.requestIds },
        {
          headers: getAuthHeaders(requestData.token, requestData.email),
        }
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(error.response?.data || error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

export const bulkRejectRequests = createAsyncThunk(
  'admin/bulkReject',
  async (
    requestData: { token: string; email: string; requestIds: string[]; reason?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post(
        `${URLS.API_URL}${URLS.BULK_REJECT}`,
        { requestIds: requestData.requestIds, reason: requestData.reason },
        {
          headers: getAuthHeaders(requestData.token, requestData.email),
        }
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(error.response?.data || error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

export const fetchNotifications = createAsyncThunk(
  'admin/fetchNotifications',
  async (requestData: { token: string; email: string; limit?: number }, { rejectWithValue }) => {
    try {
      const params: Record<string, string | number> = {};
      if (requestData.limit) params.limit = requestData.limit;

      const response = await axios.get(`${URLS.API_URL}${URLS.NOTIFICATIONS}`, {
        params,
        headers: getAuthHeaders(requestData.token, requestData.email),
      });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(error.response?.data || error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'admin/fetchUnreadCount',
  async (requestData: { token: string; email: string }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${URLS.API_URL}${URLS.NOTIFICATIONS_UNREAD_COUNT}`, {
        headers: getAuthHeaders(requestData.token, requestData.email),
      });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(error.response?.data || error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

export const markNotificationsRead = createAsyncThunk(
  'admin/markNotificationsRead',
  async (
    requestData: { token: string; email: string; notificationIds: string[] },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post(
        `${URLS.API_URL}${URLS.NOTIFICATIONS_MARK_READ}`,
        { notificationIds: requestData.notificationIds },
        {
          headers: getAuthHeaders(requestData.token, requestData.email),
        }
      );
      return { ...response.data, notificationIds: requestData.notificationIds };
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(error.response?.data || error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

export const markAllNotificationsRead = createAsyncThunk(
  'admin/markAllNotificationsRead',
  async (requestData: { token: string; email: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${URLS.API_URL}${URLS.NOTIFICATIONS_MARK_ALL_READ}`,
        {},
        {
          headers: getAuthHeaders(requestData.token, requestData.email),
        }
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(error.response?.data || error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

// Slice
export const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearAdminState: (state) => {
      state.currentUserRole = null;
      state.isAdmin = false;
      state.isDataOwner = false;
      state.ownedDatasets = [];
      state.hasAdminCapabilities = false;
      state.allAdmins = [];
      state.pendingRequests = [];
      state.grantedAccesses = [];
      state.notifications = [];
      state.unreadCount = 0;
      state.status = 'idle';
      state.error = null;
    },
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Check Admin Status
      .addCase(checkAdminStatus.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(checkAdminStatus.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.isAdmin = action.payload.isAdmin;
        state.isDataOwner = action.payload.isDataOwner || false;
        state.ownedDatasets = action.payload.ownedDatasets || [];
        state.hasAdminCapabilities = action.payload.hasAdminCapabilities || action.payload.isAdmin;
        state.currentUserRole = action.payload.role;
      })
      .addCase(checkAdminStatus.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      // Fetch All Admins
      .addCase(fetchAllAdmins.fulfilled, (state, action) => {
        state.allAdmins = action.payload.data || [];
      })
      // Set Admin Role
      .addCase(setAdminRole.fulfilled, (state, action) => {
        const newAdmin = action.payload.data;
        const existingIndex = state.allAdmins.findIndex((a) => a.email === newAdmin.email);
        if (existingIndex >= 0) {
          state.allAdmins[existingIndex] = newAdmin;
        } else {
          state.allAdmins.push(newAdmin);
        }
      })
      // Remove Admin Role
      .addCase(removeAdminRole.fulfilled, (state, action) => {
        state.allAdmins = state.allAdmins.filter((a) => a.email !== action.payload.email);
      })
      // Fetch Granted Accesses
      .addCase(fetchGrantedAccesses.fulfilled, (state, action) => {
        state.grantedAccesses = action.payload.data || [];
      })
      // Revoke Access
      .addCase(revokeAccess.fulfilled, (state, action) => {
        const revokedId = action.payload.data?.id;
        if (revokedId) {
          state.grantedAccesses = state.grantedAccesses.map((a) =>
            a.id === revokedId ? { ...a, status: 'REVOKED' as const } : a
          );
        }
      })
      // Fetch Notifications
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.notifications = action.payload.data || [];
      })
      // Fetch Unread Count
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload.count || 0;
      })
      // Mark Notifications Read
      .addCase(markNotificationsRead.fulfilled, (state, action) => {
        const readIds = action.payload.notificationIds || [];
        state.notifications = state.notifications.map((n) =>
          readIds.includes(n.id) ? { ...n, read: true } : n
        );
        state.unreadCount = Math.max(0, state.unreadCount - readIds.length);
      })
      // Mark All Read
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.notifications = state.notifications.map((n) => ({ ...n, read: true }));
        state.unreadCount = 0;
      });
  },
});

export const { clearAdminState, setUnreadCount } = adminSlice.actions;
export default adminSlice.reducer;
