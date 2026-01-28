/**
 * @file SessionWarningModal.tsx
 * @description Modal component that warns users about impending session/token expiration
 *
 * Features:
 * - Shows countdown timer based on token expiration
 * - "Stay Logged In" button opens Google OAuth popup for re-authentication
 * - "Log Out" button for manual logout
 * - Transforms to "expired" state when countdown reaches zero
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Box,
  Avatar,
  Zoom,
  Fade,
} from '@mui/material';
import {
  AccessTime,
  Login,
  Logout,
  ReportProblem,
} from '@mui/icons-material';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useAuth } from '../../auth/AuthProvider';

// Material Design red color palette (matching SessionExpired)
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
  button: '0 2px 8px rgba(0, 0, 0, 0.1)',
  buttonHover: '0 4px 12px rgba(0, 0, 0, 0.15)',
  avatar: '0 2px 12px rgba(0, 0, 0, 0.1)',
};

// Google Fonts configuration
const googleFonts = {
  display: '"Google Sans", "Roboto", "Helvetica", "Arial", sans-serif',
  body: '"Google Sans Text", "Roboto", "Helvetica", "Arial", sans-serif',
};

interface SessionWarningModalProps {
  open: boolean;
  remainingTime: number; // in seconds
  onStayLoggedIn: () => Promise<void>;
  onLogOut: () => void;
}

type ModalMode = 'warning' | 'loading' | 'expired';

interface ModalState {
  mode: ModalMode;
  error: string | null;
}

/**
 * Formats seconds into MM:SS format
 */
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const SessionWarningModal: React.FC<SessionWarningModalProps> = ({
  open,
  remainingTime,
  onStayLoggedIn,
  onLogOut,
}) => {
  const { user, updateUser } = useAuth();
  const [modalState, setModalState] = useState<ModalState>({
    mode: 'warning',
    error: null,
  });

  // Google OAuth login hook - uses native popup flow
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const { access_token } = tokenResponse;

      // Update token in auth context
      const now = Math.floor(Date.now() / 1000);
      const tokenExpiry = now + 3600; // 1 hour from now

      const updatedUser = {
        ...user!,
        token: access_token,
        tokenIssuedAt: now,
        tokenExpiry,
      };

      // Update axios headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      // Update user data
      updateUser(access_token, updatedUser);

      console.log('[SessionWarningModal] Token refreshed via Google OAuth popup');

      // Notify parent and close modal
      await onStayLoggedIn();
      setModalState({ mode: 'warning', error: null });
    },
    onError: (error) => {
      console.error('[SessionWarningModal] Google OAuth failed:', error);

      // Check if token expired while popup was open
      if (remainingTime <= 0) {
        setModalState({
          mode: 'expired',
          error: 'Your session has expired. Please sign in again.',
        });
      } else {
        // Show error but keep modal open for retry
        setModalState({
          mode: 'warning',
          error: 'Authentication failed. Please try again.',
        });
      }
    },
    flow: 'implicit',
    scope: 'https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/gmail.send',
  });

  // Reset modal state when countdown reaches zero
  useEffect(() => {
    if (remainingTime <= 0 && modalState.mode === 'warning') {
      setModalState({ mode: 'expired', error: null });
    }
  }, [remainingTime, modalState.mode]);

  // Reset modal state when modal opens
  useEffect(() => {
    if (open && modalState.mode !== 'warning') {
      setModalState({ mode: 'warning', error: null });
    }
  }, [open, modalState.mode]);

  /**
   * Handle "Stay Logged In" button click
   * Opens Google OAuth popup for re-authentication
   */
  const handleStayLoggedIn = () => {
    setModalState({ mode: 'loading', error: null });
    googleLogin();
  };

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        // Prevent closing by clicking backdrop or pressing ESC
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
          return;
        }
      }}
      disableEscapeKeyDown
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: shadows.card,
        },
      }}
    >
      {/* Top accent bar */}
      <Box
        sx={{
          height: 4,
          background: `linear-gradient(90deg, ${redTheme.dark} 0%, ${redTheme.light} 100%)`,
        }}
      />

      <DialogContent sx={{ textAlign: 'center', pt: 4, pb: 3 }}>
        {/* Icon with Avatar and Zoom animation */}
        <Zoom in={open} timeout={400}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Avatar
              sx={{
                width: 72,
                height: 72,
                bgcolor: redTheme.main,
                boxShadow: shadows.avatar,
              }}
            >
              {modalState.mode === 'expired' ? (
                <ReportProblem sx={{ fontSize: 36, color: redTheme.contrastText }} />
              ) : (
                <AccessTime sx={{ fontSize: 36, color: redTheme.contrastText }} />
              )}
            </Avatar>
          </Box>
        </Zoom>

        {/* Title with Fade animation */}
        <Fade in={open} timeout={500} style={{ transitionDelay: '100ms' }}>
          <Typography
            variant="h5"
            component="h2"
            sx={{
              fontFamily: googleFonts.display,
              fontWeight: 600,
              color: redTheme.dark,
              mb: 1.5,
            }}
          >
            {modalState.mode === 'expired' ? 'Session Expired' : 'Session Expiring Soon'}
          </Typography>
        </Fade>

        {/* Content based on mode */}
        <Fade in={open} timeout={500} style={{ transitionDelay: '200ms' }}>
          <Box>
            {modalState.mode === 'warning' && (
              <Typography
                variant="body1"
                sx={{
                  fontFamily: googleFonts.body,
                  color: 'text.secondary',
                  lineHeight: 1.6,
                }}
              >
                Your session is about to expire in{' '}
                <Box
                  component="span"
                  sx={{
                    fontWeight: 700,
                    color: redTheme.main,
                    fontFamily: googleFonts.display,
                  }}
                >
                  {formatTime(remainingTime)}
                </Box>
                . Please log in again to continue.
              </Typography>
            )}

            {modalState.mode === 'loading' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <CircularProgress size={28} sx={{ color: redTheme.main }} />
                <Typography
                  variant="body1"
                  sx={{
                    fontFamily: googleFonts.body,
                    color: 'text.secondary',
                  }}
                >
                  Opening login window...
                </Typography>
              </Box>
            )}

            {modalState.mode === 'expired' && (
              <Typography
                variant="body1"
                sx={{
                  fontFamily: googleFonts.body,
                  color: 'text.secondary',
                  lineHeight: 1.6,
                }}
              >
                Your session has expired. Please sign in again to continue.
              </Typography>
            )}
          </Box>
        </Fade>

        {modalState.error && (
          <Fade in timeout={300}>
            <Alert
              severity="error"
              sx={{
                mt: 2,
                fontFamily: googleFonts.body,
                borderRadius: 2,
              }}
            >
              {modalState.error}
            </Alert>
          </Fade>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          justifyContent: 'center',
          gap: 2,
          px: 3,
          pb: 3,
          pt: 0,
        }}
      >
        <Fade in={open} timeout={500} style={{ transitionDelay: '300ms' }}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            {modalState.mode === 'loading' ? null : modalState.mode === 'warning' ? (
              <>
                <Button
                  variant="contained"
                  onClick={handleStayLoggedIn}
                  startIcon={<Login />}
                  sx={{
                    fontFamily: googleFonts.display,
                    bgcolor: redTheme.main,
                    color: redTheme.contrastText,
                    px: 3,
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
                  Stay Logged In
                </Button>
                <Button
                  variant="outlined"
                  onClick={onLogOut}
                  startIcon={<Logout />}
                  sx={{
                    fontFamily: googleFonts.display,
                    borderColor: redTheme.main,
                    color: redTheme.main,
                    px: 3,
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
                  Log Out
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                onClick={onLogOut}
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
            )}
          </Box>
        </Fade>
      </DialogActions>
    </Dialog>
  );
};
