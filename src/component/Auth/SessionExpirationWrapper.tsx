import React from 'react';
import { useSessionExpiration } from '../../hooks/useSessionExpiration';
import { useNotification } from '../../contexts/NotificationContext';
import SessionExpired from './SessionExpired';

/**
 * @file SessionExpirationWrapper.tsx
 * @summary A wrapper component that monitors and handles user session/token expiration.
 *
 * @description
 * This component acts as a gatekeeper for session-protected parts of an application
 * (e.g., wrapping the main layout). It uses the `useSessionExpiration` hook to
 * periodically check the user's authentication status (both for session inactivity
 * and auth token expiry).
 *
 * When the hook determines an expiration has occurred:
 * 1.  It calls internal handlers (`handleSessionExpired` or `handleTokenExpired`)
 * which use the `useNotification` context to display an appropriate
 * warning or error message.
 * 2.  It executes optional callback props (`onSessionExpired` or `onTokenExpired`).
 * 3.  It renders the `<SessionExpired />` component, which blocks the UI
 * and informs the user.
 *
 * If the session is active (`isExpired` is false), it renders its `children`
 * normally.
 *
 * @param {object} props - The props for the SessionExpirationWrapper component.
 * @param {React.ReactNode} props.children - The React components to render
 * if the session is still active.
 * @param {number} [props.checkInterval=30000] - The interval (in milliseconds)
 * to check for expiration. Defaults to 30,000ms (30 seconds).
 * @param {() => void} [props.onSessionExpired] - An optional callback function
 * to run when the session expires from inactivity.
 * @param {() => void} [props.onTokenExpired] - An optional callback function
 * to run when the authentication token expires.
 * @param {string} [props.customExpiredMessage] - An optional custom message to
 * pass down to the `<SessionExpired />` screen.
 *
 * @returns {JSX.Element} Either the `children` components (if the session is
 * active) or the `<SessionExpired />` component (if the session is expired).
 */

interface SessionExpirationWrapperProps {
  children: React.ReactNode;
  checkInterval?: number;
  onSessionExpired?: () => void;
  onTokenExpired?: () => void;
  customExpiredMessage?: string;
}

const SessionExpirationWrapper: React.FC<SessionExpirationWrapperProps> = ({
  children,
  checkInterval = 30000, // 30 seconds
  onSessionExpired,
  onTokenExpired,
  customExpiredMessage
}) => {
  const { showError, showWarning } = useNotification();
  
  const handleSessionExpired = () => {
    showWarning('Your session has expired due to inactivity. Please sign in again.', 5000);
    onSessionExpired?.();
  };

  const handleTokenExpired = () => {
    showError('Your access token has expired. Please sign in again.', 5000);
    onTokenExpired?.();
  };

  const { isExpired, expirationReason, resetExpiration } = useSessionExpiration({
    checkInterval,
    onSessionExpired: handleSessionExpired,
    onTokenExpired: handleTokenExpired
  });

  // If session is expired, show the session expired page
  if (isExpired) {
    return (
      <SessionExpired
        reason={expirationReason}
        customMessage={customExpiredMessage}
        onRetry={resetExpiration}
      />
    );
  }

  // Otherwise, render the children normally
  return <>{children}</>;
};

export default SessionExpirationWrapper;
