import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginV2 from './LoginV2';

// Mock functions using vi.hoisted
const {
  mockLogin,
  mockNavigate,
  mockSearchParamsGet,
  mockGoogleLogin,
  mockSanitizeRedirectURL,
} = vi.hoisted(() => ({
  mockLogin: vi.fn(),
  mockNavigate: vi.fn(),
  mockSearchParamsGet: vi.fn(),
  mockGoogleLogin: vi.fn(),
  mockSanitizeRedirectURL: vi.fn(),
}));

// Capture the useGoogleLogin config to test callbacks
let capturedGoogleLoginConfig: {
  onSuccess?: (tokenResponse: { access_token: string }) => Promise<void>;
  onError?: () => void;
  flow?: string;
  scope?: string;
} = {};

// Mock useAuth hook
vi.mock('../../../auth/AuthProvider', () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
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

// Mock @react-oauth/google
vi.mock('@react-oauth/google', () => ({
  useGoogleLogin: (config: typeof capturedGoogleLoginConfig) => {
    capturedGoogleLoginConfig = config;
    return mockGoogleLogin;
  },
}));

// Mock urlPreservationService
vi.mock('../../../services/urlPreservationService', () => ({
  sanitizeRedirectURL: (url: string) => mockSanitizeRedirectURL(url),
}));

// Mock CSS import
vi.mock('./LoginV2.css', () => ({}));

// Mock asset imports
vi.mock('/assets/svg/knowledge-catalog-logo.svg', () => ({
  default: '/assets/svg/knowledge-catalog-logo.svg',
}));
vi.mock('/assets/images/google-logo-figma-53c44d.png', () => ({
  default: '/assets/images/google-logo-figma-53c44d.png',
}));

describe('LoginV2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedGoogleLoginConfig = {};
    mockLogin.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('rendering', () => {
    it('should render the login page with all elements', () => {
      render(<LoginV2 />);

      // Check for logo
      const logo = screen.getByAltText('Knowledge Catalog');
      expect(logo).toBeInTheDocument();

      // Check for text elements
      expect(screen.getByText('Your gateway to data discovery')).toBeInTheDocument();
      expect(screen.getByText('Discover, understand, and govern all your data assets in one unified catalog')).toBeInTheDocument();

      // Check for right panel text
      expect(screen.getByText('GET STARTED')).toBeInTheDocument();
      expect(screen.getByText('Sign in with Google to continue')).toBeInTheDocument();

      // Check for login button
      const loginButton = screen.getByRole('button');
      expect(loginButton).toBeInTheDocument();
      expect(screen.getByText('Continue with Google')).toBeInTheDocument();

      // Check for Google icon
      const googleIcon = screen.getByAltText('Google Icon');
      expect(googleIcon).toBeInTheDocument();
    });

    it('should render the card layout structure', () => {
      const { container } = render(<LoginV2 />);

      expect(container.querySelector('.loginv2-page')).toBeInTheDocument();
      expect(container.querySelector('.loginv2-card')).toBeInTheDocument();
      expect(container.querySelector('.loginv2-left')).toBeInTheDocument();
      expect(container.querySelector('.loginv2-right')).toBeInTheDocument();
      expect(container.querySelector('.loginv2-right-content')).toBeInTheDocument();
    });

    it('should render gradient orbs in the right panel', () => {
      const { container } = render(<LoginV2 />);

      expect(container.querySelector('.loginv2-gradient-orb-1')).toBeInTheDocument();
      expect(container.querySelector('.loginv2-gradient-orb-2')).toBeInTheDocument();
      expect(container.querySelector('.loginv2-gradient-orb-3')).toBeInTheDocument();
    });

    it('should render with correct styling classes', () => {
      const { container } = render(<LoginV2 />);

      expect(container.querySelector('.loginv2-logo')).toBeInTheDocument();
      expect(container.querySelector('.loginv2-heading')).toBeInTheDocument();
      expect(container.querySelector('.loginv2-body')).toBeInTheDocument();
      expect(container.querySelector('.loginv2-get-started')).toBeInTheDocument();
      expect(container.querySelector('.loginv2-signin-heading')).toBeInTheDocument();
      expect(container.querySelector('.loginv2-button')).toBeInTheDocument();
      expect(container.querySelector('.loginv2-google-icon')).toBeInTheDocument();
      expect(container.querySelector('.loginv2-button-text')).toBeInTheDocument();
    });

    it('should not show loading state initially', () => {
      render(<LoginV2 />);

      expect(screen.queryByText('Signing you in...')).not.toBeInTheDocument();
      expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('should show loading state during login', async () => {
      // Make login hang so we can observe the loading state
      mockLogin.mockImplementation(() => new Promise(() => {}));
      mockSearchParamsGet.mockReturnValue(null);

      render(<LoginV2 />);

      await act(async () => {
        capturedGoogleLoginConfig.onSuccess?.({ access_token: 'test-token' });
      });

      expect(screen.getByText('Signing you in...')).toBeInTheDocument();
      expect(screen.queryByText('Continue with Google')).not.toBeInTheDocument();
      expect(screen.queryByText('GET STARTED')).not.toBeInTheDocument();
    });

    it('should hide login button when loading', async () => {
      mockLogin.mockImplementation(() => new Promise(() => {}));

      render(<LoginV2 />);

      await act(async () => {
        capturedGoogleLoginConfig.onSuccess?.({ access_token: 'test-token' });
      });

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should reset loading state on login failure', async () => {
      mockLogin.mockRejectedValue(new Error('Login failed'));
      mockSearchParamsGet.mockReturnValue(null);

      render(<LoginV2 />);

      await act(async () => {
        await capturedGoogleLoginConfig.onSuccess?.({ access_token: 'test-token' });
      });

      await waitFor(() => {
        expect(screen.getByText('Continue with Google')).toBeInTheDocument();
      });
      expect(screen.queryByText('Signing you in...')).not.toBeInTheDocument();
    });
  });

  describe('Google login button', () => {
    it('should call googleLogin when button is clicked', async () => {
      const user = userEvent.setup();
      render(<LoginV2 />);

      const loginButton = screen.getByRole('button');
      await user.click(loginButton);

      expect(mockGoogleLogin).toHaveBeenCalledTimes(1);
    });

    it('should call googleLogin on multiple clicks', async () => {
      const user = userEvent.setup();
      render(<LoginV2 />);

      const loginButton = screen.getByRole('button');
      await user.click(loginButton);
      await user.click(loginButton);
      await user.click(loginButton);

      expect(mockGoogleLogin).toHaveBeenCalledTimes(3);
    });

    it('should configure useGoogleLogin with correct flow', () => {
      render(<LoginV2 />);

      expect(capturedGoogleLoginConfig.flow).toBe('implicit');
    });

    it('should configure useGoogleLogin with correct scopes', () => {
      render(<LoginV2 />);

      expect(capturedGoogleLoginConfig.scope).toContain('https://www.googleapis.com/auth/cloud-platform');
      expect(capturedGoogleLoginConfig.scope).toContain('https://www.googleapis.com/auth/userinfo.profile');
      expect(capturedGoogleLoginConfig.scope).toContain('https://www.googleapis.com/auth/userinfo.email');
      expect(capturedGoogleLoginConfig.scope).toContain('https://www.googleapis.com/auth/gmail.send');
    });
  });

  describe('onSuccess callback', () => {
    it('should call login with access_token on successful Google auth', async () => {
      render(<LoginV2 />);

      const tokenResponse = { access_token: 'test-access-token-123' };
      await act(async () => {
        await capturedGoogleLoginConfig.onSuccess?.(tokenResponse);
      });

      expect(mockLogin).toHaveBeenCalledWith({
        credential: 'test-access-token-123',
      });
    });

    it('should redirect to sanitized continue URL when provided', async () => {
      mockSearchParamsGet.mockReturnValue('/dashboard');
      mockSanitizeRedirectURL.mockReturnValue('/dashboard');

      const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

      render(<LoginV2 />);

      const tokenResponse = { access_token: 'test-token' };
      await act(async () => {
        await capturedGoogleLoginConfig.onSuccess?.(tokenResponse);
      });

      expect(mockSanitizeRedirectURL).toHaveBeenCalledWith('/dashboard');
      expect(consoleLog).toHaveBeenCalledWith('[Login] Redirecting to:', '/dashboard');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });

      consoleLog.mockRestore();
    });

    it('should redirect to /home when no continue param', async () => {
      mockSearchParamsGet.mockReturnValue(null);

      render(<LoginV2 />);

      const tokenResponse = { access_token: 'test-token' };
      await act(async () => {
        await capturedGoogleLoginConfig.onSuccess?.(tokenResponse);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/home', { replace: true });
    });

    it('should redirect to /home when continue param is invalid', async () => {
      mockSearchParamsGet.mockReturnValue('/malicious-url');
      mockSanitizeRedirectURL.mockReturnValue(null);

      render(<LoginV2 />);

      const tokenResponse = { access_token: 'test-token' };
      await act(async () => {
        await capturedGoogleLoginConfig.onSuccess?.(tokenResponse);
      });

      expect(mockSanitizeRedirectURL).toHaveBeenCalledWith('/malicious-url');
      expect(mockNavigate).toHaveBeenCalledWith('/home', { replace: true });
    });

    it('should redirect to /home when sanitized URL is empty string', async () => {
      mockSearchParamsGet.mockReturnValue('/some-url');
      mockSanitizeRedirectURL.mockReturnValue('');

      render(<LoginV2 />);

      const tokenResponse = { access_token: 'test-token' };
      await act(async () => {
        await capturedGoogleLoginConfig.onSuccess?.(tokenResponse);
      });

      // Empty string is falsy, so it should redirect to /home
      expect(mockNavigate).toHaveBeenCalledWith('/home', { replace: true });
    });

    it('should handle various redirect URLs', async () => {
      const testCases = [
        { continueParam: '/settings', sanitized: '/settings' },
        { continueParam: '/profile/edit', sanitized: '/profile/edit' },
        { continueParam: '/search?q=test', sanitized: '/search?q=test' },
        { continueParam: '/page#section', sanitized: '/page#section' },
      ];

      for (const { continueParam, sanitized } of testCases) {
        vi.clearAllMocks();
        mockSearchParamsGet.mockReturnValue(continueParam);
        mockSanitizeRedirectURL.mockReturnValue(sanitized);
        mockLogin.mockResolvedValue(undefined);

        const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

        render(<LoginV2 />);

        const tokenResponse = { access_token: 'test-token' };
        await act(async () => {
          await capturedGoogleLoginConfig.onSuccess?.(tokenResponse);
        });

        expect(mockNavigate).toHaveBeenCalledWith(sanitized, { replace: true });

        consoleLog.mockRestore();
      }
    });

    it('should await login before navigating', async () => {
      let loginResolved = false;
      let resolveLogin: () => void;
      mockLogin.mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolveLogin = resolve;
          })
      );

      mockSearchParamsGet.mockReturnValue(null);

      render(<LoginV2 />);

      await act(async () => {
        capturedGoogleLoginConfig.onSuccess?.({ access_token: 'test-token' });
      });

      // Login is still pending, navigate should not have been called yet
      expect(mockNavigate).not.toHaveBeenCalled();

      await act(async () => {
        loginResolved = true;
        resolveLogin!();
      });

      // Now navigate should have been called
      expect(loginResolved).toBe(true);
      expect(mockNavigate).toHaveBeenCalledWith('/home', { replace: true });
    });
  });

  describe('onError callback', () => {
    it('should log error message on Google login failure', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<LoginV2 />);

      capturedGoogleLoginConfig.onError?.();

      expect(consoleError).toHaveBeenCalledWith('Google Login Failed');

      consoleError.mockRestore();
    });

    it('should handle error callback being called multiple times', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<LoginV2 />);

      capturedGoogleLoginConfig.onError?.();
      capturedGoogleLoginConfig.onError?.();
      capturedGoogleLoginConfig.onError?.();

      expect(consoleError).toHaveBeenCalledTimes(3);

      consoleError.mockRestore();
    });
  });

  describe('hook integration', () => {
    it('should use useAuth hook to get login function', async () => {
      render(<LoginV2 />);

      await act(async () => {
        await capturedGoogleLoginConfig.onSuccess?.({ access_token: 'token' });
      });

      expect(mockLogin).toHaveBeenCalled();
    });

    it('should use useNavigate for navigation', async () => {
      mockSearchParamsGet.mockReturnValue(null);

      render(<LoginV2 />);

      await act(async () => {
        await capturedGoogleLoginConfig.onSuccess?.({ access_token: 'token' });
      });

      expect(mockNavigate).toHaveBeenCalled();
    });

    it('should use useSearchParams to get continue param', async () => {
      mockSearchParamsGet.mockReturnValue('/custom-path');
      mockSanitizeRedirectURL.mockReturnValue('/custom-path');

      const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

      render(<LoginV2 />);

      await act(async () => {
        await capturedGoogleLoginConfig.onSuccess?.({ access_token: 'token' });
      });

      expect(mockSearchParamsGet).toHaveBeenCalledWith('continue');

      consoleLog.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('should handle login function rejection gracefully', async () => {
      mockLogin.mockRejectedValue(new Error('Login failed'));
      mockSearchParamsGet.mockReturnValue(null);

      render(<LoginV2 />);

      // LoginV2 has error handling (catch block resets loading), so it should not throw
      await act(async () => {
        await capturedGoogleLoginConfig.onSuccess?.({ access_token: 'token' });
      });

      // Should not navigate on failure
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should render correctly after re-render', () => {
      const { rerender } = render(<LoginV2 />);

      expect(screen.getByText('Continue with Google')).toBeInTheDocument();

      rerender(<LoginV2 />);

      expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    });

    it('should maintain button functionality after multiple renders', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<LoginV2 />);

      const loginButton = screen.getByRole('button');
      await user.click(loginButton);

      expect(mockGoogleLogin).toHaveBeenCalledTimes(1);

      rerender(<LoginV2 />);

      const loginButtonAfterRerender = screen.getByRole('button');
      await user.click(loginButtonAfterRerender);

      expect(mockGoogleLogin).toHaveBeenCalledTimes(2);
    });
  });

  describe('accessibility', () => {
    it('should have accessible button', () => {
      render(<LoginV2 />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should have alt text for all images', () => {
      render(<LoginV2 />);

      const images = screen.getAllByRole('img');
      images.forEach((img) => {
        expect(img).toHaveAttribute('alt');
        expect(img.getAttribute('alt')).not.toBe('');
      });
    });

    it('should have two images (logo and Google icon)', () => {
      render(<LoginV2 />);

      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(2);
    });

    it('should have proper heading hierarchy', () => {
      render(<LoginV2 />);

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('Your gateway to data discovery');

      const h2 = screen.getByRole('heading', { level: 2 });
      expect(h2).toHaveTextContent('Sign in with Google to continue');
    });
  });

  describe('default export', () => {
    it('should export LoginV2 as default', async () => {
      const module = await import('./LoginV2');
      expect(module.default).toBeDefined();
    });
  });
});
