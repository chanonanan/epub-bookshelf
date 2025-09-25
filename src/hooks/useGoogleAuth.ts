import { getTokens } from '@/lib/googleDrive';
import { useEffect, useState } from 'react';

export interface UseGoogleAuthResult {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  tokens: GoogleTokens | null;
  checkTokens: () => Promise<void>;
}

export function useGoogleAuth(): UseGoogleAuthResult {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokens, setTokens] = useState<GoogleTokens | null>(null);

  const checkTokens = async () => {
    console.log('Checking Google OAuth tokens...');
    setIsLoading(true);
    try {
      const token = await getTokens();
      if (token) {
        setTokens(token);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error('Error fetching tokens:', err);
      setError('Failed to authenticate with Google. Please try again.');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkTokens();
  }, []);

  return { isAuthenticated, isLoading, error, tokens, checkTokens };
}
