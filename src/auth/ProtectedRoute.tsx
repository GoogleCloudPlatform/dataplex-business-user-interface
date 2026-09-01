import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { isExplicitSignOutRecent } from '../services/urlPreservationService';

type Props = {
  children: React.ReactElement;
};

export const ProtectedRoute = ({ children }: Props) => {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) {
    // A deliberate "Sign out" click shouldn't send the user back to the resource
    // they were on — skip the continue param regardless of render/batching timing
    // relative to UserAccountDropdown's own navigate('/login') call.
    if (isExplicitSignOutRecent()) {
      return <Navigate to="/login" replace />;
    }
    const continueUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?continue=${continueUrl}`} replace />;
  }
  return children;
};
