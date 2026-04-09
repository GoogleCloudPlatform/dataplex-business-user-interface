import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import SessionExpirationWrapper from './SessionExpirationWrapper';

// Interface for mock functions with captured callback properties
interface ExtendedMock extends ReturnType<typeof vi.fn> {
  _capturedOnSessionExpired?: () => void;
  _capturedOnTokenExpired?: () => void;
  _capturedConfig?: Record<string, unknown>;
}

// Mock functions using vi.hoisted to ensure they're available during module mocking
const {
  mockUseSessionExpiration,
  mockUseSessionManagement,
  mockSetSessionExpirationModalActive,
} = vi.hoisted(() => ({
  mockUseSessionExpiration: vi.fn() as ExtendedMock,
  mockUseSessionManagement: vi.fn() as ExtendedMock,
  mockSetSessionExpirationModalActive: vi.fn(),
}));

// Mock hooks
vi.mock('../../hooks/useSessionExpiration', () => ({
  useSessionExpiration: (config: any) => {
    // Capture the callbacks for testing
    if (config?.onSessionExpired) {
      mockUseSessionExpiration._capturedOnSessionExpired = config.onSessionExpired;
    }
    if (config?.onTokenExpired) {
      mockUseSessionExpiration._capturedOnTokenExpired = config.onTokenExpired;
    }
    mockUseSessionExpiration._capturedConfig = config;
    return mockUseSessionExpiration();
  },
}));

vi.mock('../../hooks/useSessionManagement', () => ({
  useSessionManagement: (config: any) => {
    mockUseSessionManagement._capturedConfig = config;
    return mockUseSessionManagement();
  },
}));

// Mock utility
vi.mock('../../utils/apiInterceptor', () => ({
  setSessionExpirationModalActive: (active: boolean) =>
    mockSetSessionExpirationModalActive(active),
}));

