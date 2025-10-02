import { Layout } from '@/components/layout/Layout';
import { PrivateRoute } from '@/components/layout/PrivateRoute';
import { ThemeProvider } from '@/components/ThemeProvider';
import { db } from '@/db/schema';
import BookDetailsPage from '@/pages/BookDetailsPage';
import BookshelfPage from '@/pages/BookshelfPage';
import FoldersPage from '@/pages/FoldersPage';
import LoginPage from '@/pages/LoginPage';
import ReaderPage from '@/pages/ReaderPage';
import { useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProviderProvider } from './providers';

export default function App() {
  useEffect(() => {
    db.open().catch((err) => {
      console.error('Failed to open DB', err);
    });
  }, []);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <ProviderProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/:provider"
              element={
                <PrivateRoute>
                  <Layout>
                    <FoldersPage />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/:provider/folder/:folderId"
              element={
                <PrivateRoute>
                  <Layout className="container max-w-5xl h-full flex mx-auto">
                    <BookshelfPage />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/:provider/file/:fileId"
              element={
                <PrivateRoute>
                  <Layout className="container max-w-5xl mx-auto">
                    <BookDetailsPage />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/:provider/file/:fileId/reader"
              element={
                <PrivateRoute>
                  <Layout className="container max-w-5xl mx-auto">
                    <ReaderPage />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </HashRouter>
      </ProviderProvider>
    </ThemeProvider>
  );
}
