import { AxiosError } from 'axios';

// Global notification functions - set by AuthProvider
let globalShowError: (message: string, duration?: number) => void;
let globalLogout: () => void;

export const setGlobalAuthFunctions = (
  showError: (message: string, duration?: number) => void,
  logout: () => void
) => {
  globalShowError = showError;
  globalLogout = logout;
};

// Check if error is an authentication error
export const isAuthenticationError = (error: AxiosError | unknown): boolean => {
  // Check for HTTP status codes
  if ((error as AxiosError)?.response?.status === 401 || (error as AxiosError)?.response?.status === 403) {
    return true;
  }

  // Check for specific error messages in response data
  const errorData = (error as AxiosError)?.response?.data || error;
  if (errorData && typeof errorData === 'object') {
    const message = (errorData as any).message || (errorData as any).details || '';
    const messageStr = message.toString().toLowerCase();
    
    return (
      messageStr.includes('unauthenticated') ||
      messageStr.includes('invalid authentication') ||
      messageStr.includes('authentication credentials') ||
      messageStr.includes('access token') ||
      messageStr.includes('login cookie') ||
      messageStr.includes('oauth 2') ||
      messageStr.includes('unauthorized')
    );
  }

  return false;
};

// Handle authentication error with notification and redirect
export const handleAuthenticationError = (error?: AxiosError | unknown) => {
  console.log('Authentication error detected:', (error as AxiosError)?.response?.data || error);
  
  // Show notification
  if (globalShowError) {
    globalShowError('Your session has expired. You will be redirected to the login page.', 5000);
  }

  // Redirect to login after a delay
  setTimeout(() => {
    if (globalLogout) {
      globalLogout();
    }
  }, 2000);
};

// Check and handle authentication error if detected
export const checkAndHandleAuthError = (error: AxiosError | unknown): boolean => {
  if (isAuthenticationError(error)) {
    handleAuthenticationError(error);
    return true;
  }
  return false;
};
