import type { JSX } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

export const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { token } = useAuth();
  const location = useLocation();

  if (!token) {
    // Redirect to login, carrying the original path in state
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};
