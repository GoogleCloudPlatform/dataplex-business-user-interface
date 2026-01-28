import { createContext, useContext, useState, useMemo, useEffect, useCallback, type ReactNode } from 'react';
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

  if(storedData){
    dispatch(
      setCredentials({token: storedData.token, user: storedData})
    );
  }

  const login = useCallback(async (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${credentialResponse.credential}`;
        
        // Optional: fetch user info from Google API
        const res = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo');
        const decoded: { name: string; email: string; picture: string } = res.data;
        // Check IAM role and fetch app configurations in parallel
        // These can be uncommented when needed for role checking


        // Calculate token timestamps
        const tokenIssuedAt = Math.floor(Date.now() / 1000);
        const tokenExpiry = tokenIssuedAt + AUTH_CONFIG.TOKEN_LIFETIME_SECONDS;

        const userData = {
          name: decoded.name,
          email: decoded.email,
          picture: decoded.picture,
          token: credentialResponse.credential,
          tokenIssuedAt,
          tokenExpiry,
          hasRole: true,
          roles: [],
          permissions: [],
          appConfig: {}
        };
        setUser(userData);
        localStorage.setItem('sessionUserData', JSON.stringify(userData));

        dispatch(
          setCredentials({token: credentialResponse.credential, user: userData})
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
    dispatch(setCredentials({token: token, user: userData}));
    localStorage.setItem('sessionUserData', JSON.stringify(userData));
    setUser(userData);
  }, [dispatch]);

  /**
   * Performs silent authentication to refresh the token
   * Returns true if successful, false otherwise
   */
  const silentLogin = useCallback(async (): Promise<boolean> => {
    if (!user?.email) {
      console.warn('[Silent Auth] Cannot perform silent login - no user email');
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
