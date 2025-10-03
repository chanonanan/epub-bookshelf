import { GoogleProvider } from '@/providers/gdrive';
import { OneDriveProvider } from '@/providers/onedrive';
import type { StorageProvider } from '@/providers/storageProvider';
import { batchProcessor } from '@/services/batchProcessor';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type ProviderName = 'gdrive' | 'onedrive';

interface ProviderContextValue {
  provider: ProviderName | null;
  client: StorageProvider | null;
  token: string | null;
  loading: boolean;
  login: (provider: ProviderName) => Promise<void>;
  logout: () => void;
}

const ProviderContext = createContext<ProviderContextValue>({
  provider: null,
  client: null,
  token: null,
  loading: true,
  login: async () => {},
  logout: () => {},
});

export function ProviderProvider({ children }: { children: React.ReactNode }) {
  const [provider, setProvider] = useState<ProviderName | null>(null);
  const [client, setClient] = useState<StorageProvider | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load saved provider from IndexedDB/localStorage on startup
  useEffect(() => {
    const saved = localStorage.getItem(
      'currentProvider',
    ) as ProviderName | null;
    if (saved) {
      setProvider(saved);
      if (saved === 'gdrive') setClient(new GoogleProvider());
      if (saved === 'onedrive') setClient(new OneDriveProvider());
    }
  }, []);

  useEffect(() => {
    if (!client) {
      setToken(null);
      return;
    }

    const token = client.getToken();
    setToken(token);
    setLoading(false);
  }, [client]);

  useEffect(() => {
    batchProcessor.setTokenProvider(async (prov) => {
      if (prov === 'gdrive' && provider === 'gdrive') {
        return await client?.getToken(); // your GoogleProvider handles refresh
      }
      if (prov === 'onedrive' && provider === 'onedrive') {
        return await client?.getToken(); // OneDrive version
      }

      throw new Error('Unknown provider');
    });
  }, [provider, client]);

  const login = async (name: ProviderName) => {
    let instance: StorageProvider;
    if (name === 'gdrive') {
      instance = new GoogleProvider();
    } else {
      instance = new OneDriveProvider();
    }

    const ok = await instance.login();
    if (ok) {
      setProvider(name);
      setClient(instance);
      localStorage.setItem('currentProvider', name);
    }
  };

  const logout = () => {
    client?.logout();
    setProvider(null);
    setClient(null);
    localStorage.removeItem('currentProvider');
  };

  return (
    <ProviderContext.Provider
      value={{ provider, client, token, loading, login, logout }}
    >
      {children}
    </ProviderContext.Provider>
  );
}

// Hook for components
export function useProvider() {
  return useContext(ProviderContext);
}
