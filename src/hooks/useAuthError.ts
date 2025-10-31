import { useCallback } from 'react';
import { checkAndHandleAuthError } from '../services/authErrorService';

/**
 * Hook for handling authentication errors in components
 * @returns Object with error handling functions
 */
export const useAuthError = () => {
  const handleError = useCallback((error: any) => {
    return checkAndHandleAuthError(error);
  }, []);

  return {
    handleError,
    isAuthError: checkAndHandleAuthError
  };
};
