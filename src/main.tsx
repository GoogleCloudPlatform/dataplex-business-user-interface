import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom';
import { AuthWithProvider } from './auth/AuthProvider';
import { ThemeProvider } from '@mui/material/styles';
import { NotificationProvider } from './contexts/NotificationContext';
import { AccessRequestProvider } from './contexts/AccessRequestContext';
import ThemeSyncProvider from './contexts/ThemeSyncProvider';
import './utils/apiInterceptor'; // Set up axios interceptors
import './utils/testHelpers'; // Load testing helpers (available in console)
import theme from './theme';
import store from './app/store'
import App from './App'
import './index.css'
import './styles/dark-mode.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeSyncProvider>
        <BrowserRouter>
          <NotificationProvider>
            <AccessRequestProvider>
              <AuthWithProvider>
                <ThemeProvider theme={theme}>
                  <App />
                </ThemeProvider>
              </AuthWithProvider>
            </AccessRequestProvider>
          </NotificationProvider>
        </BrowserRouter>
      </ThemeSyncProvider>
    </Provider>
  </React.StrictMode>,
);
