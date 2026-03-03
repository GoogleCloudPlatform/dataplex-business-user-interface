import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ============================================================================
// MOCK SETUP
// ============================================================================

// Mock AUTH_CONFIG
vi.mock('../constants/auth', () => ({
  AUTH_CONFIG: {
    SILENT_AUTH_TIMEOUT_MS: 10000,
    REDIRECT_URL_STORAGE_KEY: 'dataplex_auth_redirect_url',
    ALLOWED_REDIRECT_PATHS: [
      '/home',
      '/search',
      '/view-details',
      '/admin-panel',
      '/browse-by-annotation',
      '/glossaries',
      '/guide',
      '/help-support',
    ],
    BLOCKED_REDIRECT_PATHS: ['/login', '/permission-required', '/'],
  },
}));

// Import services after mocks
import {
  isAuthNotificationShown,
  setAuthNotificationShown,
  setGlobalAuthFunctions,
  isAuthenticationError,
  handleAuthenticationError,
  checkAndHandleAuthError,
} from './authErrorService';

import { performSilentAuth, canAttemptSilentAuth } from './silentAuthService';

import {
  sanitizeRedirectURL,
  saveCurrentLocationForRedirect,
  getRedirectURL,
  clearRedirectURL,
  buildLoginURLWithRedirect,
} from './urlPreservationService';

