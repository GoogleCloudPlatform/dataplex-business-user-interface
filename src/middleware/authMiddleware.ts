import { type Middleware } from '@reduxjs/toolkit';
import { handleAuthenticationError } from '../services/authErrorService';

export const authMiddleware: Middleware = () => (next) => (action: any) => {
  if (action.type === 'auth/authenticationError') {
    console.log('Authentication error detected in RTK Query');
    handleAuthenticationError();
  }

  return next(action);
};
