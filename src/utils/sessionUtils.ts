// import { useSessionExpiration } from '../hooks/useSessionExpiration'; // Unused in this file

/**
 * Utility function to handle API responses that might indicate session/token expiration
 */
export const handleApiResponse = (response: Response, triggerExpiration: (reason: 'session_expired' | 'token_expired' | 'unauthorized') => void) => {
  if (response.status === 401) {
    // Unauthorized - token expired or invalid
    triggerExpiration('token_expired');
    return true; // Indicates session was expired
  } else if (response.status === 403) {
    // Forbidden - insufficient permissions
    triggerExpiration('unauthorized');
    return true; // Indicates access was denied
  }
  return false; // No session issues
};

/**
 * Axios interceptor helper for handling token expiration
 */
export const createAxiosInterceptor = (triggerExpiration: (reason: 'session_expired' | 'token_expired' | 'unauthorized') => void) => {
  return {
    response: {
      onFulfilled: (response: any) => response,
      onRejected: (error: any) => {
        if (error.response) {
          const { status } = error.response;
          if (status === 401) {
            triggerExpiration('token_expired');
          } else if (status === 403) {
            triggerExpiration('unauthorized');
          }
        }
        return Promise.reject(error);
      }
    }
  };
};

/**
 * Check if a token is expired based on its expiration time
 */
export const isTokenExpired = (tokenExpiry?: number): boolean => {
  if (!tokenExpiry) return false;
  const now = Date.now() / 1000; // Current time in seconds
  return tokenExpiry < now;
};

/**
 * Get time until token expires (in seconds)
 */
export const getTimeUntilExpiry = (tokenExpiry?: number): number => {
  if (!tokenExpiry) return Infinity;
  const now = Date.now() / 1000;
  return Math.max(0, tokenExpiry - now);
};

/**
 * Format time until expiry for display
 */
export const formatTimeUntilExpiry = (tokenExpiry?: number): string => {
  const seconds = getTimeUntilExpiry(tokenExpiry);
  if (seconds === Infinity) return 'Never';
  if (seconds < 60) return `${Math.floor(seconds)} seconds`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
  return `${Math.floor(seconds / 3600)} hours`;
};
