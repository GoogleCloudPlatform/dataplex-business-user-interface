import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

type Props = {
  children: React.ReactElement;
};

export const ProtectedRoute = ({ children }: Props) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" />;
  return children;
};
