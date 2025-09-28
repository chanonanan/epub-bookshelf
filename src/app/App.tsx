import { Layout } from '@/components/layout/Layout';
import { ThemeProvider } from '@/components/ThemeProvider';
import { db } from '@/db/schema';
import BookDetailsPage from '@/pages/BookDetailsPage';
import BookshelfPage from '@/pages/BookshelfPage';
import FoldersPage from '@/pages/FoldersPage';
import LoginPage from '@/pages/LoginPage';
import ReaderPage from '@/pages/ReaderPage';
import { useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
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
                <Layout>
                  <FoldersPage />
                </Layout>
              }
            />
            <Route
              path="/:provider/folder/:folderId"
              element={
                <Layout>
                  <BookshelfPage />
                </Layout>
              }
            />
            <Route
              path="/:provider/file/:fileId"
              element={
                <Layout>
                  <BookDetailsPage />
                </Layout>
              }
            />
            <Route
              path="/:provider/file/:fileId/reader"
              element={
                <Layout>
                  <ReaderPage />
                </Layout>
              }
            />

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </HashRouter>
      </ProviderProvider>
    </ThemeProvider>
  );
}
