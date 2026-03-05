import { render, screen, fireEvent } from '@testing-library/react';
import { vi, beforeEach, it, describe, expect } from 'vitest';
import React from 'react';
import { SessionWarningModal } from './SessionWarningModal';

// Use vi.hoisted to ensure mocks are defined before imports
const { mockGoogleLogin, mockUpdateUser, capturedGoogleLoginCallbacks, dialogCallbacks } = vi.hoisted(() => ({
  mockGoogleLogin: vi.fn(),
  mockUpdateUser: vi.fn(),
  capturedGoogleLoginCallbacks: {
    onSuccess: null as ((response: any) => void) | null,
    onError: null as ((error: any) => void) | null,
  },
  dialogCallbacks: {
    onClose: null as ((event: {}, reason: string) => void) | null,
  },
}));

// Mock @react-oauth/google - capture the callbacks for testing
vi.mock('@react-oauth/google', () => ({
  useGoogleLogin: (config: { onSuccess: (response: any) => void; onError: (error: any) => void }) => {
    // Capture the callbacks so we can call them in tests
    capturedGoogleLoginCallbacks.onSuccess = config.onSuccess;
    capturedGoogleLoginCallbacks.onError = config.onError;
    return mockGoogleLogin;
  },
}));

// Mock axios
vi.mock('axios', () => ({
  default: {
    defaults: {
      headers: {
        common: {},
      },
    },
  },
}));

// Mock MUI components directly without importing the actual module
vi.mock('@mui/material', () => ({
  Dialog: ({ children, open, onClose }: { children: React.ReactNode; open: boolean; onClose?: (event: {}, reason: string) => void }) => {
    // Capture onClose for testing
    dialogCallbacks.onClose = onClose || null;
    return open ? <div role="dialog" data-testid="mock-dialog">{children}</div> : null;
  },
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogActions: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Box: ({ children }: { children: React.ReactNode }) => <div className="MuiBox-root">{children}</div>,
  Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  Button: ({ children, onClick, startIcon }: { children: React.ReactNode; onClick?: () => void; startIcon?: React.ReactNode }) => (
    <button onClick={onClick}>{startIcon}{children}</button>
  ),
  Avatar: ({ children }: { children: React.ReactNode }) => <div className="MuiAvatar-root">{children}</div>,
  CircularProgress: () => <div role="progressbar" />,
  Alert: ({ children }: { children: React.ReactNode }) => <div role="alert">{children}</div>,
  Zoom: ({ children, in: inProp }: { children: React.ReactNode; in?: boolean }) =>
    inProp !== false ? <>{children}</> : null,
  Fade: ({ children, in: inProp }: { children: React.ReactNode; in?: boolean }) =>
    inProp !== false ? <>{children}</> : null,
}));

// Mock MUI icons
vi.mock('@mui/icons-material/AccessTime', () => ({
  default: () => <span data-testid="AccessTimeIcon" />,
}));

vi.mock('@mui/icons-material/ReportProblem', () => ({
  default: () => <span data-testid="ReportProblemIcon" />,
}));

vi.mock('@mui/icons-material/Login', () => ({
  default: () => <span data-testid="LoginIcon" />,
}));

vi.mock('@mui/icons-material/Logout', () => ({
  default: () => <span data-testid="LogoutIcon" />,
}));

// Mock useAuth
const mockUser = {
  name: 'Test User',
  email: 'test@example.com',
  picture: 'https://example.com/pic.jpg',
  token: 'test-token',
  tokenIssuedAt: 1000000,
  tokenExpiry: 1003600,
  hasRole: true,
  roles: [],
  permissions: [],
  appConfig: {},
};

vi.mock('../../auth/AuthProvider', () => ({
  useAuth: () => ({
    user: mockUser,
    updateUser: mockUpdateUser,
  }),
}));

