import { useEffect, useState } from 'react';
import { initializeGoogleAuth, getTokens } from '@/googleDrive';

export interface UseGoogleAuthResult {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  tokens: GoogleTokens | null;
}

export function useGoogleAuth(): UseGoogleAuthResult {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokens, setTokens] = useState<GoogleTokens | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await initializeGoogleAuth();
        const tokens = await getTokens();
        if (tokens) {
          setTokens(tokens);
          setIsAuthenticated(true);
        } else {
          setError('Failed to get authentication tokens');
        }
      } catch (err) {
        console.error('Failed to initialize Google Auth:', err);
        setError('Failed to authenticate with Google');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  return { isAuthenticated, isLoading, error, tokens };
}