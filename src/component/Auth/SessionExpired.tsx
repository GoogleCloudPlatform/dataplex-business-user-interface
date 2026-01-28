import React from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Paper,
  Zoom,
  Fade,
  Grow,
  Avatar,
} from '@mui/material';
import {
  AccessTime,
  Login,
  Refresh,
  GppBad,
  ReportProblem,
} from '@mui/icons-material';
import { useAuth } from '../../auth/AuthProvider';
import { useNavigate } from 'react-router-dom';

/**
 * @file SessionExpired.tsx
 * @summary Renders a full-screen page to inform the user that their session has ended.
 *
 * @description
 * This component displays a user-friendly message when their session expires
 * (token expired) or they are unauthorized.
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

// Material Design red color palette
const redTheme = {
  main: '#D32F2F',
  light: '#EF5350',
  dark: '#C62828',
  lighter: '#FFEBEE',
  lightest: '#FFF5F5',
  contrastText: '#FFFFFF',
};

// Professional neutral shadows
const shadows = {
  card: '0 4px 24px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
  cardHover: '0 8px 32px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.06)',
  button: '0 2px 8px rgba(0, 0, 0, 0.1)',
  buttonHover: '0 4px 12px rgba(0, 0, 0, 0.15)',
  avatar: '0 2px 12px rgba(0, 0, 0, 0.1)',
};

// Google Fonts configuration
const googleFonts = {
  display: '"Google Sans", "Roboto", "Helvetica", "Arial", sans-serif',
  body: '"Google Sans Text", "Roboto", "Helvetica", "Arial", sans-serif',
};

interface SessionExpiredProps {
  reason?: 'session_expired' | 'token_expired' | 'unauthorized';
  customMessage?: string;
  onRetry?: () => void;
}

const SessionExpired: React.FC<SessionExpiredProps> = ({
  reason = 'session_expired',
  customMessage,
  onRetry,
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
        return 'Your session has expired. Please sign in again to continue using the application.';
    }
  };

  const getIcon = () => {
    const iconStyle = { fontSize: 40, color: redTheme.contrastText };
    switch (reason) {
      case 'token_expired':
        return <AccessTime sx={iconStyle} />;
      case 'unauthorized':
        return <GppBad sx={iconStyle} />;
      default:
        return <ReportProblem sx={iconStyle} />;
    }
  };

  const handleReLogin = async () => {
    try {
      logout();
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      navigate('/login');
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${redTheme.lightest} 0%, ${redTheme.lighter} 100%)`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decorative circles */}
      <Box
        sx={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${redTheme.light}15 0%, transparent 70%)`,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -80,
          left: -80,
          width: 250,
          height: 250,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${redTheme.main}10 0%, transparent 70%)`,
        }}
      />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Grow in timeout={500}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 4, sm: 5 },
              textAlign: 'center',
              borderRadius: 4,
              backgroundColor: '#FFFFFF',
              boxShadow: shadows.card,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Top accent bar */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: `linear-gradient(90deg, ${redTheme.dark} 0%, ${redTheme.light} 100%)`,
              }}
            />

            {/* Icon with MUI Avatar and Zoom animation */}
            <Zoom in timeout={600} style={{ transitionDelay: '200ms' }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  mb: 3,
                  mt: 1,
                }}
              >
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: redTheme.main,
                    boxShadow: shadows.avatar,
                  }}
                >
                  {getIcon()}
                </Avatar>
              </Box>
            </Zoom>

            {/* Title with Fade animation */}
            <Fade in timeout={800} style={{ transitionDelay: '300ms' }}>
              <Typography
                variant="h5"
                component="h1"
                sx={{
                  fontFamily: googleFonts.display,
                  fontWeight: 600,
                  color: redTheme.dark,
                  mb: 1.5,
                  letterSpacing: '-0.01em',
                }}
              >
                {getTitle()}
              </Typography>
            </Fade>

            {/* Message with Fade animation */}
            <Fade in timeout={800} style={{ transitionDelay: '400ms' }}>
              <Typography
                variant="body1"
                sx={{
                  fontFamily: googleFonts.body,
                  color: 'text.secondary',
                  mb: 4,
                  lineHeight: 1.6,
                  maxWidth: 360,
                  mx: 'auto',
                }}
              >
                {getMessage()}
              </Typography>
            </Fade>

            {/* Action Buttons with Fade animation */}
            <Fade in timeout={800} style={{ transitionDelay: '500ms' }}>
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <Button
                  variant="contained"
                  onClick={handleReLogin}
                  startIcon={<Login />}
                  sx={{
                    fontFamily: googleFonts.display,
                    bgcolor: redTheme.main,
                    color: redTheme.contrastText,
                    px: 3.5,
                    py: 1.25,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    boxShadow: shadows.button,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      bgcolor: redTheme.dark,
                      boxShadow: shadows.buttonHover,
                      transform: 'translateY(-1px)',
                    },
                    '&:active': {
                      transform: 'translateY(0)',
                    },
                  }}
                >
                  Sign In Again
                </Button>

                {onRetry && (
                  <Button
                    variant="outlined"
                    onClick={handleRetry}
                    startIcon={<Refresh />}
                    sx={{
                      fontFamily: googleFonts.display,
                      borderColor: redTheme.main,
                      color: redTheme.main,
                      px: 3.5,
                      py: 1.25,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      borderWidth: 1.5,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        borderColor: redTheme.dark,
                        borderWidth: 1.5,
                        bgcolor: redTheme.lighter,
                        transform: 'translateY(-1px)',
                      },
                    }}
                  >
                    Try Again
                  </Button>
                )}
              </Box>
            </Fade>

            {/* Footer text */}
            <Fade in timeout={800} style={{ transitionDelay: '600ms' }}>
              <Box
                sx={{
                  mt: 4,
                  pt: 3,
                  borderTop: `1px solid ${redTheme.lighter}`,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: googleFonts.body,
                    color: 'text.disabled',
                    fontSize: '0.8rem',
                  }}
                >
                  If you continue to experience issues, please contact your
                  system administrator.
                </Typography>
              </Box>
            </Fade>
          </Paper>
        </Grow>
      </Container>
    </Box>
  );
};

export default SessionExpired;
