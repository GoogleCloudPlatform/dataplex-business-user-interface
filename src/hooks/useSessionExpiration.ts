import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../auth/AuthProvider';

interface SessionExpirationConfig {
  checkInterval?: number; // milliseconds
  onSessionExpired?: () => void;
  onTokenExpired?: () => void;
}

/**
 * Synchronously checks if the stored token is expired.
 * Used for initial state to prevent flash of content on new tab load.
 */
function getInitialExpirationState(): { isExpired: boolean; reason: 'session_expired' | 'token_expired' | 'unauthorized' } {
  try {
    const storedData = JSON.parse(localStorage.getItem('sessionUserData') || 'null');
    if (storedData?.tokenExpiry) {
      const now = Date.now() / 1000;
      if (storedData.tokenExpiry < now) {
        return { isExpired: true, reason: 'token_expired' };
      }
    }
    return { isExpired: false, reason: 'session_expired' };
  } catch {
    return { isExpired: false, reason: 'session_expired' };
  }
}

export const useSessionExpiration = (config: SessionExpirationConfig = {}) => {
  const { user } = useAuth();
  const [isExpired, setIsExpired] = useState(() => getInitialExpirationState().isExpired);
  const [expirationReason, setExpirationReason] = useState<'session_expired' | 'token_expired' | 'unauthorized'>(
    () => getInitialExpirationState().reason
  );
  
  const {
    checkInterval = 30000, // Check every 30 seconds by default
    onSessionExpired,
    onTokenExpired
  } = config;

  const checkTokenValidity = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      // Check if user object has token expiration info
      const now = Date.now() / 1000; // Current time in seconds
      
      // Since the User type doesn't have tokenExpiry, we'll check the stored session data
      const storedData = JSON.parse(localStorage.getItem('sessionUserData') || 'null');
      if (storedData?.tokenExpiry && storedData.tokenExpiry < now) {
        setExpirationReason('token_expired');
        setIsExpired(true);
        onTokenExpired?.();
        return;
      }

      // You can add additional checks here, such as:
      // - Making a lightweight API call to validate the token
      // - Checking localStorage for session data
      // - Validating JWT token if you're using JWT

      // Example: Check if there's a stored token and validate it
      const storedToken = localStorage.getItem('sessionUserData');
      if (!storedToken) {
        setExpirationReason('session_expired');
        setIsExpired(true);
        onSessionExpired?.();
        return;
      }

      // Optional: Make a lightweight API call to validate the token
      // This can be uncommented and modified as needed for additional token validation

    } catch (error) {
      console.error('Error checking session validity:', error);
    }
  }, [user, onSessionExpired, onTokenExpired]);

  // Set up interval to check token validity
  useEffect(() => {
    if (!user) {
      return;
    }

    const interval = setInterval(checkTokenValidity, checkInterval);
    
    // Check immediately
    checkTokenValidity();

    return () => clearInterval(interval);
  }, [checkTokenValidity, checkInterval, user]);

  // Reset expiration state only when user actually changes (e.g., fresh login),
  // not on initial mount where the expired token user is loaded from storage
  const prevUserRef = useRef(user);
  useEffect(() => {
    if (user && user !== prevUserRef.current) {
      setIsExpired(false);
    }
    prevUserRef.current = user;
  }, [user]);

  const resetExpiration = useCallback(() => {
    setIsExpired(false);
  }, []);

  const triggerExpiration = useCallback((reason: 'session_expired' | 'token_expired' | 'unauthorized' = 'session_expired') => {
    setExpirationReason(reason);
    setIsExpired(true);
  }, []);

  return {
    isExpired,
    expirationReason,
    resetExpiration,
    triggerExpiration,
    checkTokenValidity
  };
};
