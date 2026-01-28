import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useNotification } from '../contexts/NotificationContext';
import { isAuthNotificationShown, setAuthNotificationShown } from '../services/authErrorService';

interface SessionExpirationConfig {
  checkInterval?: number; // milliseconds
  onSessionExpired?: () => void;
  onTokenExpired?: () => void;
}

export const useSessionExpiration = (config: SessionExpirationConfig = {}) => {
  const { user } = useAuth();
  const { showError, showWarning } = useNotification();
  const [isExpired, setIsExpired] = useState(false);
  const [expirationReason, setExpirationReason] = useState<'session_expired' | 'token_expired' | 'unauthorized'>('session_expired');
  
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
        if (!isAuthNotificationShown()) {
          setAuthNotificationShown(true);
          showError('Your access token has expired. You will be redirected to the login page.', 5000);
        }
        // Delay the expiration to allow user to see the notification
        setTimeout(() => {
          setIsExpired(true);
          onTokenExpired?.();
        }, 2000);
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
        if (!isAuthNotificationShown()) {
          setAuthNotificationShown(true);
          showWarning('Your session has expired. You will be redirected to the login page.', 5000);
        }
        // Delay the expiration to allow user to see the notification
        setTimeout(() => {
          setIsExpired(true);
          onSessionExpired?.();
        }, 2000);
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

  // Reset expiration state when user changes
  useEffect(() => {
    if (user) {
      setIsExpired(false);
    }
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
