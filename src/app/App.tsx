import { ThemeProvider } from '@/components/ThemeProvider';
import { db } from '@/db/schema';
import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ProviderProvider } from './providers';
import { router } from './Router';

export default function App() {
  useEffect(() => {
    db.open().catch((err) => {
      console.error('Failed to open DB', err);
    });
  }, []);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <ProviderProvider>
        <RouterProvider router={router} />
      </ProviderProvider>
    </ThemeProvider>
  );
}
