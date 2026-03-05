import { render, screen, fireEvent } from '@testing-library/react';
import UserAccountDropdown from './UserAccountDropdown';
import { AuthContext } from '../../auth/AuthProvider';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';

// --- Mocks ---

// Capture the onSuccess/onError callbacks passed to useGoogleLogin
let capturedGoogleLoginConfig: any = {};
const mockSwitchAccount = vi.fn();
vi.mock('@react-oauth/google', () => ({
  useGoogleLogin: (config: any) => {
    capturedGoogleLoginConfig = config;
    return mockSwitchAccount;
  },
}));

// Allow toggling light/dark mode in tests
let mockMode = 'light';
vi.mock('react-redux', async () => {
  const actual = await vi.importActual('react-redux');
  return {
    ...actual,
    useSelector: (selector: any) => {
      return selector({ user: { mode: mockMode } });
    },
  };
});

// Mock sessionStorage
const mockSessionStorage = {
  removeItem: vi.fn(),
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
});

// Mock window.open
const mockWindowOpen = vi.fn();
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  writable: true,
});

describe('UserAccountDropdown', () => {
  const mockLogin = vi.fn();
  const mockLogout = vi.fn();
  const mockOnClose = vi.fn();

  const baseUser = {
    name: 'John Doe',
    email: 'john.doe@acme.com',
    picture: 'https://example.com/avatar.jpg',
    token: 'test-token',
    tokenExpiry: Math.floor(Date.now() / 1000) + 3600,
    tokenIssuedAt: Math.floor(Date.now() / 1000),
    hasRole: true,
    roles: ['roles/viewer'],
    permissions: ['read'],
    iamDisplayRole: 'Viewer',
    appConfig: {},
  };

  const mockAuthContext = {
    user: baseUser,
    login: mockLogin,
    logout: mockLogout,
    updateUser: vi.fn(),
    silentLogin: vi.fn().mockResolvedValue(true),
  };

  // Create a real anchor element for the Popover
  let anchorEl: HTMLElement;

  beforeEach(() => {
    vi.clearAllMocks();
    mockMode = 'light';
    capturedGoogleLoginConfig = {};
    anchorEl = document.createElement('div');
    document.body.appendChild(anchorEl);
  });

  const renderDropdown = (overrides: any = {}) => {
    const authValue = { ...mockAuthContext, ...overrides.auth };
    return render(
      <AuthContext.Provider value={authValue}>
        <UserAccountDropdown
          anchorEl={overrides.anchorEl !== undefined ? overrides.anchorEl : anchorEl}
          open={overrides.open !== undefined ? overrides.open : true}
          onClose={overrides.onClose || mockOnClose}
        />
      </AuthContext.Provider>
    );
  };

  // --- Rendering tests ---

  describe('rendering', () => {
    it('renders email, greeting, and action buttons when open', () => {
      renderDropdown();

      expect(screen.getByText('john.doe@acme.com')).toBeInTheDocument();
      expect(screen.getByText('Hi, John!')).toBeInTheDocument();
      expect(screen.getByText('Manage your Google Account')).toBeInTheDocument();
      expect(screen.getByText('Switch account')).toBeInTheDocument();
      expect(screen.getByText('Sign out')).toBeInTheDocument();
    });

    it('renders avatar with user picture', () => {
      renderDropdown();

      const avatar = screen.getByAltText('John Doe');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('does not render footer links when feature flag is off', () => {
      renderDropdown();

      expect(screen.queryByText('Privacy Policy')).not.toBeInTheDocument();
      expect(screen.queryByText('Terms of Service')).not.toBeInTheDocument();
      expect(screen.queryByText('·')).not.toBeInTheDocument();
    });
  });

  // --- "Managed by" domain logic ---

  describe('managed domain', () => {
    it('shows "Managed by" for non-gmail domain', () => {
      renderDropdown();
      expect(screen.getByText('Managed by acme.com')).toBeInTheDocument();
    });

    it('does not show "Managed by" for gmail.com', () => {
      renderDropdown({
        auth: { user: { ...baseUser, email: 'user@gmail.com' } },
      });
      expect(screen.queryByText(/Managed by/)).not.toBeInTheDocument();
    });

    it('does not show "Managed by" for googlemail.com', () => {
      renderDropdown({
        auth: { user: { ...baseUser, email: 'user@googlemail.com' } },
      });
      expect(screen.queryByText(/Managed by/)).not.toBeInTheDocument();
    });

    it('does not show "Managed by" when email is undefined', () => {
      renderDropdown({
        auth: { user: { ...baseUser, email: undefined } },
      });
      expect(screen.queryByText(/Managed by/)).not.toBeInTheDocument();
    });
  });

  // --- Avatar initials fallback ---

  describe('avatar initials', () => {
    it('shows two-letter initials for full name when no picture', () => {
      renderDropdown({
        auth: { user: { ...baseUser, picture: '' } },
      });
      // "John Doe" → "JD" rendered inside the Avatar as fallback text
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('shows single initial for single name', () => {
      renderDropdown({
        auth: { user: { ...baseUser, name: 'John', picture: '' } },
      });
      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('shows "?" when name is undefined', () => {
      renderDropdown({
        auth: { user: { ...baseUser, name: undefined, picture: '' } },
      });
      expect(screen.getByText('?')).toBeInTheDocument();
    });

    it('handles multi-word names using first and last initial', () => {
      renderDropdown({
        auth: { user: { ...baseUser, name: 'John Michael Doe', picture: '' } },
      });
      expect(screen.getByText('JD')).toBeInTheDocument();
    });
  });

  // --- Greeting ---

  describe('greeting', () => {
    it('shows sanitized first name in greeting', () => {
      renderDropdown();
      expect(screen.getByText('Hi, John!')).toBeInTheDocument();
    });

    it('shows fallback greeting when name is undefined', () => {
      renderDropdown({
        auth: { user: { ...baseUser, name: undefined } },
      });
      expect(screen.getByText('Hi, there!')).toBeInTheDocument();
    });
  });

  // --- Email display ---

  describe('email display', () => {
    it('shows em dash when email is undefined', () => {
      renderDropdown({
        auth: { user: { ...baseUser, email: undefined } },
      });
      expect(screen.getByText('\u2014')).toBeInTheDocument();
    });
  });

  // --- Interaction tests ---

  describe('interactions', () => {
    it('calls onClose when close button is clicked', () => {
      renderDropdown();

      const closeButton = screen.getByTestId('CloseIcon').closest('button')!;
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls switchAccount when "Switch account" is clicked', () => {
      renderDropdown();

      fireEvent.click(screen.getByText('Switch account'));

      expect(mockSwitchAccount).toHaveBeenCalledTimes(1);
    });

    it('calls logout, removes sessionStorage, and closes on "Sign out" click', () => {
      renderDropdown();

      fireEvent.click(screen.getByText('Sign out'));

      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('welcomeShown');
      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('opens Google account page when "Manage your Google Account" is clicked', () => {
      renderDropdown();

      fireEvent.click(screen.getByText('Manage your Google Account'));

      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://myaccount.google.com',
        '_blank',
        'noopener,noreferrer'
      );
    });
  });

  // --- useGoogleLogin callback coverage ---

  describe('switch account callbacks', () => {
    it('onSuccess calls login with access_token and closes dropdown', async () => {
      renderDropdown();

      await capturedGoogleLoginConfig.onSuccess({ access_token: 'new-token-123' });

      expect(mockLogin).toHaveBeenCalledWith({ credential: 'new-token-123' });
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('onError logs error to console', () => {
      renderDropdown();

      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      capturedGoogleLoginConfig.onError();

      expect(consoleError).toHaveBeenCalledWith('Switch account failed');
      consoleError.mockRestore();
    });

    it('configures useGoogleLogin with correct options', () => {
      renderDropdown();

      expect(capturedGoogleLoginConfig.flow).toBe('implicit');
      expect(capturedGoogleLoginConfig.prompt).toBe('select_account');
      expect(capturedGoogleLoginConfig.scope).toContain('cloud-platform');
      expect(capturedGoogleLoginConfig.scope).toContain('userinfo.profile');
      expect(capturedGoogleLoginConfig.scope).toContain('userinfo.email');
      expect(capturedGoogleLoginConfig.scope).toContain('gmail.send');
    });
  });

  // --- Popover open/close ---

  describe('popover state', () => {
    it('does not render content when open is false', () => {
      renderDropdown({ open: false, anchorEl: null });

      expect(screen.queryByText('Switch account')).not.toBeInTheDocument();
    });
  });

  // --- Dark mode ---

  describe('dark mode', () => {
    it('renders with dark mode colors when mode is dark', () => {
      mockMode = 'dark';
      renderDropdown();

      // Component still renders all elements in dark mode
      expect(screen.getByText('john.doe@acme.com')).toBeInTheDocument();
      expect(screen.getByText('Hi, John!')).toBeInTheDocument();
      expect(screen.getByText('Switch account')).toBeInTheDocument();
      expect(screen.getByText('Sign out')).toBeInTheDocument();
      expect(screen.getByText('Manage your Google Account')).toBeInTheDocument();
    });

    it('still shows "Managed by" in dark mode for non-gmail domain', () => {
      mockMode = 'dark';
      renderDropdown();
      expect(screen.getByText('Managed by acme.com')).toBeInTheDocument();
    });

    it('interactions work in dark mode', () => {
      mockMode = 'dark';
      renderDropdown();

      fireEvent.click(screen.getByText('Sign out'));
      expect(mockLogout).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByText('Switch account'));
      expect(mockSwitchAccount).toHaveBeenCalledTimes(1);
    });
  });

  // --- Null user edge case ---

  describe('null user', () => {
    it('renders gracefully when user is null', () => {
      renderDropdown({
        auth: { user: null },
      });

      expect(screen.getByText('\u2014')).toBeInTheDocument(); // em dash for no email
      expect(screen.getByText('Hi, there!')).toBeInTheDocument(); // fallback greeting
      expect(screen.getByText('?')).toBeInTheDocument(); // fallback initials
      expect(screen.queryByText(/Managed by/)).not.toBeInTheDocument();
    });
  });
});
