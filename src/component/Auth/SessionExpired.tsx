import React from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { LockClock, Refresh } from '@mui/icons-material';
import { useAuth } from '../../auth/AuthProvider';
import { useNavigate } from 'react-router-dom';

/**
 * @file SessionExpired.tsx
 * @summary Renders a full-screen page to inform the user that their session has ended.
 *
 * @description
 * This component displays a user-friendly message when their session expires
 * due to inactivity, their authentication token expires, or they are unauthorized.
 * It uses the `reason` prop to determine the specific title and message to show.
 *
 * The component provides a primary "Sign In Again" button that logs the user
 * out (using the `useAuth` context's `logout` function) and redirects them
 * to the `/login` page.
 *
 * An optional "Try Again" button can be rendered by passing an `onRetry`
 * callback function, which allows for custom retry logic (e.g., re-checking
 * the session).
 *
 * @param {object} props - The props for the SessionExpired component.
 * @param {'session_expired' | 'token_expired' | 'unauthorized'} [props.reason='session_expired'] -
 * Specifies the reason for the expiration. This determines the title and default
 * message.
 * @param {string} [props.customMessage] - An optional string to display as the
 * main message, overriding the default text derived from the `reason`.
 * @param {() => void} [props.onRetry] - An optional callback function. If
 * provided, a "Try Again" button is displayed, which executes this function
 * when clicked.
 *
 * @returns {JSX.Element} The rendered React component for the session expired
 * screen, centered in a Material-UI `Container`.
 */

interface SessionExpiredProps {
  reason?: 'session_expired' | 'token_expired' | 'unauthorized';
  customMessage?: string;
  onRetry?: () => void;
}

const SessionExpired: React.FC<SessionExpiredProps> = ({
  reason = 'session_expired',
  customMessage,
  onRetry
}) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const getTitle = () => {
    switch (reason) {
      case 'token_expired':
        return 'Access Token Expired';
      case 'unauthorized':
        return 'Access Denied';
      default:
        return 'Session Expired';
    }
  };

  const getMessage = () => {
    if (customMessage) return customMessage;
    
    switch (reason) {
      case 'token_expired':
        return 'Your access token has expired. Please sign in again to continue using the application.';
      case 'unauthorized':
        return 'You do not have permission to access this resource. Please contact your administrator or sign in with a different account.';
      default:
        return 'Your session has expired due to inactivity. Please sign in again to continue using the application.';
    }
  };

  const handleReLogin = async () => {
    try {
      // Clear any existing session data
      logout();
      // Navigate to login page
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      // Force navigation to login even if logout fails
      navigate('/login');
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      // Default retry behavior - refresh the page
      window.location.reload();
    }
  };

  return (
    <Container maxWidth="sm" sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#F8FAFD'
      }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            textAlign: 'center',
            borderRadius: '16px',
            backgroundColor: '#ffffff',
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Box sx={{ mb: 3 }}>
            <LockClock 
              sx={{ 
                fontSize: 64, 
                color: '#FF6B6B',
                mb: 2
              }} 
            />
          </Box>

          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom
            sx={{ 
              fontWeight: 600,
              color: '#1F1F1F',
              mb: 2
            }}
          >
            {getTitle()}
          </Typography>

          <Typography 
            variant="body1" 
            sx={{ 
              color: '#575757',
              mb: 4,
              lineHeight: 1.6,
              maxWidth: '400px',
              mx: 'auto'
            }}
          >
            {getMessage()}
          </Typography>

          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <Button
              variant="contained"
              onClick={handleReLogin}
              startIcon={<Refresh />}
              sx={{
                backgroundColor: '#0B57D0',
                color: '#ffffff',
                px: 3,
                py: 1.5,
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '16px',
                '&:hover': {
                  backgroundColor: '#0A4BB5'
                }
              }}
            >
              Sign In Again
            </Button>

            {onRetry && (
              <Button
                variant="outlined"
                onClick={handleRetry}
                sx={{
                  borderColor: '#DADCE0',
                  color: '#1F1F1F',
                  px: 3,
                  py: 1.5,
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: '16px',
                  '&:hover': {
                    borderColor: '#0B57D0',
                    backgroundColor: '#F8FAFD'
                  }
                }}
              >
                Try Again
              </Button>
            )}
          </Box>

          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block',
              mt: 3,
              color: '#9AA0A6',
              fontSize: '12px'
            }}
          >
            If you continue to experience issues, please contact your system administrator.
          </Typography>
        </Paper>
      </Container>
  );
};

export default SessionExpired;
