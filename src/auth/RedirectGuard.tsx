/**
 * @file RedirectGuard.tsx
 * @summary Handles post-login redirection to saved URLs
 *
 * @description
 * This component checks for saved redirect URLs (from session expiration or 401 errors)
 * and navigates the user back to their previous location after successful login.
 *
 * It checks two sources:
 * 1. URL query parameter: `/login?continue=/previous-path`
 * 2. sessionStorage: saved redirect URL from auth error
 *
 * After successful redirect, it clears the saved URL to prevent redirect loops.
 */

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getRedirectURL, clearRedirectURL, sanitizeRedirectURL } from '../services/urlPreservationService';

interface RedirectGuardProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
}

export const RedirectGuard: React.FC<RedirectGuardProps> = ({ children, isAuthenticated }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    // Check for `continue` query parameter first
    const continueParam = searchParams.get('continue');
    if (continueParam) {
      const sanitizedURL = sanitizeRedirectURL(continueParam);
      if (sanitizedURL) {
        console.log('[RedirectGuard] Redirecting to query param URL:', sanitizedURL);
        clearRedirectURL(); // Clear sessionStorage as well
        navigate(sanitizedURL, { replace: true });
        return;
      }
    }

    // Check sessionStorage for saved redirect URL
    const savedURL = getRedirectURL();
    if (savedURL) {
      console.log('[RedirectGuard] Redirecting to saved URL:', savedURL);
      clearRedirectURL();
      navigate(savedURL, { replace: true });
      return;
    }

    // No redirect needed - user navigated to login naturally
  }, [isAuthenticated, searchParams, navigate]);

  return <>{children}</>;
};

export default RedirectGuard;
