import React, { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import { Snackbar, Alert } from '@mui/material';

export type NotificationSeverity = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  message: string;
  type: NotificationSeverity;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationContextType {
  showNotification: (message: string, type?: NotificationSeverity, duration?: number, action?: { label: string; onClick: () => void }) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
  maxNotifications?: number;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ 
  children, 
  maxNotifications = 3 
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const showNotification = useCallback((
    message: string, 
    type: NotificationSeverity = 'info', 
    duration = 5000,
    action?: { label: string; onClick: () => void },
  ) => {
    const id = Math.random().toString(36).substring(2, 11);
    const newNotification: Notification = {
      id,
      message,
      type,
      duration,
      action,
    };

    setNotifications(prev => {
      const updated = [...prev, newNotification];
      // Keep only the most recent notifications
      return updated.slice(-maxNotifications);
    });

    // Auto-remove notification after duration
    if (duration > 0) {
      setTimeout(() => {
        clearNotification(id);
      }, duration);
    }
  }, [maxNotifications, clearNotification]);

  const showSuccess = useCallback((message: string, duration = 4000) => {
    showNotification(message, 'success', duration);
  }, [showNotification]);

  const showError = useCallback((message: string, duration = 6000) => {
    showNotification(message, 'error', duration);
  }, [showNotification]);

  const showWarning = useCallback((message: string, duration = 5000) => {
    showNotification(message, 'warning', duration);
  }, [showNotification]);

  const showInfo = useCallback((message: string, duration = 4000) => {
    showNotification(message, 'info', duration);
  }, [showNotification]);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const handleClose = useCallback((id: string, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    clearNotification(id);
  }, [clearNotification]);

  const value: NotificationContextType = useMemo(() => ({
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearNotification,
    clearAllNotifications
  }), [showNotification, showSuccess, showError, showWarning, showInfo, clearNotification, clearAllNotifications]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      
      {/* Render all notifications */}
      {notifications.map((notification, index) => (
        <Snackbar
          key={notification.id}
          open={true}
          autoHideDuration={notification.duration}
          onClose={(_event, reason) => handleClose(notification.id, reason)}
          anchorOrigin={{ 
            vertical: 'bottom', 
            horizontal: 'center' 
          }}
          sx={{
            zIndex: 1500 + index,
            bottom: `${24 + (index * 70)}px !important`,
            transition: 'bottom 0.3s ease-out',
            '& .MuiSnackbarContent-root': {
              minWidth: '300px'
            }
          }}
        >
          <Alert
            onClose={() => handleClose(notification.id)}
            severity={notification.type}
            sx={{ 
              width: '100%',
              '& .MuiAlert-message': {
                fontSize: '14px',
                fontWeight: 400
              },
              '& .MuiAlert-action': {
                paddingLeft: '8px'
              }
            }}
            action={notification.action ? (
              <button
                onClick={notification.action.onClick}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'inherit',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  padding: '4px 8px',
                  marginLeft: '8px'
                }}
              >
                {notification.action.label}
              </button>
            ) : undefined}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </NotificationContext.Provider>
  );
};
