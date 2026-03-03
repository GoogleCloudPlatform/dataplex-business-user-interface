import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProtectedRoute } from './ProtectedRoute';
import type { User } from '../types/User';

// Mock useAuth hook
const mockUseAuth = vi.fn();
vi.mock('./AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock Navigate component
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  Navigate: ({ to }: { to: string }) => {
    mockNavigate(to);
    return <div data-testid="navigate-mock">Redirecting to {to}</div>;
  },
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when user is authenticated', () => {
    const mockUser: User = {
      name: 'Test User',
      email: 'test@example.com',
      picture: 'https://example.com/picture.jpg',
      token: 'test-token',
      tokenExpiry: 9999999999,
      tokenIssuedAt: 9999999900,
      hasRole: true,
      roles: ['user'],
      permissions: ['read'],
      appConfig: {},
    };

    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: mockUser });
    });

    it('should render children when user is authenticated', () => {
      render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should not redirect when user is authenticated', () => {
      render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.queryByTestId('navigate-mock')).not.toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should render complex children when user is authenticated', () => {
      render(
        <ProtectedRoute>
          <div data-testid="complex-content">
            <h1>Dashboard</h1>
            <p>Welcome to the dashboard</p>
            <button>Click me</button>
          </div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('complex-content')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Welcome to the dashboard')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });
  });

  describe('when user is not authenticated', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: null });
    });

    it('should redirect to root when user is null', () => {
      render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('navigate-mock')).toBeInTheDocument();
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('should not render children when user is null', () => {
      render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should redirect to root when user is undefined', () => {
      mockUseAuth.mockReturnValue({ user: undefined });

      render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('navigate-mock')).toBeInTheDocument();
      expect(mockNavigate).toHaveBeenCalledWith('/');
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should render children when user has minimal data', () => {
      const minimalUser: Partial<User> = {
        email: 'minimal@test.com',
      };
      mockUseAuth.mockReturnValue({ user: minimalUser });

      render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should render children when user is an empty object (truthy)', () => {
      mockUseAuth.mockReturnValue({ user: {} });

      render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      // Empty object is truthy, so children should render
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should handle useAuth returning only user property', () => {
      const user: User = {
        name: 'Test User',
        email: 'test@example.com',
        picture: 'test.jpg',
        token: 'token',
        tokenExpiry: 1234567890,
        tokenIssuedAt: 1234567800,
        hasRole: true,
        roles: [],
        permissions: [],
        appConfig: {},
      };
      mockUseAuth.mockReturnValue({ user });

      render(
        <ProtectedRoute>
          <span data-testid="span-child">Span Child</span>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('span-child')).toBeInTheDocument();
    });
  });
});
