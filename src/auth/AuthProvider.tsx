import { createContext, useContext, useState, useMemo, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { type CredentialResponse, GoogleOAuthProvider } from '@react-oauth/google';
import type { User } from '../types/User';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../features/user/userSlice';
import { clearPersistedState } from '../utils/persistence';
import { useNotification } from '../contexts/NotificationContext';
import { setGlobalAuthFunctions, setAuthNotificationShown } from '../services/authErrorService';
import { performSilentAuth } from '../services/silentAuthService';
import { AUTH_CONFIG } from '../constants/auth';
import { setIsLoaded } from '../features/projects/projectsSlice';


type AuthContextType = {
  user: User | null;
  login: (credentialResponse: CredentialResponse) => void;
  logout: () => void;
  updateUser: (token: string|undefined, userData: User) => void;
  silentLogin: () => Promise<boolean>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = ():AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const dispatch = useDispatch();
  const { showSuccess, showError, showInfo } = useNotification();

  // Load stored data and ensure token timestamps exist
  const storedData = JSON.parse(localStorage.getItem('sessionUserData') || 'null');

  // If stored data exists but doesn't have token timestamps, add them
  // (This handles migration from old sessions without timestamps)
  if (storedData && storedData.token && (!storedData.tokenExpiry || !storedData.tokenIssuedAt)) {
    const now = Math.floor(Date.now() / 1000);
    // If we don't know when the token was issued, assume it was issued now
    // This is conservative - treats existing tokens as fresh
    storedData.tokenIssuedAt = now;
    storedData.tokenExpiry = now + AUTH_CONFIG.TOKEN_LIFETIME_SECONDS;
    localStorage.setItem('sessionUserData', JSON.stringify(storedData));
    console.log('[AuthProvider] Migrated legacy session data with token timestamps');
  }

  const [user, setUser] = useState<User | null>(storedData ?? null);
  const isLoggedOut = useRef(false);

  // Sync stored session data to Redux on mount only
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('sessionUserData') || 'null');
    if (stored) {
      dispatch(setCredentials({ token: stored.token, user: stored }));
    }
  }, [dispatch]);

  const login = useCallback(async (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      isLoggedOut.current = false;
      try {
        const token = credentialResponse.credential;
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Fetch user profile from Google OAuth2 userinfo
        const profileRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profile = profileRes.data;

        // Calculate token timestamps
        const tokenIssuedAt = Math.floor(Date.now() / 1000);
        const tokenExpiry = tokenIssuedAt + AUTH_CONFIG.TOKEN_LIFETIME_SECONDS;

        const userData: User = {
          name: profile.name,
          email: profile.email,
          picture: profile.picture,
          token,
          tokenIssuedAt,
          tokenExpiry,
          hasRole: true,
          roles: ['roles/viewer'],
          permissions: ['read'],
          iamDisplayRole: 'Viewer',
          appConfig: {}
        };
        setUser(userData);
        localStorage.setItem('sessionUserData', JSON.stringify(userData));

        dispatch(
          setCredentials({token, user: userData})
        );

        // Reset the auth notification flag on successful login
        setAuthNotificationShown(false);

        showSuccess('Successfully signed in!', 3000);

      } catch (err) {
        console.error('Failed to fetch user info:', err);
        showError('Failed to sign in. Please try again.', 5000);
      }
    }
  }, [dispatch, showSuccess, showError]);

  const logout = useCallback(() => {
    isLoggedOut.current = true;
    dispatch(setCredentials({token: null, user: null}));
    dispatch(setIsLoaded({ isloaded: false }));
    localStorage.removeItem('sessionUserData');
    setUser(null);
    clearPersistedState(); // Clear persisted Redux state
    showInfo('You have been signed out.', 3000);
  }, [dispatch, showInfo]);

  // Set up global authentication functions
  useEffect(() => {
    setGlobalAuthFunctions(showError, logout);
  }, [showError, logout]);

  const updateUser = useCallback((token:string|undefined, userData:User) => {
    if (isLoggedOut.current) return;
    dispatch(setCredentials({token: token, user: userData}));
    localStorage.setItem('sessionUserData', JSON.stringify(userData));
    setUser(userData);
  }, [dispatch]);

  /**
   * Performs silent authentication to refresh the token
   * Returns true if successful, false otherwise
   */
  const silentLogin = useCallback(async (): Promise<boolean> => {
    if (!user?.email || isLoggedOut.current) {
      console.warn('[Silent Auth] Cannot perform silent login - no user email or logged out');
      return false;
    }

    try {
      console.log('[Silent Auth] Attempting silent authentication for', user.email);
      const newToken = await performSilentAuth(
        user.email,
        import.meta.env.VITE_GOOGLE_CLIENT_ID
      );

      // Update token and expiry
      const tokenIssuedAt = Math.floor(Date.now() / 1000);
      const tokenExpiry = tokenIssuedAt + AUTH_CONFIG.TOKEN_LIFETIME_SECONDS;

      const updatedUser = {
        ...user,
        token: newToken,
        tokenIssuedAt,
        tokenExpiry
      };

      // Update axios headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      updateUser(newToken, updatedUser);
      console.log('[Silent Auth] Successfully refreshed token');
      return true;
    } catch (error) {
      console.error('[Silent Auth] Failed:', error);
      return false;
    }
  }, [user, updateUser]);

  const contextValue = useMemo(() => ({
    user,
    login,
    logout,
    updateUser,
    silentLogin
  }), [user, login, logout, updateUser, silentLogin]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const AuthWithProvider = ({ children }: { children: ReactNode }) => (
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <AuthProvider>{children}</AuthProvider>
  </GoogleOAuthProvider>
);
