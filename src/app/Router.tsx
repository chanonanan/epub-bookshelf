import { Layout } from '@/components/layout/Layout';
import { PrivateRoute } from '@/components/layout/PrivateRoute';
import BookDetailsPage from '@/pages/BookDetailsPage';
import BookshelfPage from '@/pages/BookshelfPage';
import FoldersPage from '@/pages/FoldersPage';
import LoginPage from '@/pages/LoginPage';
import ReaderPage from '@/pages/ReaderPage';
import { createHashRouter, Navigate } from 'react-router-dom';

export const router = createHashRouter([
  {
    path: '/',
    children: [
      { path: 'login', element: <LoginPage /> },
      {
        path: ':provider',
        element: (
          <PrivateRoute>
            <Layout className="container max-w-5xl mx-auto">
              <FoldersPage />
            </Layout>
          </PrivateRoute>
        ),
      },
      {
        path: ':provider/folder/:folderId',
        element: (
          <PrivateRoute>
            <Layout className="container max-w-5xl h-full flex mx-auto">
              <BookshelfPage />
            </Layout>
          </PrivateRoute>
        ),
      },
      {
        path: ':provider/file/:fileId',
        element: (
          <PrivateRoute>
            <Layout className="container max-w-5xl mx-auto">
              <BookDetailsPage />
            </Layout>
          </PrivateRoute>
        ),
      },
      {
        path: ':provider/file/:fileId/reader',
        element: (
          <PrivateRoute>
            <Layout className="container max-w-5xl mx-auto">
              <ReaderPage />
            </Layout>
          </PrivateRoute>
        ),
      },
      { path: '/', element: <Navigate to="/login" replace /> },
      { path: '*', element: <Navigate to="/login" replace /> },
    ],
  },
]);
