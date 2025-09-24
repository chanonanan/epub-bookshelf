import { LoadingContext } from '@/hooks/useLoading';
import { useState, type ReactNode } from 'react';

export const LoadingProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoadingState] = useState(false);
  const [message, setMessage] = useState<string | undefined>(undefined);

  const setLoading = (value: boolean, msg?: string) => {
    requestAnimationFrame(() => {
      setLoadingState(value);
      setMessage(msg);

      if (value) {
        document.body.classList.add('overflow-hidden');
      } else {
        document.body.classList.remove('overflow-hidden');
      }
    });
  };

  return (
    <LoadingContext.Provider value={{ loading, message, setLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};
