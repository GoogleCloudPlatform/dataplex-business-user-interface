import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom';
import { AuthWithProvider } from './auth/AuthProvider';
import { ThemeProvider } from '@mui/material/styles';
import { NotificationProvider } from './contexts/NotificationContext';
import './utils/apiInterceptor'; // Set up axios interceptors
import theme from './theme';
import store from './app/store'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <NotificationProvider>
          <AuthWithProvider>
            <ThemeProvider theme={theme}>
              <App />
            </ThemeProvider>
          </AuthWithProvider>
        </NotificationProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);
