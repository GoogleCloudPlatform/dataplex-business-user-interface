import axios from 'axios';
import { checkAndHandleAuthError } from '../services/authErrorService';
import { saveCurrentLocationForRedirect } from '../services/urlPreservationService';

// Global flag to track if session expiration modal is active
let sessionExpirationModalActive = false;

export const setSessionExpirationModalActive = (active: boolean) => {
  sessionExpirationModalActive = active;
};

export const isSessionExpirationModalActive = (): boolean => {
  return sessionExpirationModalActive;
};

// Axios response interceptor
axios.interceptors.response.use(
  (response) => response,
  (error: Error) => {
    const isAuthError = checkAndHandleAuthError(error);

    // If this is an auth error and the session expiration modal is NOT active,
    // save the current URL before logout (hard 401 from API call during normal usage)
    if (isAuthError && !isSessionExpirationModalActive()) {
      saveCurrentLocationForRedirect(
        window.location.pathname +
        window.location.search +
        window.location.hash
      );
    }

    return Promise.reject(error);
  }
);

export default axios;
