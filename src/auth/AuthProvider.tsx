import { GoogleTokenUtil } from '@/lib/googleDrive';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  token: GoogleToken | null;
  login: () => Promise<GoogleToken>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<GoogleToken | null>(null);

  useEffect(() => {
    const getCachedToken = async () => {
      const cachedToken = await GoogleTokenUtil.getToken();
      if (cachedToken) {
        setToken(cachedToken);
      }
    };

    getCachedToken();
  }, []);

  const login = (): Promise<GoogleToken> => {
    return new Promise<GoogleToken>((resolve, reject) => {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.readonly',
        callback: async (resp) => {
          console.log('Token Response:', resp);
          if (resp.error) {
            reject(resp);
            return;
          }

          const token = await GoogleTokenUtil.setToken(resp);
          if (!token) {
            reject(new Error('Failed to set token'));
            return;
          }

          setToken(token);
          resolve(token);
        },
        error_callback: (err) => {
          reject(err);
        },
      });

      client.requestAccessToken();
    });
  };

  const logout = () => {
    setToken(null);
    GoogleTokenUtil.setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth used outside AuthProvider');
  }
  return ctx;
}