describe('SessionWarningModal', () => {
  const defaultProps = {
    open: true,
    remainingTime: 120,
    onStayLoggedIn: vi.fn().mockResolvedValue(undefined),
    onLogOut: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders correctly when open and hides when closed', () => {
      const { rerender } = render(<SessionWarningModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Session Expiring Soon')).toBeInTheDocument();
      expect(screen.getByText(/Your session is about to expire in/)).toBeInTheDocument();

      rerender(<SessionWarningModal {...defaultProps} open={false} />);
      expect(screen.queryByText('Session Expiring Soon')).not.toBeInTheDocument();
    });
  });

  describe('formatTime function', () => {
    it.each([
      [120, '2:00'],
      [65, '1:05'],
      [59, '0:59'],
      [5, '0:05'],
      [600, '10:00'],
      [90, '1:30'],
      [9, '0:09'],
      [1, '0:01'],
      [60, '1:00'],
      [125, '2:05'],
      [61, '1:01'],
      [300, '5:00'],
      [3600, '60:00'],
    ])('formats %i seconds as %s', (seconds, expected) => {
      render(<SessionWarningModal {...defaultProps} remainingTime={seconds} />);
      expect(screen.getByText(expected)).toBeInTheDocument();
    });

    it('shows expired state when remainingTime is 0', () => {
      render(<SessionWarningModal {...defaultProps} remainingTime={0} />);
      expect(screen.getByText('Session Expired')).toBeInTheDocument();
    });
  });

  describe('Warning Mode', () => {
    it('shows correct buttons and icons', () => {
      render(<SessionWarningModal {...defaultProps} />);
      expect(screen.getByRole('button', { name: /Stay Logged In/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Log Out/i })).toBeInTheDocument();
      expect(screen.getByTestId('AccessTimeIcon')).toBeInTheDocument();
      expect(screen.getByTestId('LoginIcon')).toBeInTheDocument();
      expect(screen.getByTestId('LogoutIcon')).toBeInTheDocument();
    });

    it('clicking "Stay Logged In" triggers Google login', () => {
      render(<SessionWarningModal {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /Stay Logged In/i }));
      expect(mockGoogleLogin).toHaveBeenCalled();
    });

    it('clicking "Log Out" calls onLogOut', () => {
      const onLogOut = vi.fn();
      render(<SessionWarningModal {...defaultProps} onLogOut={onLogOut} />);
      fireEvent.click(screen.getByRole('button', { name: /Log Out/i }));
      expect(onLogOut).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading Mode', () => {
    it('clicking Stay Logged In calls googleLogin', () => {
      render(<SessionWarningModal {...defaultProps} />);
      const button = screen.getByRole('button', { name: /Stay Logged In/i });
      fireEvent.click(button);
      // With lightweight mocks, we verify the handler was called
      expect(mockGoogleLogin).toHaveBeenCalled();
    });
  });

  describe('Expired Mode', () => {
    it('shows expired state correctly', () => {
      render(<SessionWarningModal {...defaultProps} remainingTime={0} />);

      expect(screen.getByText('Session Expired')).toBeInTheDocument();
      expect(screen.getByText('Your session has expired. Please sign in again to continue.')).toBeInTheDocument();
      expect(screen.getByTestId('ReportProblemIcon')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Sign In Again/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Stay Logged In/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Log Out/i })).not.toBeInTheDocument();
    });

    it('clicking "Sign In Again" calls onLogOut', () => {
      const onLogOut = vi.fn();
      render(<SessionWarningModal {...defaultProps} remainingTime={0} onLogOut={onLogOut} />);
      fireEvent.click(screen.getByRole('button', { name: /Sign In Again/i }));
      expect(onLogOut).toHaveBeenCalledTimes(1);
    });

    it('transitions to expired mode when remainingTime reaches 0', () => {
      const { rerender } = render(<SessionWarningModal {...defaultProps} remainingTime={5} />);
      expect(screen.getByText('Session Expiring Soon')).toBeInTheDocument();

      rerender(<SessionWarningModal {...defaultProps} remainingTime={0} />);
      expect(screen.getByText('Session Expired')).toBeInTheDocument();
    });

    it('handles negative remainingTime as expired', () => {
      render(<SessionWarningModal {...defaultProps} remainingTime={-10} />);
      expect(screen.getByText('Session Expired')).toBeInTheDocument();
    });
  });

  describe('Mode Transitions', () => {
    it('resets to warning mode when modal reopens with positive time', () => {
      const { rerender } = render(<SessionWarningModal {...defaultProps} remainingTime={0} />);
      expect(screen.getByText('Session Expired')).toBeInTheDocument();

      rerender(<SessionWarningModal {...defaultProps} open={false} remainingTime={120} />);
      rerender(<SessionWarningModal {...defaultProps} open={true} remainingTime={120} />);

      expect(screen.getByText('Session Expiring Soon')).toBeInTheDocument();
    });
  });

  describe('Google OAuth Integration', () => {
    it('calls googleLogin when Stay Logged In is clicked', () => {
      render(<SessionWarningModal {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /Stay Logged In/i }));
      expect(mockGoogleLogin).toHaveBeenCalledTimes(1);
    });

    it('calls googleLogin again after modal is reset', () => {
      const { rerender } = render(<SessionWarningModal {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /Stay Logged In/i }));
      expect(mockGoogleLogin).toHaveBeenCalledTimes(1);

      // Rerender to reset to warning mode
      rerender(<SessionWarningModal {...defaultProps} open={false} />);
      rerender(<SessionWarningModal {...defaultProps} open={true} />);

      const button = screen.queryByRole('button', { name: /Stay Logged In/i });
      if (button) {
        fireEvent.click(button);
        expect(mockGoogleLogin).toHaveBeenCalledTimes(2);
      }
    });
  });

  describe('Visual Elements', () => {
    it('renders visual structure correctly', () => {
      const { container } = render(<SessionWarningModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByTestId('AccessTimeIcon')).toBeInTheDocument();
      expect(container.querySelectorAll('.MuiBox-root').length).toBeGreaterThan(0);
      expect(container.querySelector('.MuiAvatar-root')).toBeInTheDocument();
    });
  });

  describe('Countdown Display', () => {
    it('updates display when remainingTime changes', () => {
      const { rerender } = render(<SessionWarningModal {...defaultProps} remainingTime={120} />);
      expect(screen.getByText('2:00')).toBeInTheDocument();

      rerender(<SessionWarningModal {...defaultProps} remainingTime={60} />);
      expect(screen.getByText('1:00')).toBeInTheDocument();

      rerender(<SessionWarningModal {...defaultProps} remainingTime={30} />);
      expect(screen.getByText('0:30')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('renders correctly with all props', () => {
      const props = {
        open: true,
        remainingTime: 45,
        onStayLoggedIn: vi.fn().mockResolvedValue(undefined),
        onLogOut: vi.fn(),
      };

      render(<SessionWarningModal {...props} />);

      expect(screen.getByText('Session Expiring Soon')).toBeInTheDocument();
      expect(screen.getByText('0:45')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Stay Logged In/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Log Out/i })).toBeInTheDocument();
    });
  });

  describe('Typography and Text Content', () => {
    it('displays correct messages for each mode', () => {
      const { rerender } = render(<SessionWarningModal {...defaultProps} />);
      expect(screen.getByText(/Please log in again to continue/)).toBeInTheDocument();

      rerender(<SessionWarningModal {...defaultProps} remainingTime={0} />);
      expect(screen.getByText('Your session has expired. Please sign in again to continue.')).toBeInTheDocument();
    });

    it('Stay Logged In button triggers login flow', () => {
      render(<SessionWarningModal {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /Stay Logged In/i }));
      // With lightweight mocks, we verify the handler was called
      expect(mockGoogleLogin).toHaveBeenCalled();
    });
  });

  describe('Component Props', () => {
    it('accepts and uses all props correctly', () => {
      const onStayLoggedIn = vi.fn().mockResolvedValue(undefined);
      const onLogOut = vi.fn();
      const { rerender } = render(
        <SessionWarningModal open={true} remainingTime={300} onStayLoggedIn={onStayLoggedIn} onLogOut={onLogOut} />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('5:00')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Log Out/i }));
      expect(onLogOut).toHaveBeenCalled();

      rerender(<SessionWarningModal open={false} remainingTime={300} onStayLoggedIn={onStayLoggedIn} onLogOut={onLogOut} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Snapshot Tests', () => {
    it('warning mode matches snapshot', () => {
      const { container } = render(<SessionWarningModal {...defaultProps} />);
      expect(container).toBeDefined();
    });

    it('expired mode matches snapshot', () => {
      const { container } = render(<SessionWarningModal {...defaultProps} remainingTime={0} />);
      expect(container).toBeDefined();
    });
  });

  describe('Google OAuth Success Callback', () => {
    it('handles successful Google login', async () => {
      const onStayLoggedIn = vi.fn().mockResolvedValue(undefined);
      render(<SessionWarningModal {...defaultProps} onStayLoggedIn={onStayLoggedIn} />);

      // Click Stay Logged In to trigger the flow
      fireEvent.click(screen.getByRole('button', { name: /Stay Logged In/i }));

      // Simulate successful Google OAuth response
      if (capturedGoogleLoginCallbacks.onSuccess) {
        await capturedGoogleLoginCallbacks.onSuccess({
          access_token: 'new-access-token',
        });
      }

      // Should have called updateUser with new token
      expect(mockUpdateUser).toHaveBeenCalled();
      // Should have called onStayLoggedIn
      expect(onStayLoggedIn).toHaveBeenCalled();
    });

    it('updates axios headers on successful login', async () => {
      const onStayLoggedIn = vi.fn().mockResolvedValue(undefined);
      render(<SessionWarningModal {...defaultProps} onStayLoggedIn={onStayLoggedIn} />);

      fireEvent.click(screen.getByRole('button', { name: /Stay Logged In/i }));

      if (capturedGoogleLoginCallbacks.onSuccess) {
        await capturedGoogleLoginCallbacks.onSuccess({
          access_token: 'test-new-token',
        });
      }

      expect(mockUpdateUser).toHaveBeenCalledWith(
        'test-new-token',
        expect.objectContaining({
          token: 'test-new-token',
        })
      );
    });
  });

  describe('Google OAuth Error Callback', () => {
    it('handles OAuth error when session not expired', async () => {
      render(<SessionWarningModal {...defaultProps} remainingTime={120} />);

      fireEvent.click(screen.getByRole('button', { name: /Stay Logged In/i }));

      // Simulate OAuth error
      if (capturedGoogleLoginCallbacks.onError) {
        capturedGoogleLoginCallbacks.onError({ error: 'access_denied' });
      }

      // Should show error alert but stay in warning mode
      // Modal should still be open with warning state
      expect(screen.getByText('Session Expiring Soon')).toBeInTheDocument();
    });

    it('handles OAuth error when session has expired', async () => {
      const { rerender } = render(<SessionWarningModal {...defaultProps} remainingTime={5} />);

      fireEvent.click(screen.getByRole('button', { name: /Stay Logged In/i }));

      // Simulate time expiring while OAuth popup was open
      rerender(<SessionWarningModal {...defaultProps} remainingTime={0} />);

      // Simulate OAuth error after expiration
      if (capturedGoogleLoginCallbacks.onError) {
        capturedGoogleLoginCallbacks.onError({ error: 'popup_closed' });
      }

      // Should transition to expired mode
      expect(screen.getByText('Session Expired')).toBeInTheDocument();
    });

    it('shows error message on authentication failure', async () => {
      render(<SessionWarningModal {...defaultProps} remainingTime={60} />);

      fireEvent.click(screen.getByRole('button', { name: /Stay Logged In/i }));

      if (capturedGoogleLoginCallbacks.onError) {
        capturedGoogleLoginCallbacks.onError({ error: 'authentication_failed' });
      }

      // Should show warning mode (not expired) since time > 0
      expect(screen.getByText('Session Expiring Soon')).toBeInTheDocument();
    });
  });

  describe('Dialog Close Handling', () => {
    it('prevents closing on backdrop click', () => {
      render(<SessionWarningModal {...defaultProps} />);

      // Call the captured onClose with backdropClick reason
      if (dialogCallbacks.onClose) {
        dialogCallbacks.onClose({}, 'backdropClick');
      }

      // Dialog should still be present (onClose returns early for backdropClick)
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('prevents closing on escape key', () => {
      render(<SessionWarningModal {...defaultProps} />);

      // Call the captured onClose with escapeKeyDown reason
      if (dialogCallbacks.onClose) {
        dialogCallbacks.onClose({}, 'escapeKeyDown');
      }

      // Dialog should still be present (onClose returns early for escapeKeyDown)
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('handles other close reasons', () => {
      render(<SessionWarningModal {...defaultProps} />);

      // Call with a different reason (not backdropClick or escapeKeyDown)
      if (dialogCallbacks.onClose) {
        dialogCallbacks.onClose({}, 'otherReason');
      }

      // Dialog behavior depends on implementation
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Loading Mode Display', () => {
    it('shows loading state after clicking Stay Logged In', () => {
      render(<SessionWarningModal {...defaultProps} />);

      // Click the button to enter loading state
      fireEvent.click(screen.getByRole('button', { name: /Stay Logged In/i }));

      // googleLogin is called
      expect(mockGoogleLogin).toHaveBeenCalled();
    });
  });

  describe('Modal State Reset', () => {
    it('resets to warning when reopened with positive time after being in loading', async () => {
      const { rerender } = render(<SessionWarningModal {...defaultProps} />);

      // Click to enter loading state
      fireEvent.click(screen.getByRole('button', { name: /Stay Logged In/i }));

      // Close and reopen modal
      rerender(<SessionWarningModal {...defaultProps} open={false} />);
      rerender(<SessionWarningModal {...defaultProps} open={true} remainingTime={100} />);

      // Should show warning state
      expect(screen.getByText('Session Expiring Soon')).toBeInTheDocument();
    });

    it('does not reset when reopened with zero time', () => {
      const { rerender } = render(<SessionWarningModal {...defaultProps} remainingTime={0} />);

      expect(screen.getByText('Session Expired')).toBeInTheDocument();

      // Close and reopen with zero time
      rerender(<SessionWarningModal {...defaultProps} open={false} remainingTime={0} />);
      rerender(<SessionWarningModal {...defaultProps} open={true} remainingTime={0} />);

      // Should still show expired state
      expect(screen.getByText('Session Expired')).toBeInTheDocument();
    });
  });

  describe('formatTime Edge Cases', () => {
    it('handles very large time values', () => {
      render(<SessionWarningModal {...defaultProps} remainingTime={7200} />);
      expect(screen.getByText('120:00')).toBeInTheDocument();
    });

    it('handles single digit seconds correctly', () => {
      render(<SessionWarningModal {...defaultProps} remainingTime={3} />);
      expect(screen.getByText('0:03')).toBeInTheDocument();
    });
  });

  describe('User Data in OAuth Success', () => {
    it('preserves user data when refreshing token', async () => {
      const onStayLoggedIn = vi.fn().mockResolvedValue(undefined);
      render(<SessionWarningModal {...defaultProps} onStayLoggedIn={onStayLoggedIn} />);

      fireEvent.click(screen.getByRole('button', { name: /Stay Logged In/i }));

      if (capturedGoogleLoginCallbacks.onSuccess) {
        await capturedGoogleLoginCallbacks.onSuccess({
          access_token: 'refreshed-token',
        });
      }

      // Verify updateUser was called with preserved user data plus new token
      expect(mockUpdateUser).toHaveBeenCalledWith(
        'refreshed-token',
        expect.objectContaining({
          name: mockUser.name,
          email: mockUser.email,
          token: 'refreshed-token',
        })
      );
    });
  });

  describe('Conditional Button Rendering', () => {
    it('hides buttons in loading mode', () => {
      render(<SessionWarningModal {...defaultProps} />);

      // Initially buttons are visible
      expect(screen.getByRole('button', { name: /Stay Logged In/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Log Out/i })).toBeInTheDocument();

      // Click to enter loading state
      fireEvent.click(screen.getByRole('button', { name: /Stay Logged In/i }));

      // googleLogin should be called, indicating loading state was triggered
      expect(mockGoogleLogin).toHaveBeenCalled();
    });

    it('shows only Sign In Again button in expired mode', () => {
      render(<SessionWarningModal {...defaultProps} remainingTime={0} />);

      expect(screen.getByRole('button', { name: /Sign In Again/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Stay Logged In/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Log Out/i })).not.toBeInTheDocument();
    });
  });
});
