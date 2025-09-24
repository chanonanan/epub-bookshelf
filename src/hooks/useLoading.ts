import { createContext, useContext } from 'react';

interface LoadingContextType {
  loading: boolean;
  message?: string;
  setLoading: (value: boolean, message?: string) => void;
}

export const LoadingContext = createContext<LoadingContextType | undefined>(
  undefined,
);

export const useLoading = () => {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error('useLoading must be used inside LoadingProvider');
  return ctx;
};
