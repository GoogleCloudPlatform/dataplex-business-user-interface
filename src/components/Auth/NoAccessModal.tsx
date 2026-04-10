import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  Avatar,
  Zoom,
  Fade,
} from '@mui/material';
import { GppBad, Login } from '@mui/icons-material';

// Material Design red color palette (matching SessionWarningModal)
const redTheme = {
  main: '#D32F2F',
  light: '#EF5350',
  dark: '#C62828',
  lighter: '#FFEBEE',
  contrastText: '#FFFFFF',
};

const shadows = {
  card: '0 4px 24px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
  button: '0 2px 8px rgba(0, 0, 0, 0.1)',
  buttonHover: '0 4px 12px rgba(0, 0, 0, 0.15)',
  avatar: '0 2px 12px rgba(0, 0, 0, 0.1)',
};

const googleFonts = {
  display: '"Google Sans", "Roboto", "Helvetica", "Arial", sans-serif',
  body: '"Google Sans Text", "Roboto", "Helvetica", "Arial", sans-serif',
};

interface NoAccessModalProps {
  open: boolean;
  message?: string | null;
  onSignIn: () => void;
}

export const NoAccessModal: React.FC<NoAccessModalProps> = ({
  open,
  message,
  onSignIn,
}) => {
  const displayMessage =
    message ||
    'You do not have permission to access this resource. This may be because you did not grant the required permissions during sign-in, or your account lacks the necessary roles. Please sign in again and ensure all requested permissions are accepted.';

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
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
              <GppBad sx={{ fontSize: 36, color: redTheme.contrastText }} />
            </Avatar>
          </Box>
        </Zoom>

        {/* Title */}
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
            Access Denied
          </Typography>
        </Fade>

        {/* Message */}
        <Fade in={open} timeout={500} style={{ transitionDelay: '200ms' }}>
          <Typography
            variant="body1"
            sx={{
              fontFamily: googleFonts.body,
              color: 'text.secondary',
              lineHeight: 1.6,
            }}
          >
            {displayMessage}
          </Typography>
        </Fade>
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
            <Button
              variant="contained"
              onClick={onSignIn}
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
              Sign In Again
            </Button>
          </Box>
        </Fade>
      </DialogActions>

      {/* Footer text */}
      <Fade in={open} timeout={500} style={{ transitionDelay: '400ms' }}>
        <Box
          sx={{
            textAlign: 'center',
            px: 3,
            pb: 3,
            pt: 0,
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
            If you continue to experience issues, please contact your system administrator.
          </Typography>
        </Box>
      </Fade>
    </Dialog>
  );
};
