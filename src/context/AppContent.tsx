import { ModeToggle } from '@/components/ModeToggle';
import { useLoading } from '@/hooks/useLoading';
import { Suspense, lazy, useEffect, useState } from 'react';
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
    <div className="min-h-screen flex flex-col">
      <Suspense fallback={<LoadingRoute />}>
        <Routes>
          {/* Base routes */}
          <Route
            path="/"
            element={
              <>
                <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur">
                  <div className="container-wrapper flex h-14 items-center justify-end">
                    <ModeToggle />
                  </div>
                </header>
                <main className="flex flex-1 mx-auto">
                  <HomePage />
                </main>
              </>
            }
          />
          {/* Redirect empty path to / */}
          <Route path="" element={<Navigate to="/" replace />} />

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
              element={<BookshelfPage searchQuery={searchQuery} />}
            />
            <Route
              path="/bookshelf/:folderId/:series"
              element={<SeriesPage searchQuery={searchQuery} />}
            />
            <Route
              path="/book/:folderId/:series/:id"
              element={<BookDetailsPage />}
            />
          </Route>
        </Routes>
      </Suspense>
    </div>
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