// Mock child components
vi.mock('./SessionExpired', () => ({
  default: ({
    reason,
    customMessage,
    onRetry,
  }: {
    reason?: string;
    customMessage?: string;
    onRetry?: () => void;
  }) => (
    <div data-testid="session-expired">
      <span data-testid="expired-reason">{reason}</span>
      <span data-testid="expired-custom-message">{customMessage || 'none'}</span>
      {onRetry && (
        <button data-testid="retry-button" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  ),
}));

vi.mock('../../components/Auth/SessionWarningModal', () => ({
  SessionWarningModal: ({
    open,
    remainingTime,
    onStayLoggedIn,
    onLogOut,
  }: {
    open: boolean;
    remainingTime: number;
    onStayLoggedIn: () => void;
    onLogOut: () => void;
  }) => (
    <div data-testid="session-warning-modal" data-open={open}>
      <span data-testid="remaining-time">{remainingTime}</span>
      <button data-testid="stay-logged-in" onClick={onStayLoggedIn}>
        Stay Logged In
      </button>
      <button data-testid="log-out" onClick={onLogOut}>
        Log Out
      </button>
    </div>
  ),
}));

vi.mock('../../components/Auth/NoAccessModal', () => ({
  NoAccessModal: () => <div data-testid="no-access-modal" />,
}));

vi.mock('../../contexts/NoAccessContext', () => ({
  NoAccessProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useNoAccess: () => ({
    isNoAccessOpen: false,
    noAccessMessage: null,
    triggerNoAccess: vi.fn(),
    dismissNoAccess: vi.fn(),
  }),
}));

vi.mock('../../auth/AuthProvider', () => ({
  useAuth: () => ({ logout: vi.fn(), user: null, updateUser: vi.fn() }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

describe('SessionExpirationWrapper', () => {
  // Default mock return values
  const defaultSessionExpirationReturn = {
    isExpired: false,
    expirationReason: 'session_expired' as const,
    resetExpiration: vi.fn(),
    triggerExpiration: vi.fn(),
    checkTokenValidity: vi.fn(),
  };

  const defaultSessionManagementReturn = {
    isWarningModalOpen: false,
    remainingTime: 300,
    handleStayLoggedIn: vi.fn(),
    handleLogOut: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSessionExpiration.mockReturnValue(defaultSessionExpirationReturn);
    mockUseSessionManagement.mockReturnValue(defaultSessionManagementReturn);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('rendering children when session is active', () => {
    it('should render children when session is not expired', () => {
      render(
        <SessionExpirationWrapper>
          <div data-testid="child-content">Protected Content</div>
        </SessionExpirationWrapper>
      );

      expect(screen.getByTestId('child-content')).toBeInTheDocument();
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(screen.queryByTestId('session-expired')).not.toBeInTheDocument();
    });

    it('should render complex children correctly', () => {
      render(
        <SessionExpirationWrapper>
          <div data-testid="complex-content">
            <h1>Dashboard</h1>
            <p>Welcome to your dashboard</p>
            <button>Click me</button>
          </div>
        </SessionExpirationWrapper>
      );

      expect(screen.getByTestId('complex-content')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Welcome to your dashboard')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('should render SessionWarningModal alongside children', () => {
      render(
        <SessionExpirationWrapper>
          <div data-testid="child-content">Content</div>
        </SessionExpirationWrapper>
      );

      expect(screen.getByTestId('child-content')).toBeInTheDocument();
      expect(screen.getByTestId('session-warning-modal')).toBeInTheDocument();
    });
  });

  describe('rendering SessionExpired when expired', () => {
    it('should render SessionExpired when isExpired is true', () => {
      mockUseSessionExpiration.mockReturnValue({
        ...defaultSessionExpirationReturn,
        isExpired: true,
        expirationReason: 'session_expired',
      });

      render(
        <SessionExpirationWrapper>
          <div data-testid="child-content">Protected Content</div>
        </SessionExpirationWrapper>
      );

      expect(screen.getByTestId('session-expired')).toBeInTheDocument();
      expect(screen.queryByTestId('child-content')).not.toBeInTheDocument();
    });

    it('should pass session_expired reason to SessionExpired', () => {
      mockUseSessionExpiration.mockReturnValue({
        ...defaultSessionExpirationReturn,
        isExpired: true,
        expirationReason: 'session_expired',
      });

      render(
        <SessionExpirationWrapper>
          <div>Content</div>
        </SessionExpirationWrapper>
      );

      expect(screen.getByTestId('expired-reason')).toHaveTextContent('session_expired');
    });

    it('should pass token_expired reason to SessionExpired', () => {
      mockUseSessionExpiration.mockReturnValue({
        ...defaultSessionExpirationReturn,
        isExpired: true,
        expirationReason: 'token_expired',
      });

      render(
        <SessionExpirationWrapper>
          <div>Content</div>
        </SessionExpirationWrapper>
      );

      expect(screen.getByTestId('expired-reason')).toHaveTextContent('token_expired');
    });

    it('should pass unauthorized reason to SessionExpired', () => {
      mockUseSessionExpiration.mockReturnValue({
        ...defaultSessionExpirationReturn,
        isExpired: true,
        expirationReason: 'unauthorized',
      });

      render(
        <SessionExpirationWrapper>
          <div>Content</div>
        </SessionExpirationWrapper>
      );

      expect(screen.getByTestId('expired-reason')).toHaveTextContent('unauthorized');
    });

    it('should pass customExpiredMessage to SessionExpired', () => {
      mockUseSessionExpiration.mockReturnValue({
        ...defaultSessionExpirationReturn,
        isExpired: true,
      });

      render(
        <SessionExpirationWrapper customExpiredMessage="Custom expiration message">
          <div>Content</div>
        </SessionExpirationWrapper>
      );

      expect(screen.getByTestId('expired-custom-message')).toHaveTextContent(
        'Custom expiration message'
      );
    });

    it('should provide onRetry when reason is unauthorized', () => {
      const mockResetExpiration = vi.fn();
      mockUseSessionExpiration.mockReturnValue({
        ...defaultSessionExpirationReturn,
        isExpired: true,
        expirationReason: 'unauthorized',
        resetExpiration: mockResetExpiration,
      });

      render(
        <SessionExpirationWrapper>
          <div>Content</div>
        </SessionExpirationWrapper>
      );

      expect(screen.getByTestId('retry-button')).toBeInTheDocument();
    });

    it('should not provide onRetry when reason is session_expired', () => {
      mockUseSessionExpiration.mockReturnValue({
        ...defaultSessionExpirationReturn,
        isExpired: true,
        expirationReason: 'session_expired',
      });

      render(
        <SessionExpirationWrapper>
          <div>Content</div>
        </SessionExpirationWrapper>
      );

      expect(screen.queryByTestId('retry-button')).not.toBeInTheDocument();
    });

    it('should not provide onRetry when reason is token_expired', () => {
      mockUseSessionExpiration.mockReturnValue({
        ...defaultSessionExpirationReturn,
        isExpired: true,
        expirationReason: 'token_expired',
      });

      render(
        <SessionExpirationWrapper>
          <div>Content</div>
        </SessionExpirationWrapper>
      );

      expect(screen.queryByTestId('retry-button')).not.toBeInTheDocument();
    });

    it('should call resetExpiration when retry button is clicked for unauthorized', async () => {
      const mockResetExpiration = vi.fn();
      mockUseSessionExpiration.mockReturnValue({
        ...defaultSessionExpirationReturn,
        isExpired: true,
        expirationReason: 'unauthorized',
        resetExpiration: mockResetExpiration,
      });

      render(
        <SessionExpirationWrapper>
          <div>Content</div>
        </SessionExpirationWrapper>
      );

      const retryButton = screen.getByTestId('retry-button');
      retryButton.click();

      expect(mockResetExpiration).toHaveBeenCalled();
    });
  });

  describe('SessionWarningModal integration', () => {
    it('should pass isWarningModalOpen to SessionWarningModal', () => {
      mockUseSessionManagement.mockReturnValue({
        ...defaultSessionManagementReturn,
        isWarningModalOpen: true,
      });

      render(
        <SessionExpirationWrapper>
          <div>Content</div>
        </SessionExpirationWrapper>
      );

      const modal = screen.getByTestId('session-warning-modal');
      expect(modal).toHaveAttribute('data-open', 'true');
    });

    it('should pass remainingTime to SessionWarningModal', () => {
      mockUseSessionManagement.mockReturnValue({
        ...defaultSessionManagementReturn,
        remainingTime: 120,
      });

      render(
        <SessionExpirationWrapper>
          <div>Content</div>
        </SessionExpirationWrapper>
      );

      expect(screen.getByTestId('remaining-time')).toHaveTextContent('120');
    });

    it('should pass handleStayLoggedIn to SessionWarningModal', () => {
      const mockHandleStayLoggedIn = vi.fn();
      mockUseSessionManagement.mockReturnValue({
        ...defaultSessionManagementReturn,
        handleStayLoggedIn: mockHandleStayLoggedIn,
      });

      render(
        <SessionExpirationWrapper>
          <div>Content</div>
        </SessionExpirationWrapper>
      );

      const stayLoggedInButton = screen.getByTestId('stay-logged-in');
      stayLoggedInButton.click();

      expect(mockHandleStayLoggedIn).toHaveBeenCalled();
    });

    it('should pass handleLogOut to SessionWarningModal', () => {
      const mockHandleLogOut = vi.fn();
      mockUseSessionManagement.mockReturnValue({
        ...defaultSessionManagementReturn,
        handleLogOut: mockHandleLogOut,
      });

      render(
        <SessionExpirationWrapper>
          <div>Content</div>
        </SessionExpirationWrapper>
      );

      const logOutButton = screen.getByTestId('log-out');
      logOutButton.click();

      expect(mockHandleLogOut).toHaveBeenCalled();
    });

    it('should not render SessionWarningModal when session is expired', () => {
      mockUseSessionExpiration.mockReturnValue({
        ...defaultSessionExpirationReturn,
        isExpired: true,
      });

      render(
        <SessionExpirationWrapper>
          <div>Content</div>
        </SessionExpirationWrapper>
      );

      expect(screen.queryByTestId('session-warning-modal')).not.toBeInTheDocument();
    });
  });

  describe('callback functions', () => {
    it('should call onSessionExpired callback when session expires', () => {
      const onSessionExpired = vi.fn();

      render(
        <SessionExpirationWrapper onSessionExpired={onSessionExpired}>
          <div>Content</div>
        </SessionExpirationWrapper>
      );

      // Trigger the captured callback
      const capturedCallback = mockUseSessionExpiration._capturedOnSessionExpired;
      expect(capturedCallback).toBeDefined();
      capturedCallback!();

      expect(onSessionExpired).toHaveBeenCalled();
    });

    it('should call onTokenExpired callback when token expires', () => {
      const onTokenExpired = vi.fn();

      render(
        <SessionExpirationWrapper onTokenExpired={onTokenExpired}>
          <div>Content</div>
        </SessionExpirationWrapper>
      );

      // Trigger the captured callback
      const capturedCallback = mockUseSessionExpiration._capturedOnTokenExpired;
      expect(capturedCallback).toBeDefined();
      capturedCallback!();

      expect(onTokenExpired).toHaveBeenCalled();
    });

    it('should handle missing onSessionExpired callback gracefully', () => {
      render(
        <SessionExpirationWrapper>
          <div>Content</div>
        </SessionExpirationWrapper>
      );

      // Trigger the captured callback without onSessionExpired prop
      const capturedCallback = mockUseSessionExpiration._capturedOnSessionExpired!;
      expect(() => capturedCallback()).not.toThrow();
    });

    it('should handle missing onTokenExpired callback gracefully', () => {
      render(
        <SessionExpirationWrapper>
          <div>Content</div>
        </SessionExpirationWrapper>
      );

      // Trigger the captured callback without onTokenExpired prop
      const capturedCallback = mockUseSessionExpiration._capturedOnTokenExpired!;
      expect(() => capturedCallback()).not.toThrow();
    });
  });

  describe('hook configuration', () => {
    it('should pass default checkInterval to useSessionExpiration', () => {
      render(
        <SessionExpirationWrapper>
          <div>Content</div>
        </SessionExpirationWrapper>
      );

      const capturedConfig = mockUseSessionExpiration._capturedConfig!;
      expect(capturedConfig.checkInterval).toBe(30000);
    });

    it('should pass custom checkInterval to useSessionExpiration', () => {
      render(
        <SessionExpirationWrapper checkInterval={60000}>
          <div>Content</div>
        </SessionExpirationWrapper>
      );

      const capturedConfig = mockUseSessionExpiration._capturedConfig!;
      expect(capturedConfig.checkInterval).toBe(60000);
    });

    it('should pass enabled: true to useSessionManagement when not expired', () => {
      mockUseSessionExpiration.mockReturnValue({
        ...defaultSessionExpirationReturn,
        isExpired: false,
      });

      render(
        <SessionExpirationWrapper>
          <div>Content</div>
        </SessionExpirationWrapper>
      );

      const capturedConfig = mockUseSessionManagement._capturedConfig!;
      expect(capturedConfig.enabled).toBe(true);
    });

    it('should pass enabled: false to useSessionManagement when expired', () => {
      mockUseSessionExpiration.mockReturnValue({
        ...defaultSessionExpirationReturn,
        isExpired: true,
      });

      render(
        <SessionExpirationWrapper>
          <div>Content</div>
        </SessionExpirationWrapper>
      );

      const capturedConfig = mockUseSessionManagement._capturedConfig!;
      expect(capturedConfig.enabled).toBe(false);
    });
  });

  describe('setSessionExpirationModalActive effect', () => {
    it('should call setSessionExpirationModalActive(true) when expired', () => {
      mockUseSessionExpiration.mockReturnValue({
        ...defaultSessionExpirationReturn,
        isExpired: true,
      });

      render(
        <SessionExpirationWrapper>
          <div>Content</div>
        </SessionExpirationWrapper>
      );

      expect(mockSetSessionExpirationModalActive).toHaveBeenCalledWith(true);
    });

    it('should call setSessionExpirationModalActive(false) when not expired', () => {
      mockUseSessionExpiration.mockReturnValue({
        ...defaultSessionExpirationReturn,
        isExpired: false,
      });

      render(
        <SessionExpirationWrapper>
          <div>Content</div>
        </SessionExpirationWrapper>
      );

      expect(mockSetSessionExpirationModalActive).toHaveBeenCalledWith(false);
    });

    it('should call setSessionExpirationModalActive(false) on unmount', () => {
      const { unmount } = render(
        <SessionExpirationWrapper>
          <div>Content</div>
        </SessionExpirationWrapper>
      );

      mockSetSessionExpirationModalActive.mockClear();

      unmount();

      expect(mockSetSessionExpirationModalActive).toHaveBeenCalledWith(false);
    });

    it('should update setSessionExpirationModalActive when isExpired changes', async () => {
      mockUseSessionExpiration.mockReturnValue({
        ...defaultSessionExpirationReturn,
        isExpired: false,
      });

      const { rerender } = render(
        <SessionExpirationWrapper>
          <div>Content</div>
        </SessionExpirationWrapper>
      );

      expect(mockSetSessionExpirationModalActive).toHaveBeenCalledWith(false);

      mockSetSessionExpirationModalActive.mockClear();

      // Simulate expiration
      mockUseSessionExpiration.mockReturnValue({
        ...defaultSessionExpirationReturn,
        isExpired: true,
      });

      rerender(
        <SessionExpirationWrapper>
          <div>Content</div>
        </SessionExpirationWrapper>
      );

      expect(mockSetSessionExpirationModalActive).toHaveBeenCalledWith(true);
    });
  });

  describe('edge cases', () => {
    it('should handle undefined optional props', () => {
      render(
        <SessionExpirationWrapper>
          <div data-testid="child">Content</div>
        </SessionExpirationWrapper>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('should handle all props provided together', () => {
      const onSessionExpired = vi.fn();
      const onTokenExpired = vi.fn();

      mockUseSessionExpiration.mockReturnValue({
        ...defaultSessionExpirationReturn,
        isExpired: true,
        expirationReason: 'unauthorized',
      });

      render(
        <SessionExpirationWrapper
          checkInterval={45000}
          onSessionExpired={onSessionExpired}
          onTokenExpired={onTokenExpired}
          customExpiredMessage="All props test"
        >
          <div>Content</div>
        </SessionExpirationWrapper>
      );

      expect(screen.getByTestId('session-expired')).toBeInTheDocument();
      expect(screen.getByTestId('expired-custom-message')).toHaveTextContent('All props test');
      expect(mockUseSessionExpiration._capturedConfig!.checkInterval).toBe(45000);
    });

    it('should handle rapid expiration state changes', () => {
      const { rerender } = render(
        <SessionExpirationWrapper>
          <div data-testid="child">Content</div>
        </SessionExpirationWrapper>
      );

      // Quickly toggle expired state
      mockUseSessionExpiration.mockReturnValue({
        ...defaultSessionExpirationReturn,
        isExpired: true,
      });

      rerender(
        <SessionExpirationWrapper>
          <div data-testid="child">Content</div>
        </SessionExpirationWrapper>
      );

      expect(screen.getByTestId('session-expired')).toBeInTheDocument();

      mockUseSessionExpiration.mockReturnValue({
        ...defaultSessionExpirationReturn,
        isExpired: false,
      });

      rerender(
        <SessionExpirationWrapper>
          <div data-testid="child">Content</div>
        </SessionExpirationWrapper>
      );

      expect(screen.queryByTestId('session-expired')).not.toBeInTheDocument();
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('should render multiple children correctly', () => {
      render(
        <SessionExpirationWrapper>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <span data-testid="child-3">Child 3</span>
        </SessionExpirationWrapper>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
      expect(screen.getByTestId('child-3')).toBeInTheDocument();
    });

    it('should handle remainingTime of 0', () => {
      mockUseSessionManagement.mockReturnValue({
        ...defaultSessionManagementReturn,
        remainingTime: 0,
        isWarningModalOpen: true,
      });

      render(
        <SessionExpirationWrapper>
          <div>Content</div>
        </SessionExpirationWrapper>
      );

      expect(screen.getByTestId('remaining-time')).toHaveTextContent('0');
    });

    it('should handle warning modal open state correctly', () => {
      mockUseSessionManagement.mockReturnValue({
        ...defaultSessionManagementReturn,
        isWarningModalOpen: false,
      });

      render(
        <SessionExpirationWrapper>
          <div>Content</div>
        </SessionExpirationWrapper>
      );

      const modal = screen.getByTestId('session-warning-modal');
      expect(modal).toHaveAttribute('data-open', 'false');
    });
  });

  describe('default export', () => {
    it('should export SessionExpirationWrapper as default', async () => {
      const module = await import('./SessionExpirationWrapper');
      expect(module.default).toBeDefined();
    });
  });
});
