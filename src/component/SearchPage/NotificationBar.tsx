import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';

/**
 * @file NotificationBar.tsx
 * @description
 * This component renders a "snackbar" or "toast" style notification bar that
 * appears fixed at the bottom-center of the screen.
 *
 * It is designed to show a message (e.g., "Action complete") and provide
 * "Undo" and "Close" actions. Its visibility is controlled externally by the
 * `isVisible` prop, and it includes a simple slide-up animation when it
 * appears.
 *
 * @param {NotificationBarProps} props - The props for the component.
 * @param {boolean} props.isVisible - If true, the notification bar is
 * rendered; otherwise, it returns null.
 * @param {() => void} props.onClose - Callback function that is triggered
 * when the 'X' (close) icon is clicked.
 * @param {() => void} props.onUndo - Callback function that is triggered
 * when the "Undo" text is clicked.
 * @param {string} props.message - The text message to be displayed in the
 * notification.
 *
 * @returns {React.ReactElement | null} A React element representing the
 * notification bar, or `null` if `isVisible` is false.
 */

interface NotificationBarProps {
  isVisible: boolean;
  onClose: () => void;
  onUndo: () => void;
  message: string;
}

const NotificationBar: React.FC<NotificationBarProps> = ({ 
  isVisible, 
  onClose, 
  onUndo, 
  message 
}) => {
  if (!isVisible) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#2D2D2D',
        borderRadius: '8px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 1400,
        minWidth: '200px',
        maxWidth: '400px',
        animation: 'slideUp 0.3s ease-out',
        '@keyframes slideUp': {
          '0%': {
            transform: 'translateX(-50%) translateY(100%)',
            opacity: 0
          },
          '100%': {
            transform: 'translateX(-50%) translateY(0)',
            opacity: 1
          }
        }
      }}
    >
      <Typography
        sx={{
          fontFamily: 'sans-serif',
          fontSize: '14px',
          fontWeight: '400',
          color: '#FFFFFF',
          flex: 1
        }}
      >
        {message}
      </Typography>
      
      <Typography
        onClick={onUndo}
        sx={{
          fontFamily: 'sans-serif',
          fontSize: '14px',
          fontWeight: '500',
          color: '#FFFFFF',
          cursor: 'pointer',
          '&:hover': {
            textDecoration: 'underline'
          }
        }}
      >
        Undo
      </Typography>
      
      <IconButton
        onClick={onClose}
        sx={{
          color: '#FFFFFF',
          padding: '4px',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)'
          }
        }}
      >
        <Close sx={{ fontSize: '18px' }} />
      </IconButton>
    </Box>
  );
};

export default NotificationBar;
