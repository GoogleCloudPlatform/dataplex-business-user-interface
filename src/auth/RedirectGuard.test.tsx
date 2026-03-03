import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RedirectGuard } from './RedirectGuard';

// Mock functions using vi.hoisted
const {
  mockNavigate,
  mockGetRedirectURL,
  mockClearRedirectURL,
  mockSanitizeRedirectURL,
  mockSearchParamsGet,
} = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockGetRedirectURL: vi.fn(),
  mockClearRedirectURL: vi.fn(),
  mockSanitizeRedirectURL: vi.fn(),
  mockSearchParamsGet: vi.fn(),
}));

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [
    {
      get: mockSearchParamsGet,
    },
  ],
}));

// Mock urlPreservationService
vi.mock('../services/urlPreservationService', () => ({
  getRedirectURL: () => mockGetRedirectURL(),
  clearRedirectURL: () => mockClearRedirectURL(),
  sanitizeRedirectURL: (url: string) => mockSanitizeRedirectURL(url),
}));

describe('RedirectGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('rendering', () => {
    it('should render children when not authenticated', () => {
      mockSearchParamsGet.mockReturnValue(null);
      mockGetRedirectURL.mockReturnValue(null);

      render(
        <RedirectGuard isAuthenticated={false}>
          <div data-testid="child-content">Child Content</div>
        </RedirectGuard>
      );

      expect(screen.getByTestId('child-content')).toBeInTheDocument();
      expect(screen.getByText('Child Content')).toBeInTheDocument();
    });

    it('should render children when authenticated', () => {
      mockSearchParamsGet.mockReturnValue(null);
      mockGetRedirectURL.mockReturnValue(null);

      render(
        <RedirectGuard isAuthenticated={true}>
          <div data-testid="child-content">Authenticated Content</div>
        </RedirectGuard>
      );

      expect(screen.getByTestId('child-content')).toBeInTheDocument();
      expect(screen.getByText('Authenticated Content')).toBeInTheDocument();
    });

    it('should render complex children', () => {
      mockSearchParamsGet.mockReturnValue(null);
      mockGetRedirectURL.mockReturnValue(null);

      render(
        <RedirectGuard isAuthenticated={true}>
          <div data-testid="complex-content">
            <h1>Login Page</h1>
            <form>
              <input type="text" placeholder="Username" />
              <button type="submit">Login</button>
            </form>
          </div>
        </RedirectGuard>
      );

      expect(screen.getByTestId('complex-content')).toBeInTheDocument();
      expect(screen.getByText('Login Page')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
    });
  });

  describe('when not authenticated', () => {
    it('should not navigate when not authenticated', () => {
      mockSearchParamsGet.mockReturnValue('/dashboard');
      mockGetRedirectURL.mockReturnValue('/settings');

      render(
        <RedirectGuard isAuthenticated={false}>
          <div>Child</div>
        </RedirectGuard>
      );

      expect(mockNavigate).not.toHaveBeenCalled();
      expect(mockClearRedirectURL).not.toHaveBeenCalled();
    });

    it('should not check redirect URL when not authenticated', () => {
      mockSearchParamsGet.mockReturnValue(null);
      mockGetRedirectURL.mockReturnValue('/saved-url');

      render(
        <RedirectGuard isAuthenticated={false}>
          <div>Child</div>
        </RedirectGuard>
      );

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('continue query parameter redirect', () => {
    it('should redirect to sanitized continue param when authenticated', () => {
      mockSearchParamsGet.mockReturnValue('/dashboard');
      mockSanitizeRedirectURL.mockReturnValue('/dashboard');

      const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

      render(
        <RedirectGuard isAuthenticated={true}>
          <div>Child</div>
        </RedirectGuard>
      );

      expect(mockSanitizeRedirectURL).toHaveBeenCalledWith('/dashboard');
      expect(mockClearRedirectURL).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
      expect(consoleLog).toHaveBeenCalledWith(
        '[RedirectGuard] Redirecting to query param URL:',
        '/dashboard'
      );

      consoleLog.mockRestore();
    });

    it('should not redirect when continue param is sanitized to null', () => {
      mockSearchParamsGet.mockReturnValue('/malicious-url');
      mockSanitizeRedirectURL.mockReturnValue(null);
      mockGetRedirectURL.mockReturnValue(null);

      render(
        <RedirectGuard isAuthenticated={true}>
          <div>Child</div>
        </RedirectGuard>
      );

      expect(mockSanitizeRedirectURL).toHaveBeenCalledWith('/malicious-url');
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should not redirect when continue param is sanitized to empty string', () => {
      mockSearchParamsGet.mockReturnValue('');
      mockSanitizeRedirectURL.mockReturnValue('');
      mockGetRedirectURL.mockReturnValue(null);

      render(
        <RedirectGuard isAuthenticated={true}>
          <div>Child</div>
        </RedirectGuard>
      );

      // Empty string is falsy, so navigate should not be called
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should clear sessionStorage when redirecting via query param', () => {
      mockSearchParamsGet.mockReturnValue('/profile');
      mockSanitizeRedirectURL.mockReturnValue('/profile');

      const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

      render(
        <RedirectGuard isAuthenticated={true}>
          <div>Child</div>
        </RedirectGuard>
      );

      expect(mockClearRedirectURL).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/profile', { replace: true });

      consoleLog.mockRestore();
    });

    it('should prioritize continue param over saved URL', () => {
      mockSearchParamsGet.mockReturnValue('/from-query');
      mockSanitizeRedirectURL.mockReturnValue('/from-query');
      mockGetRedirectURL.mockReturnValue('/from-storage');

      const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

      render(
        <RedirectGuard isAuthenticated={true}>
          <div>Child</div>
        </RedirectGuard>
      );

      expect(mockNavigate).toHaveBeenCalledWith('/from-query', { replace: true });
      expect(mockNavigate).toHaveBeenCalledTimes(1);

      consoleLog.mockRestore();
    });
  });

  describe('sessionStorage redirect', () => {
    it('should redirect to saved URL when no continue param and authenticated', () => {
      mockSearchParamsGet.mockReturnValue(null);
      mockGetRedirectURL.mockReturnValue('/saved-dashboard');

      const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

      render(
        <RedirectGuard isAuthenticated={true}>
          <div>Child</div>
        </RedirectGuard>
      );

      expect(mockGetRedirectURL).toHaveBeenCalled();
      expect(mockClearRedirectURL).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/saved-dashboard', { replace: true });
      expect(consoleLog).toHaveBeenCalledWith(
        '[RedirectGuard] Redirecting to saved URL:',
        '/saved-dashboard'
      );

      consoleLog.mockRestore();
    });

    it('should not redirect when no saved URL and no continue param', () => {
      mockSearchParamsGet.mockReturnValue(null);
      mockGetRedirectURL.mockReturnValue(null);

      render(
        <RedirectGuard isAuthenticated={true}>
          <div>Child</div>
        </RedirectGuard>
      );

      expect(mockNavigate).not.toHaveBeenCalled();
      expect(mockClearRedirectURL).not.toHaveBeenCalled();
    });

    it('should not redirect when saved URL is empty string', () => {
      mockSearchParamsGet.mockReturnValue(null);
      mockGetRedirectURL.mockReturnValue('');

      render(
        <RedirectGuard isAuthenticated={true}>
          <div>Child</div>
        </RedirectGuard>
      );

      // Empty string is falsy, so navigate should not be called
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should fallback to saved URL when continue param is invalid', () => {
      mockSearchParamsGet.mockReturnValue('/invalid');
      mockSanitizeRedirectURL.mockReturnValue(null);
      mockGetRedirectURL.mockReturnValue('/valid-saved-url');

      const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

      render(
        <RedirectGuard isAuthenticated={true}>
          <div>Child</div>
        </RedirectGuard>
      );

      expect(mockSanitizeRedirectURL).toHaveBeenCalledWith('/invalid');
      expect(mockGetRedirectURL).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/valid-saved-url', { replace: true });

      consoleLog.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('should handle authentication state change', () => {
      mockSearchParamsGet.mockReturnValue(null);
      mockGetRedirectURL.mockReturnValue('/redirect-path');

      const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

      const { rerender } = render(
        <RedirectGuard isAuthenticated={false}>
          <div>Child</div>
        </RedirectGuard>
      );

      expect(mockNavigate).not.toHaveBeenCalled();

      // Simulate authentication
      rerender(
        <RedirectGuard isAuthenticated={true}>
          <div>Child</div>
        </RedirectGuard>
      );

      expect(mockNavigate).toHaveBeenCalledWith('/redirect-path', { replace: true });

      consoleLog.mockRestore();
    });

    it('should handle various URL formats in continue param', () => {
      const testCases = [
        { input: '/simple-path', sanitized: '/simple-path' },
        { input: '/path/with/segments', sanitized: '/path/with/segments' },
        { input: '/path?query=value', sanitized: '/path?query=value' },
        { input: '/path#hash', sanitized: '/path#hash' },
      ];

      const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

      testCases.forEach(({ input, sanitized }) => {
        vi.clearAllMocks();
        mockSearchParamsGet.mockReturnValue(input);
        mockSanitizeRedirectURL.mockReturnValue(sanitized);

        render(
          <RedirectGuard isAuthenticated={true}>
            <div>Child</div>
          </RedirectGuard>
        );

        expect(mockNavigate).toHaveBeenCalledWith(sanitized, { replace: true });
      });

      consoleLog.mockRestore();
    });

    it('should use replace: true to prevent back button issues', () => {
      mockSearchParamsGet.mockReturnValue('/target');
      mockSanitizeRedirectURL.mockReturnValue('/target');

      const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

      render(
        <RedirectGuard isAuthenticated={true}>
          <div>Child</div>
        </RedirectGuard>
      );

      expect(mockNavigate).toHaveBeenCalledWith('/target', { replace: true });
      const callArgs = mockNavigate.mock.calls[0];
      expect(callArgs[1]).toEqual({ replace: true });

      consoleLog.mockRestore();
    });
  });

  describe('default export', () => {
    it('should export RedirectGuard as default', async () => {
      const module = await import('./RedirectGuard');
      expect(module.default).toBe(module.RedirectGuard);
    });
  });
});
