/**
 * @file urlPreservationService.ts
 * @summary Centralized service for preserving and validating redirect URLs on authentication errors
 *
 * Security: Implements strict whitelist to prevent open redirect vulnerabilities
 */

import { AUTH_CONFIG } from '../constants/auth';

/**
 * Sanitizes and validates a URL path
 * @param url - The URL string to validate
 * @returns Sanitized URL or null if invalid
 */
export const sanitizeRedirectURL = (url: string): string | null => {
  try {
    // Prevent empty or whitespace-only URLs
    if (!url || url.trim().length === 0) {
      return null;
    }

    // Remove leading/trailing whitespace
    url = url.trim();

    // Block dangerous protocols
    if (
      url.startsWith('javascript:') ||
      url.startsWith('data:') ||
      url.startsWith('vbscript:') ||
      url.startsWith('file:')
    ) {
      console.warn('[URL Preservation] Blocked dangerous protocol:', url);
      return null;
    }

    // Block absolute URLs to external domains
    if (url.startsWith('http://') || url.startsWith('https://')) {
      console.warn('[URL Preservation] Blocked absolute URL:', url);
      return null;
    }

    // Block protocol-relative URLs (//example.com)
    if (url.startsWith('//')) {
      console.warn('[URL Preservation] Blocked protocol-relative URL:', url);
      return null;
    }

    // Ensure URL starts with /
    if (!url.startsWith('/')) {
      url = '/' + url;
    }

    // Extract pathname (ignore query and hash for validation)
    const urlObj = new URL(url, window.location.origin);
    const pathname = urlObj.pathname;

    // Check if path is blocked
    if ((AUTH_CONFIG.BLOCKED_REDIRECT_PATHS as readonly string[]).includes(pathname)) {
      console.log('[URL Preservation] Skipping blocked path:', pathname);
      return null;
    }

    // Check if path is in whitelist
    const isAllowed = AUTH_CONFIG.ALLOWED_REDIRECT_PATHS.some(allowedPath => {
      // Exact match or prefix match (for dynamic routes like /view-details?id=123)
      return pathname === allowedPath || pathname.startsWith(allowedPath + '/');
    });

    if (!isAllowed) {
      console.warn('[URL Preservation] Path not in whitelist:', pathname);
      return null;
    }

    // Return full path with query and hash
    return urlObj.pathname + urlObj.search + urlObj.hash;
  } catch (error) {
    console.error('[URL Preservation] Error sanitizing URL:', error);
    return null;
  }
};

/**
 * Saves the current location for post-login redirect
 * @param url - Optional URL to save (defaults to current location)
 * @returns true if URL was saved successfully, false otherwise
 */
export const saveCurrentLocationForRedirect = (url?: string): boolean => {
  try {
    const urlToSave = url || (window.location.pathname + window.location.search + window.location.hash);
    const sanitizedURL = sanitizeRedirectURL(urlToSave);

    if (sanitizedURL) {
      sessionStorage.setItem(AUTH_CONFIG.REDIRECT_URL_STORAGE_KEY, sanitizedURL);
      console.log('[URL Preservation] Saved redirect URL:', sanitizedURL);
      return true;
    } else {
      console.log('[URL Preservation] URL not saved (invalid or blocked)');
      return false;
    }
  } catch (error) {
    console.error('[URL Preservation] Error saving redirect URL:', error);
    return false;
  }
};

/**
 * Retrieves and validates the saved redirect URL
 * @returns Validated redirect URL or null
 */
export const getRedirectURL = (): string | null => {
  try {
    const savedURL = sessionStorage.getItem(AUTH_CONFIG.REDIRECT_URL_STORAGE_KEY);
    if (!savedURL) {
      return null;
    }

    // Re-validate URL (defense in depth)
    const validatedURL = sanitizeRedirectURL(savedURL);
    if (!validatedURL) {
      // Clear invalid URL
      clearRedirectURL();
      return null;
    }

    return validatedURL;
  } catch (error) {
    console.error('[URL Preservation] Error retrieving redirect URL:', error);
    return null;
  }
};

/**
 * Clears the saved redirect URL from storage
 */
export const clearRedirectURL = (): void => {
  try {
    sessionStorage.removeItem(AUTH_CONFIG.REDIRECT_URL_STORAGE_KEY);
    console.log('[URL Preservation] Cleared redirect URL');
  } catch (error) {
    console.error('[URL Preservation] Error clearing redirect URL:', error);
  }
};

/**
 * Builds a login URL with continue parameter
 * @param redirectURL - The URL to redirect to after login
 * @returns Login URL with encoded continue parameter
 */
export const buildLoginURLWithRedirect = (redirectURL?: string): string => {
  const url = redirectURL || getRedirectURL();
  if (!url) {
    return '/login';
  }

  const encodedURL = encodeURIComponent(url);
  return `/login?continue=${encodedURL}`;
};

/**
 * Marks that an explicit, deliberate sign-out is in progress. ProtectedRoute checks
 * this via `isExplicitSignOutRecent()` before building a `?continue=` redirect, so a
 * user who intentionally signs out isn't sent right back to the resource they were on.
 *
 * A time-window check (rather than a set/consume-once flag) is used deliberately — it
 * doesn't matter how many times (zero, one, or several) ProtectedRoute re-renders during
 * the sign-out transition, every one of those renders sees the same answer, and it can
 * never leak into suppressing an unrelated *future* session-expiry redirect, since it
 * expires on its own regardless of whether anything ever reads it.
 */
let explicitSignOutTimestamp = 0;
const EXPLICIT_SIGN_OUT_WINDOW_MS = 2000; // generous cushion for any render/batching delay

export const markExplicitSignOut = (): void => {
  explicitSignOutTimestamp = Date.now();
};

export const isExplicitSignOutRecent = (): boolean => {
  return Date.now() - explicitSignOutTimestamp < EXPLICIT_SIGN_OUT_WINDOW_MS;
};