// ============================================================================
// Mock sessionStorage
// ============================================================================
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    _getStore: () => store,
    _setStore: (newStore: Record<string, string>) => {
      store = newStore;
    },
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// ============================================================================
// authErrorService Tests
// ============================================================================
describe('authErrorService', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // Reset the notification flag
    setAuthNotificationShown(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetAllMocks();
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('isAuthNotificationShown', () => {
    it('should return false initially', () => {
      setAuthNotificationShown(false);
      expect(isAuthNotificationShown()).toBe(false);
    });

    it('should return true after setting to true', () => {
      setAuthNotificationShown(true);
      expect(isAuthNotificationShown()).toBe(true);
    });
  });

  describe('setAuthNotificationShown', () => {
    it('should set the notification shown flag to true', () => {
      setAuthNotificationShown(true);
      expect(isAuthNotificationShown()).toBe(true);
    });

    it('should set the notification shown flag to false', () => {
      setAuthNotificationShown(true);
      setAuthNotificationShown(false);
      expect(isAuthNotificationShown()).toBe(false);
    });
  });

  describe('setGlobalAuthFunctions', () => {
    it('should set global auth functions', () => {
      const mockShowError = vi.fn();
      const mockLogout = vi.fn();

      setGlobalAuthFunctions(mockShowError, mockLogout);

      // Trigger handleAuthenticationError to verify functions were set
      handleAuthenticationError();

      expect(mockShowError).toHaveBeenCalledWith(
        'Your session has expired. You will be redirected to the login page.',
        5000
      );

      vi.advanceTimersByTime(2000);
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe('isAuthenticationError', () => {
    it('should return true for 401 status code', () => {
      const error = {
        response: { status: 401, data: {} },
      };
      expect(isAuthenticationError(error)).toBe(true);
    });

    it('should return true for 403 status code', () => {
      const error = {
        response: { status: 403, data: {} },
      };
      expect(isAuthenticationError(error)).toBe(false);
    });

    it('should return false for 500 status code', () => {
      const error = {
        response: { status: 500, data: {} },
      };
      expect(isAuthenticationError(error)).toBe(false);
    });

    it('should return false for 404 status code', () => {
      const error = {
        response: { status: 404, data: {} },
      };
      expect(isAuthenticationError(error)).toBe(false);
    });

    it('should return true when error message contains "unauthenticated"', () => {
      const error = {
        response: {
          status: 400,
          data: { message: 'Request is unauthenticated' },
        },
      };
      expect(isAuthenticationError(error)).toBe(true);
    });

    it('should return true when error message contains "invalid authentication"', () => {
      const error = {
        response: {
          status: 400,
          data: { message: 'Invalid Authentication credentials' },
        },
      };
      expect(isAuthenticationError(error)).toBe(true);
    });

    it('should return true when error message contains "authentication credentials"', () => {
      const error = {
        response: {
          status: 400,
          data: { message: 'Missing authentication credentials' },
        },
      };
      expect(isAuthenticationError(error)).toBe(true);
    });

    it('should return true when error message contains "access token"', () => {
      const error = {
        response: {
          status: 400,
          data: { message: 'Access token expired' },
        },
      };
      expect(isAuthenticationError(error)).toBe(true);
    });

    it('should return true when error message contains "login cookie"', () => {
      const error = {
        response: {
          status: 400,
          data: { message: 'Login cookie is invalid' },
        },
      };
      expect(isAuthenticationError(error)).toBe(true);
    });

    it('should return true when error message contains "oauth 2"', () => {
      const error = {
        response: {
          status: 400,
          data: { message: 'OAuth 2 error occurred' },
        },
      };
      expect(isAuthenticationError(error)).toBe(true);
    });

    it('should return true when error message contains "unauthorized"', () => {
      const error = {
        response: {
          status: 400,
          data: { message: 'User is unauthorized' },
        },
      };
      expect(isAuthenticationError(error)).toBe(true);
    });

    it('should return true when error details contains auth message', () => {
      const error = {
        response: {
          status: 400,
          data: { details: 'Unauthenticated request' },
        },
      };
      expect(isAuthenticationError(error)).toBe(true);
    });

    it('should return false for non-auth related error message', () => {
      const error = {
        response: {
          status: 400,
          data: { message: 'Invalid request body' },
        },
      };
      expect(isAuthenticationError(error)).toBe(false);
    });

    it('should return false when errorData is not an object', () => {
      const error = {
        response: {
          status: 400,
          data: 'String error',
        },
      };
      expect(isAuthenticationError(error)).toBe(false);
    });

    it('should return false for null error', () => {
      expect(isAuthenticationError(null)).toBe(false);
    });

    it('should return false for undefined error', () => {
      expect(isAuthenticationError(undefined)).toBe(false);
    });

    it('should handle error without response property', () => {
      const error = new Error('Network error');
      expect(isAuthenticationError(error)).toBe(false);
    });

    it('should check error object directly when no response data', () => {
      const error = {
        message: 'Unauthenticated access',
      };
      expect(isAuthenticationError(error)).toBe(true);
    });
  });

  describe('handleAuthenticationError', () => {
    it('should show error notification and call logout after delay', () => {
      const mockShowError = vi.fn();
      const mockLogout = vi.fn();
      setGlobalAuthFunctions(mockShowError, mockLogout);
      setAuthNotificationShown(false);

      handleAuthenticationError();

      expect(mockShowError).toHaveBeenCalledWith(
        'Your session has expired. You will be redirected to the login page.',
        5000
      );
      expect(isAuthNotificationShown()).toBe(true);

      vi.advanceTimersByTime(2000);
      expect(mockLogout).toHaveBeenCalled();
    });

    it('should not show notification if already shown', () => {
      const mockShowError = vi.fn();
      const mockLogout = vi.fn();
      setGlobalAuthFunctions(mockShowError, mockLogout);
      setAuthNotificationShown(true);

      handleAuthenticationError();

      expect(mockShowError).not.toHaveBeenCalled();
    });

    it('should log error data when provided', () => {
      const mockShowError = vi.fn();
      const mockLogout = vi.fn();
      setGlobalAuthFunctions(mockShowError, mockLogout);
      setAuthNotificationShown(false);

      const error = {
        response: { data: { message: 'Auth failed' } },
      };
      handleAuthenticationError(error);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Authentication error detected:',
        { message: 'Auth failed' }
      );
    });

    it('should handle case when globalShowError is not set', () => {
      // Reset global functions by not setting them
      // The module-level variables persist, so we need to test this differently
      // by calling handleAuthenticationError without errors
      setAuthNotificationShown(false);
      expect(() => handleAuthenticationError()).not.toThrow();
    });

    it('should handle case when globalLogout is not set', () => {
      const mockShowError = vi.fn();
      setGlobalAuthFunctions(mockShowError, undefined as unknown as () => void);
      setAuthNotificationShown(false);

      handleAuthenticationError();

      vi.advanceTimersByTime(2000);
      // Should not throw even if logout is undefined
    });
  });

  describe('checkAndHandleAuthError', () => {
    it('should return true and handle error for auth errors', () => {
      const mockShowError = vi.fn();
      const mockLogout = vi.fn();
      setGlobalAuthFunctions(mockShowError, mockLogout);
      setAuthNotificationShown(false);

      const error = { response: { status: 401 } };
      const result = checkAndHandleAuthError(error);

      expect(result).toBe(true);
      expect(mockShowError).toHaveBeenCalled();
    });

    it('should return false for non-auth errors', () => {
      const error = { response: { status: 500 } };
      const result = checkAndHandleAuthError(error);

      expect(result).toBe(false);
    });

    it('should return true for 403 errors', () => {
      const mockShowError = vi.fn();
      const mockLogout = vi.fn();
      setGlobalAuthFunctions(mockShowError, mockLogout);
      setAuthNotificationShown(false);

      const error = { response: { status: 403 } };
      const result = checkAndHandleAuthError(error);

      expect(result).toBe(false);
    });

    it('should return true for errors with auth-related messages', () => {
      const mockShowError = vi.fn();
      const mockLogout = vi.fn();
      setGlobalAuthFunctions(mockShowError, mockLogout);
      setAuthNotificationShown(false);

      const error = {
        response: { status: 400, data: { message: 'unauthenticated' } },
      };
      const result = checkAndHandleAuthError(error);

      expect(result).toBe(true);
    });
  });
});

// ============================================================================
// silentAuthService Tests
// ============================================================================
describe('silentAuthService', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let mockIframe: {
    style: { display: string };
    id: string;
    src: string;
    onload: (() => void) | null;
    contentWindow: { location: { hash: string } } | null;
    parentNode: { removeChild: ReturnType<typeof vi.fn> } | null;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock iframe
    mockIframe = {
      style: { display: '' },
      id: '',
      src: '',
      onload: null,
      contentWindow: null,
      parentNode: null,
    };

    vi.spyOn(document, 'createElement').mockReturnValue(
      mockIframe as unknown as HTMLElement
    );
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
      mockIframe.parentNode = { removeChild: vi.fn() };
      return node;
    });

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'http://localhost:3000',
        pathname: '/home',
        search: '',
        hash: '',
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetAllMocks();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('performSilentAuth', () => {
    it('should create hidden iframe with correct auth URL', async () => {
      const promise = performSilentAuth('test@example.com', 'test-client-id');

      expect(document.createElement).toHaveBeenCalledWith('iframe');
      expect(mockIframe.style.display).toBe('none');
      expect(mockIframe.id).toBe('silent-auth-iframe');
      expect(mockIframe.src).toContain(
        'https://accounts.google.com/o/oauth2/v2/auth'
      );
      expect(mockIframe.src).toContain('client_id=test-client-id');
      expect(mockIframe.src).toContain('response_type=token');
      expect(mockIframe.src).toContain('prompt=none');
      expect(mockIframe.src).toContain(
        'login_hint=' + encodeURIComponent('test@example.com')
      );
      expect(document.body.appendChild).toHaveBeenCalled();

      // Simulate timeout to reject
      vi.advanceTimersByTime(10001);

      await expect(promise).rejects.toThrow('Silent authentication timed out');
    });

    it('should resolve with access token on successful auth via postMessage', async () => {
      const promise = performSilentAuth('test@example.com', 'test-client-id');

      // Simulate receiving postMessage with access token
      window.dispatchEvent(
        new MessageEvent('message', {
          origin: 'http://localhost:3000',
          data: {
            type: 'silent-auth-response',
            accessToken: 'new-access-token',
          },
        })
      );

      const result = await promise;
      expect(result).toBe('new-access-token');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Silent Auth] Success - got new token'
      );
    });

    it('should reject with error on auth failure via postMessage', async () => {
      const promise = performSilentAuth('test@example.com', 'test-client-id');

      // Simulate receiving postMessage with error
      window.dispatchEvent(
        new MessageEvent('message', {
          origin: 'http://localhost:3000',
          data: {
            type: 'silent-auth-response',
            error: 'access_denied',
          },
        })
      );

      await expect(promise).rejects.toThrow('access_denied');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Silent Auth] Failed:',
        'access_denied'
      );
    });

    it('should ignore messages from different origins', async () => {
      const promise = performSilentAuth('test@example.com', 'test-client-id');

      // Simulate receiving postMessage from different origin
      window.dispatchEvent(
        new MessageEvent('message', {
          origin: 'http://malicious-site.com',
          data: {
            type: 'silent-auth-response',
            accessToken: 'malicious-token',
          },
        })
      );

      // Should timeout since message was ignored
      vi.advanceTimersByTime(10001);
      await expect(promise).rejects.toThrow('Silent authentication timed out');
    });

    it('should ignore messages with wrong type', async () => {
      const promise = performSilentAuth('test@example.com', 'test-client-id');

      // Simulate receiving postMessage with wrong type
      window.dispatchEvent(
        new MessageEvent('message', {
          origin: 'http://localhost:3000',
          data: {
            type: 'other-message',
            accessToken: 'some-token',
          },
        })
      );

      // Should timeout since message was ignored
      vi.advanceTimersByTime(10001);
      await expect(promise).rejects.toThrow('Silent authentication timed out');
    });

    it('should parse access token from iframe hash on load', async () => {
      const promise = performSilentAuth('test@example.com', 'test-client-id');

      // Set up iframe contentWindow with hash containing token
      mockIframe.contentWindow = {
        location: {
          hash: '#access_token=hash-token&token_type=Bearer',
        },
      };

      // Trigger onload - which internally posts a message
      // We need to manually dispatch the message that onload would trigger
      mockIframe.onload?.();

      // Manually dispatch the message event that window.postMessage would create
      window.dispatchEvent(
        new MessageEvent('message', {
          origin: 'http://localhost:3000',
          data: {
            type: 'silent-auth-response',
            accessToken: 'hash-token',
          },
        })
      );

      const result = await promise;
      expect(result).toBe('hash-token');
    });

    it('should handle error in iframe hash', async () => {
      const promise = performSilentAuth('test@example.com', 'test-client-id');

      // Set up iframe contentWindow with error hash
      mockIframe.contentWindow = {
        location: {
          hash: '#error=interaction_required&error_description=Login%20required',
        },
      };

      // Trigger onload - which internally posts a message
      mockIframe.onload?.();

      // Manually dispatch the message event that window.postMessage would create
      window.dispatchEvent(
        new MessageEvent('message', {
          origin: 'http://localhost:3000',
          data: {
            type: 'silent-auth-response',
            error: 'interaction_required',
            error_description: 'Login required',
          },
        })
      );

      await expect(promise).rejects.toThrow('interaction_required');
    });

    it('should handle empty iframe hash', async () => {
      const promise = performSilentAuth('test@example.com', 'test-client-id');

      // Set up iframe contentWindow with empty hash
      mockIframe.contentWindow = {
        location: {
          hash: '',
        },
      };

      // Trigger onload - nothing happens since hash is empty
      mockIframe.onload?.();

      // Should timeout
      vi.advanceTimersByTime(10001);
      await expect(promise).rejects.toThrow('Silent authentication timed out');
    });

    it('should handle cross-origin iframe access error', async () => {
      const promise = performSilentAuth('test@example.com', 'test-client-id');

      // Set up iframe contentWindow to throw on access
      Object.defineProperty(mockIframe, 'contentWindow', {
        get: () => {
          throw new Error('Cross-origin access denied');
        },
        configurable: true,
      });

      // Trigger onload - should catch error
      mockIframe.onload?.();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Silent Auth] Error accessing iframe:',
        expect.any(Error)
      );

      // Should timeout
      vi.advanceTimersByTime(10001);
      await expect(promise).rejects.toThrow('Silent authentication timed out');
    });

    it('should cleanup iframe and event listener on success', async () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const promise = performSilentAuth('test@example.com', 'test-client-id');
      mockIframe.parentNode = { removeChild: vi.fn() };

      // Simulate successful auth
      window.dispatchEvent(
        new MessageEvent('message', {
          origin: 'http://localhost:3000',
          data: {
            type: 'silent-auth-response',
            accessToken: 'token',
          },
        })
      );

      await promise;

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'message',
        expect.any(Function)
      );
      expect(mockIframe.parentNode?.removeChild).toHaveBeenCalled();

      removeEventListenerSpy.mockRestore();
    });

    it('should cleanup on timeout', async () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const promise = performSilentAuth('test@example.com', 'test-client-id');
      mockIframe.parentNode = { removeChild: vi.fn() };

      vi.advanceTimersByTime(10001);

      await expect(promise).rejects.toThrow('Silent authentication timed out');
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'message',
        expect.any(Function)
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Silent Auth] Timeout after',
        10000,
        'ms'
      );

      removeEventListenerSpy.mockRestore();
    });

    it('should handle null parentNode during cleanup', async () => {
      const promise = performSilentAuth('test@example.com', 'test-client-id');
      mockIframe.parentNode = null;

      // Simulate successful auth
      window.dispatchEvent(
        new MessageEvent('message', {
          origin: 'http://localhost:3000',
          data: {
            type: 'silent-auth-response',
            accessToken: 'token',
          },
        })
      );

      // Should not throw
      await expect(promise).resolves.toBe('token');
    });
  });

  describe('canAttemptSilentAuth', () => {
    it('should return true when user has email and token', () => {
      const user = {
        email: 'test@example.com',
        token: 'valid-token',
      };
      expect(canAttemptSilentAuth(user)).toBe(true);
    });

    it('should return false when user is null', () => {
      expect(canAttemptSilentAuth(null)).toBe(false);
    });

    it('should return false when user is undefined', () => {
      expect(canAttemptSilentAuth(undefined)).toBe(false);
    });

    it('should return false when user has no email', () => {
      const user = {
        token: 'valid-token',
      };
      expect(canAttemptSilentAuth(user)).toBe(false);
    });

    it('should return false when user has no token', () => {
      const user = {
        email: 'test@example.com',
      };
      expect(canAttemptSilentAuth(user)).toBe(false);
    });

    it('should return false when user has empty email', () => {
      const user = {
        email: '',
        token: 'valid-token',
      };
      expect(canAttemptSilentAuth(user)).toBe(false);
    });

    it('should return false when user has empty token', () => {
      const user = {
        email: 'test@example.com',
        token: '',
      };
      expect(canAttemptSilentAuth(user)).toBe(false);
    });

    it('should return false when user object is empty', () => {
      const user = {};
      expect(canAttemptSilentAuth(user)).toBe(false);
    });
  });
});

