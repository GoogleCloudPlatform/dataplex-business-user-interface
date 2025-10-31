import { createContext, useContext, useState, useMemo, useEffect, useCallback, type ReactNode } from 'react';
import { type CredentialResponse, GoogleOAuthProvider } from '@react-oauth/google';
import type { User } from '../types/User';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../features/user/userSlice';
import { clearPersistedState } from '../utils/persistence';
import { useNotification } from '../contexts/NotificationContext';
import { setGlobalAuthFunctions } from '../services/authErrorService';


type AuthContextType = {
  user: User | null;
  login: (credentialResponse: CredentialResponse) => void;
  logout: () => void;
  updateUser: (token: string|undefined, userData: User) => void;
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
  const storedData = JSON.parse(localStorage.getItem('sessionUserData') || 'null');
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


        const userData = {
          name: decoded.name,
          email: decoded.email,
          picture: decoded.picture,
          token: credentialResponse.credential,
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
        
        showSuccess('Successfully signed in!', 3000);

      } catch (err) {
        console.error('Failed to fetch user info:', err);
        showError('Failed to sign in. Please try again.', 5000);
      }
    }
  }, [dispatch, showSuccess, showError]);

  const logout = useCallback(() => {
    dispatch(setCredentials({token: null, user: null}));
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

  const contextValue = useMemo(() => ({
    user,
    login,
    logout,
    updateUser
  }), [user, login, logout, updateUser]);

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
