import { AuthProvider } from '@/auth/AuthProvider';
import { PrivateRoute } from '@/auth/PrivateRoute';
import { ModeToggle } from '@/components/ModeToggle';
import { useLoading } from '@/hooks/useLoading';
import LoginPage from '@/pages/LoginPage';
import { Suspense, lazy, useEffect, useState, type JSX } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { Navbar } from '../components/Navbar';

// lazy imports (code-splitting)
const HomePage = lazy(() => import('../pages/HomePage'));
const BookshelfPage = lazy(() => import('../pages/BookshelfPage'));
const SeriesPage = lazy(() => import('../pages/SeriesPage'));
const BookDetailsPage = lazy(() => import('../pages/BookDetailsPage'));

export const AppContent = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <Suspense fallback={<LoadingRoute />}>
          <Routes>
            {/* Base routes */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <PageWithNoNavbar>
                    <HomePage />
                  </PageWithNoNavbar>
                </PrivateRoute>
              }
            />
            {/* Redirect empty path to / */}
            <Route path="" element={<Navigate to="/" replace />} />
            <Route
              path="/login"
              element={
                <PageWithNoNavbar>
                  <LoginPage />
                </PageWithNoNavbar>
              }
            />

            {/* Other routes */}
            <Route
              element={
                <>
                  <Navbar onSearchChange={setSearchQuery} />
                  <main className="flex-1 container-wrapper mx-auto max-w-7xl px-4">
                    <Outlet />
                  </main>
                </>
              }
            >
              <Route
                path="/bookshelf/:folderId"
                element={
                  <PrivateRoute>
                    <BookshelfPage searchQuery={searchQuery} />
                  </PrivateRoute>
                }
              />
              <Route
                path="/bookshelf/:folderId/:series"
                element={
                  <PrivateRoute>
                    <SeriesPage searchQuery={searchQuery} />
                  </PrivateRoute>
                }
              />
              <Route
                path="/book/:folderId/:series/:id"
                element={
                  <PrivateRoute>
                    <BookDetailsPage />
                  </PrivateRoute>
                }
              />
            </Route>
          </Routes>
        </Suspense>
      </div>
    </AuthProvider>
  );
};

function LoadingRoute() {
  const { setLoading } = useLoading();

  useEffect(() => {
    setLoading(true);
    return () => setLoading(false);
  }, [setLoading]);

  return null;
}

function PageWithNoNavbar({ children }: { children: JSX.Element }) {
  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur">
        <div className="container-wrapper flex h-14 items-center justify-end">
          <ModeToggle />
        </div>
      </header>
      <main className="flex flex-1 mx-auto">
        <div className="bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-playfair font-bold text-foreground mb-2">
                EPUB Bookshelf
              </h1>
              <p className="text-muted-foreground">
                Your digital library from Google Drive
              </p>
            </div>
            {children}
          </div>
        </div>
      </main>
    </>
  );
}
