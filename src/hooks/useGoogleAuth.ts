import { clearTokens, getTokens, setTokens } from '@/lib/googleDrive';
import { useGoogleLogin } from '@react-oauth/google';
import { useEffect, useState } from 'react';

export interface UseGoogleAuthResult {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  checkTokens: () => Promise<void>;
  signIn: () => void;
  signOut: () => Promise<void>;
}

export function useGoogleAuth(): UseGoogleAuthResult {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkTokens = async () => {
    console.log('Checking Google OAuth tokens...');
    setIsLoading(true);
    try {
      const token = await getTokens();
      setIsAuthenticated(!!token);
    } catch (err) {
      console.error('Error fetching tokens:', err);
      setError('Failed to authenticate with Google. Please try again.');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const onSuccessLogin = async (tokenResponse: TokenResponse) => {
    console.log('Login Success:', tokenResponse);
    await setTokens(tokenResponse);
    await checkTokens();
  };

  const googleLogin = useGoogleLogin({
    onSuccess: onSuccessLogin,
    onError: () => {
      console.log('One Tap Login Failed');
    },
    scope: 'https://www.googleapis.com/auth/drive.readonly',
  });

  const signIn = () => {
    setIsLoading(true);
    googleLogin();
  };

  const signOut = async () => {
    await clearTokens();
    setIsAuthenticated(false);
  };

  useEffect(() => {
    checkTokens();
  }, []);

  return { isAuthenticated, isLoading, error, signIn, signOut, checkTokens };
}
