import React, { useEffect } from 'react';
import { useSessionExpiration } from '../../hooks/useSessionExpiration';
import { useSessionManagement } from '../../hooks/useSessionManagement';
import SessionExpired from './SessionExpired';
import { SessionWarningModal } from '../../components/Auth/SessionWarningModal';
import { setSessionExpirationModalActive } from '../../utils/apiInterceptor';

/**
 * @file SessionExpirationWrapper.tsx
 * @summary A wrapper component that monitors and handles user session/token expiration.
 *
 * @description
 * This component acts as a gatekeeper for session-protected parts of an application
 * (e.g., wrapping the main layout). It uses two hooks:
 * - `useSessionExpiration`: Checks if token has fully expired (redirects to login)
 * - `useSessionManagement`: Shows warning modal 5 minutes before token expires
 *
 * When token is about to expire, the warning modal allows users to re-authenticate
 * via popup without losing their current page state.
 *
 * @param {object} props - The props for the SessionExpirationWrapper component.
 * @param {React.ReactNode} props.children - The React components to render
 * if the session is still active.
 * @param {number} [props.checkInterval=30000] - The interval (in milliseconds)
 * to check for expiration. Defaults to 30,000ms (30 seconds).
 * @param {() => void} [props.onSessionExpired] - An optional callback function
 * to run when the session expires.
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
  const handleSessionExpired = () => {
    // Notification already shown by useSessionExpiration hook
    onSessionExpired?.();
  };

  const handleTokenExpired = () => {
    // Notification already shown by useSessionExpiration hook
    onTokenExpired?.();
  };

  // Existing token expiration hook (checks every 30s)
  const { isExpired, expirationReason, resetExpiration } = useSessionExpiration({
    checkInterval,
    onSessionExpired: handleSessionExpired,
    onTokenExpired: handleTokenExpired
  });

  // Token expiration warning hook (shows modal 5 min before expiry)
  const {
    isWarningModalOpen,
    remainingTime,
    handleStayLoggedIn,
    handleLogOut,
  } = useSessionManagement({
    enabled: !isExpired, // Disable warning when already expired
  });

  // Set global flag when session expiration UI is active
  useEffect(() => {
    if (isExpired) {
      setSessionExpirationModalActive(true);
    } else {
      setSessionExpirationModalActive(false);
    }

    return () => setSessionExpirationModalActive(false);
  }, [isExpired]);

  // If session is expired, show the session expired page
  if (isExpired) {
    return (
      <SessionExpired
        reason={expirationReason}
        customMessage={customExpiredMessage}
        onRetry={expirationReason === 'unauthorized' ? resetExpiration : undefined}
      />
    );
  }

  // Otherwise, render the children normally with the warning modal
  return (
    <>
      {children}
      <SessionWarningModal
        open={isWarningModalOpen}
        remainingTime={remainingTime}
        onStayLoggedIn={handleStayLoggedIn}
        onLogOut={handleLogOut}
      />
    </>
  );
};

export default SessionExpirationWrapper;
