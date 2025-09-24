import { Suspense, lazy, useCallback, useState, useEffect } from 'react';
import { Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { useRecentFolders } from './hooks';

// lazy imports (code-splitting)
const HomePage = lazy(() => import('./pages/HomePage'));
const BookshelfPage = lazy(() => import('./pages/BookshelfPage'));
const SeriesPage = lazy(() => import('./pages/SeriesPage'));
const BookDetailsPage = lazy(() => import('./pages/BookDetailsPage'));

export const AppContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentFolderId, setCurrentFolderId] = useState<string>();
  const { recentFolders, currentFolder } = useRecentFolders(currentFolderId);
  const [searchQuery, setSearchQuery] = useState('');

  // Extract folderId from path
  useEffect(() => {
    // Match both /bookshelf/:folderId and /book/:folderId routes
    const match = location.pathname.match(/\/(bookshelf|book)\/([^\/]+)/);
    setCurrentFolderId(match ? match[2] : undefined);
  }, [location]);

  const handleFolderSelect = useCallback(
    (id: string) => {
      navigate(`/bookshelf/${id}`);
    },
    [navigate],
  );

  const handleAddFolder = useCallback(() => {
    navigate('/');
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        currentFolderId={currentFolderId}
        currentFolderName={currentFolder?.name}
        onFolderSelect={handleFolderSelect}
        onSearchChange={setSearchQuery}
        onAddFolder={handleAddFolder}
        lastUpdate={currentFolder?.lastUpdate}
        recentFolders={recentFolders}
      />
      <main className="flex-1 container-wrapper mx-auto max-w-7xl px-4">
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
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
          </Routes>
        </Suspense>
      </main>
    </div>
  );
};
