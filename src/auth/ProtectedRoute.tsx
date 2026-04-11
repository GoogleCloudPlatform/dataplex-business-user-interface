import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

type Props = {
  children: React.ReactElement;
  adminOnly?: boolean;
};

export const ProtectedRoute = ({ children, adminOnly }: Props) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" />;
  if (adminOnly && !user.isAdmin) return <Navigate to="/home" />;
  return children;
};
