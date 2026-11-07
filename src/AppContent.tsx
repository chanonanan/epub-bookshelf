import localforage from 'localforage';
import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { Navbar } from './components/Navbar';

// lazy imports (code-splitting)
const HomePage = lazy(() => import('./pages/HomePage'));
const BookshelfPage = lazy(() => import('./pages/BookshelfPage'));
const SeriesPage = lazy(() => import('./pages/SeriesPage'));
const BookDetailsPage = lazy(() => import('./pages/BookDetailsPage'));

export const AppContent = () => {
  const navigate = useNavigate();
  const { folderId } = useParams();
  const [recentFolders, setRecentFolders] = useState<
    Array<{ id: string; name: string; lastUpdate: string }>
  >([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadRecentFolders = async () => {
      const folders =
        (await localforage.getItem<typeof recentFolders>('recentFolders')) ||
        [];
      setRecentFolders(folders);
    };
    loadRecentFolders();
  }, []);

  const handleFolderSelect = useCallback(
    (id: string) => {
      navigate(`/bookshelf/${id}`);
    },
    [navigate],
  );

  const handleFolderPicked = useCallback(
    async (id: string, name: string) => {
      const updatedFolders = [
        { id, name, lastUpdate: new Date().toISOString() },
        ...recentFolders.filter((folder) => folder.id !== id).slice(0, 4),
      ];
      await localforage.setItem('recentFolders', updatedFolders);
      setRecentFolders(updatedFolders);
      navigate(`/bookshelf/${id}`);
    },
    [navigate, recentFolders],
  );

  const handleAddFolder = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const currentFolder = recentFolders.find((f) => f.id === folderId);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        currentFolderId={folderId}
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
            <Route
              path="/"
              element={
                <HomePage
                  onFolderSelect={handleFolderPicked}
                  recentFolders={recentFolders}
                  onRecentFolderSelect={handleFolderSelect}
                />
              }
            />
            <Route
              path="/bookshelf/:folderId"
              element={
                <BookshelfPage
                  folderName={currentFolder?.name}
                  searchQuery={searchQuery}
                />
              }
            />
            <Route
              path="/bookshelf/:folderId/:series"
              element={
                <SeriesPage
                  folderName={currentFolder?.name}
                  searchQuery={searchQuery}
                />
              }
            />
            <Route
              path="/book/:folderId/:series/:id"
              element={<BookDetailsPage folderName={currentFolder?.name} />}
            />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
};
