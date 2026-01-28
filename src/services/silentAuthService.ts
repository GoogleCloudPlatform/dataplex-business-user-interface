/**
 * @file silentAuthService.ts
 * @description Service for performing silent Google OAuth authentication using hidden iframe
 *
 * This allows refreshing the access token without user interaction when the user
 * has a valid Google session.
 */

import { AUTH_CONFIG } from '../constants/auth';

/**
 * Performs silent Google OAuth authentication using iframe approach
 *
 * @param email - User's email for login_hint parameter
 * @param clientId - Google OAuth Client ID
 * @returns Promise<string> - New access token
 * @throws Error if silent auth fails
 */
export const performSilentAuth = async (
  email: string,
  clientId: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Create hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.id = 'silent-auth-iframe';

    // Build OAuth URL with prompt=none for silent authentication
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('response_type', 'token');
    authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/cloud-platform');
    authUrl.searchParams.set('redirect_uri', window.location.origin);
    authUrl.searchParams.set('prompt', 'none'); // Silent authentication
    authUrl.searchParams.set('login_hint', email); // Hint which user to authenticate

    let timeoutId: ReturnType<typeof setTimeout>;

    // Listen for postMessage from iframe
    const messageHandler = (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) {
        return;
      }

      // Check if this is our auth response
      if (event.data && event.data.type === 'silent-auth-response') {
        cleanup();

        if (event.data.accessToken) {
          console.log('[Silent Auth] Success - got new token');
          resolve(event.data.accessToken);
        } else if (event.data.error) {
          console.error('[Silent Auth] Failed:', event.data.error);
          reject(new Error(event.data.error));
        }
      }
    };

    // Cleanup function
    const cleanup = () => {
      clearTimeout(timeoutId);
      window.removeEventListener('message', messageHandler);
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    };

    // Set timeout
    timeoutId = setTimeout(() => {
      cleanup();
      console.error('[Silent Auth] Timeout after', AUTH_CONFIG.SILENT_AUTH_TIMEOUT_MS, 'ms');
      reject(new Error('Silent authentication timed out'));
    }, AUTH_CONFIG.SILENT_AUTH_TIMEOUT_MS);

    // Add message listener
    window.addEventListener('message', messageHandler);

    // Set iframe src and append to body
    iframe.src = authUrl.toString();
    document.body.appendChild(iframe);

    // Since we're using implicit flow and redirect_uri = window.location.origin,
    // the iframe will be redirected to our origin with the token in the URL hash
    // We need to parse it in the iframe and send it back via postMessage

    // Add a script to the iframe's load event to parse the token
    iframe.onload = () => {
      try {
        // Try to access iframe's hash (same-origin)
        const iframeHash = iframe.contentWindow?.location.hash;
        if (iframeHash) {
          const params = new URLSearchParams(iframeHash.substring(1));
          const accessToken = params.get('access_token');
          const error = params.get('error');

          if (accessToken) {
            // Send success message
            window.postMessage({
              type: 'silent-auth-response',
              accessToken
            }, window.location.origin);
          } else if (error) {
            // Send error message
            window.postMessage({
              type: 'silent-auth-response',
              error: error,
              error_description: params.get('error_description')
            }, window.location.origin);
          }
        }
      } catch (err) {
        // Cross-origin error or other error
        console.error('[Silent Auth] Error accessing iframe:', err);
        // This is expected if Google redirects to a different origin
        // The iframe will handle the redirect and we'll get the response via postMessage
      }
    };
  });
};

/**
 * Check if silent authentication is possible
 * (User must have email and token)
 *
 * @param user - User object
 * @returns boolean
 */
export const canAttemptSilentAuth = (user: any): boolean => {
  return !!(user && user.email && user.token);
};