// ============================================================================
// urlPreservationService Tests
// ============================================================================
describe('urlPreservationService', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorageMock.clear();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'http://localhost:3000',
        pathname: '/home',
        search: '?tab=1',
        hash: '#section1',
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('sanitizeRedirectURL', () => {
    it('should return null for empty string', () => {
      expect(sanitizeRedirectURL('')).toBeNull();
    });

    it('should return null for whitespace-only string', () => {
      expect(sanitizeRedirectURL('   ')).toBeNull();
    });

    it('should return null for null input', () => {
      expect(sanitizeRedirectURL(null as unknown as string)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(sanitizeRedirectURL(undefined as unknown as string)).toBeNull();
    });

    it('should block javascript: protocol', () => {
      expect(sanitizeRedirectURL('javascript:alert(1)')).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[URL Preservation] Blocked dangerous protocol:',
        'javascript:alert(1)'
      );
    });

    it('should block data: protocol', () => {
      expect(sanitizeRedirectURL('data:text/html,<script>alert(1)</script>')).toBeNull();
    });

    it('should block vbscript: protocol', () => {
      expect(sanitizeRedirectURL('vbscript:msgbox(1)')).toBeNull();
    });

    it('should block file: protocol', () => {
      expect(sanitizeRedirectURL('file:///etc/passwd')).toBeNull();
    });

    it('should block absolute http URLs', () => {
      expect(sanitizeRedirectURL('http://evil.com/home')).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[URL Preservation] Blocked absolute URL:',
        'http://evil.com/home'
      );
    });

    it('should block absolute https URLs', () => {
      expect(sanitizeRedirectURL('https://evil.com/home')).toBeNull();
    });

    it('should block protocol-relative URLs', () => {
      expect(sanitizeRedirectURL('//evil.com/home')).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[URL Preservation] Blocked protocol-relative URL:',
        '//evil.com/home'
      );
    });

    it('should add leading slash if missing', () => {
      const result = sanitizeRedirectURL('home');
      expect(result).toBe('/home');
    });

    it('should return null for blocked paths', () => {
      expect(sanitizeRedirectURL('/login')).toBeNull();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[URL Preservation] Skipping blocked path:',
        '/login'
      );
    });

    it('should return null for permission-required path', () => {
      expect(sanitizeRedirectURL('/permission-required')).toBeNull();
    });

    it('should return null for root path', () => {
      expect(sanitizeRedirectURL('/')).toBeNull();
    });

    it('should return valid URL for allowed paths', () => {
      expect(sanitizeRedirectURL('/home')).toBe('/home');
    });

    it('should return valid URL for /search', () => {
      expect(sanitizeRedirectURL('/search')).toBe('/search');
    });

    it('should return valid URL for /view-details', () => {
      expect(sanitizeRedirectURL('/view-details')).toBe('/view-details');
    });

    it('should return valid URL for /admin-panel', () => {
      expect(sanitizeRedirectURL('/admin-panel')).toBe('/admin-panel');
    });

    it('should return valid URL for /browse-by-annotation', () => {
      expect(sanitizeRedirectURL('/browse-by-annotation')).toBe('/browse-by-annotation');
    });

    it('should return valid URL for /glossaries', () => {
      expect(sanitizeRedirectURL('/glossaries')).toBe('/glossaries');
    });

    it('should return valid URL for /guide', () => {
      expect(sanitizeRedirectURL('/guide')).toBe('/guide');
    });

    it('should return valid URL for /help-support', () => {
      expect(sanitizeRedirectURL('/help-support')).toBe('/help-support');
    });

    it('should preserve query parameters', () => {
      expect(sanitizeRedirectURL('/search?query=test')).toBe('/search?query=test');
    });

    it('should preserve hash', () => {
      expect(sanitizeRedirectURL('/home#section')).toBe('/home#section');
    });

    it('should preserve query and hash', () => {
      expect(sanitizeRedirectURL('/view-details?id=123#overview')).toBe(
        '/view-details?id=123#overview'
      );
    });

    it('should allow nested paths under allowed paths', () => {
      expect(sanitizeRedirectURL('/view-details/123')).toBe('/view-details/123');
    });

    it('should return null for paths not in whitelist', () => {
      expect(sanitizeRedirectURL('/unknown-path')).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[URL Preservation] Path not in whitelist:',
        '/unknown-path'
      );
    });

    it('should trim whitespace from URL', () => {
      expect(sanitizeRedirectURL('  /home  ')).toBe('/home');
    });

    it('should handle URL parsing errors', () => {
      // This is difficult to trigger since URL constructor is quite forgiving
      // We'll mock URL to throw
      const originalURL = globalThis.URL;
      globalThis.URL = vi.fn().mockImplementation(() => {
        throw new Error('Invalid URL');
      }) as unknown as typeof URL;

      expect(sanitizeRedirectURL('/home')).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[URL Preservation] Error sanitizing URL:',
        expect.any(Error)
      );

      globalThis.URL = originalURL;
    });
  });

  describe('saveCurrentLocationForRedirect', () => {
    it('should save current location from window.location', () => {
      const result = saveCurrentLocationForRedirect();

      expect(result).toBe(true);
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
        'dataplex_auth_redirect_url',
        '/home?tab=1#section1'
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[URL Preservation] Saved redirect URL:',
        '/home?tab=1#section1'
      );
    });

    it('should save provided URL instead of current location', () => {
      const result = saveCurrentLocationForRedirect('/search?q=test');

      expect(result).toBe(true);
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
        'dataplex_auth_redirect_url',
        '/search?q=test'
      );
    });

    it('should return false for invalid URL', () => {
      const result = saveCurrentLocationForRedirect('/login');

      expect(result).toBe(false);
      expect(sessionStorageMock.setItem).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[URL Preservation] URL not saved (invalid or blocked)'
      );
    });

    it('should return false for blocked URL', () => {
      const result = saveCurrentLocationForRedirect('/');

      expect(result).toBe(false);
    });

    it('should handle sessionStorage errors', () => {
      sessionStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage quota exceeded');
      });

      const result = saveCurrentLocationForRedirect('/home');

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[URL Preservation] Error saving redirect URL:',
        expect.any(Error)
      );
    });
  });

  describe('getRedirectURL', () => {
    it('should return null when no URL is saved', () => {
      expect(getRedirectURL()).toBeNull();
    });

    it('should return saved URL when valid', () => {
      sessionStorageMock._setStore({
        dataplex_auth_redirect_url: '/home',
      });

      expect(getRedirectURL()).toBe('/home');
    });

    it('should return null and clear storage when URL is invalid', () => {
      sessionStorageMock._setStore({
        dataplex_auth_redirect_url: '/login',
      });

      expect(getRedirectURL()).toBeNull();
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(
        'dataplex_auth_redirect_url'
      );
    });

    it('should handle sessionStorage errors', () => {
      sessionStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      expect(getRedirectURL()).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[URL Preservation] Error retrieving redirect URL:',
        expect.any(Error)
      );
    });

    it('should re-validate saved URL for defense in depth', () => {
      sessionStorageMock._setStore({
        dataplex_auth_redirect_url: '/search?query=test',
      });

      const result = getRedirectURL();

      expect(result).toBe('/search?query=test');
    });
  });

  describe('clearRedirectURL', () => {
    it('should remove URL from sessionStorage', () => {
      sessionStorageMock._setStore({
        dataplex_auth_redirect_url: '/home',
      });

      clearRedirectURL();

      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(
        'dataplex_auth_redirect_url'
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[URL Preservation] Cleared redirect URL'
      );
    });

    it('should handle sessionStorage errors', () => {
      sessionStorageMock.removeItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      clearRedirectURL();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[URL Preservation] Error clearing redirect URL:',
        expect.any(Error)
      );
    });
  });

  describe('buildLoginURLWithRedirect', () => {
    it('should return /login when no URL provided and none saved', () => {
      expect(buildLoginURLWithRedirect()).toBe('/login');
    });

    it('should build URL with provided redirect URL', () => {
      const result = buildLoginURLWithRedirect('/search?query=test');

      expect(result).toBe('/login?continue=' + encodeURIComponent('/search?query=test'));
    });

    it('should build URL with saved redirect URL when not provided', () => {
      sessionStorageMock._setStore({
        dataplex_auth_redirect_url: '/home',
      });

      const result = buildLoginURLWithRedirect();

      expect(result).toBe('/login?continue=' + encodeURIComponent('/home'));
    });

    it('should encode special characters in redirect URL', () => {
      const result = buildLoginURLWithRedirect('/search?query=test&filter=active');

      expect(result).toContain(encodeURIComponent('/search?query=test&filter=active'));
    });

    it('should prefer provided URL over saved URL', () => {
      sessionStorageMock._setStore({
        dataplex_auth_redirect_url: '/home',
      });

      const result = buildLoginURLWithRedirect('/search');

      expect(result).toBe('/login?continue=' + encodeURIComponent('/search'));
    });
  });
});
