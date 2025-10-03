import { useProvider } from '@/app/providers';
import type { JSX } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { token, loading } = useProvider();
  const location = useLocation();

  if (!token && !loading) {
    // Redirect to login, carrying the original path in state
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};
