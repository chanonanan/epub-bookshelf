import { useNavigate, useParams, Routes, Route } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import localforage from 'localforage';
import { Navbar } from './components/Navbar';
import HomePage from './pages/HomePage';
import BookshelfPage from './pages/BookshelfPage';
import SeriesPage from './pages/SeriesPage';
import BookDetailsPage from './pages/BookDetailsPage';

export const AppContent = () => {
  const navigate = useNavigate();
  const { folderId } = useParams();
  const [recentFolders, setRecentFolders] = useState<Array<{ id: string; name: string; lastUpdate: string }>>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Load recent folders from storage
    const loadRecentFolders = async () => {
      const folders = await localforage.getItem<typeof recentFolders>('recentFolders') || [];
      setRecentFolders(folders);
    };
    loadRecentFolders();
  }, []);

  const handleFolderSelect = useCallback((id: string) => {
    navigate(`/bookshelf/${id}`);
  }, [navigate]);

  const handleAddFolder = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const currentFolder = recentFolders.find(f => f.id === folderId);

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
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/bookshelf/:folderId" element={<BookshelfPage searchQuery={searchQuery} />} />
          <Route path="/bookshelf/:folderId/:series" element={<SeriesPage searchQuery={searchQuery} />} />
          <Route path="/book/:id" element={<BookDetailsPage />} />
        </Routes>
      </main>
    </div>
  );
};