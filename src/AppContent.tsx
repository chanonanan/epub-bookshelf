import localforage from 'localforage';
import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import type { LibraryFolder } from './types/library';

const HomePage = lazy(() => import('./pages/HomePage'));
const BookshelfPage = lazy(() => import('./pages/BookshelfPage'));
const SeriesPage = lazy(() => import('./pages/SeriesPage'));
const BookDetailsPage = lazy(() => import('./pages/BookDetailsPage'));

export const AppContent = () => {
  const [libraryFolders, setLibraryFolders] = useState<LibraryFolder[]>([]);
  const libraryFoldersRef = useRef(libraryFolders);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingFolders, setIsLoadingFolders] = useState(true);

  useEffect(() => {
    const loadFolders = async () => {
      try {
        const savedFolders =
          await localforage.getItem<LibraryFolder[]>('libraryFolders');
        const legacyFolders =
          await localforage.getItem<LibraryFolder[]>('recentFolders');
        const folders = savedFolders ?? legacyFolders ?? [];
        libraryFoldersRef.current = folders;
        setLibraryFolders(folders);
        if (!savedFolders && legacyFolders) {
          await localforage.setItem('libraryFolders', legacyFolders);
        }
      } catch (error) {
        console.error('Failed to load bookshelf folders:', error);
      } finally {
        setIsLoadingFolders(false);
      }
    };
    void loadFolders();
  }, []);

  const saveFolders = useCallback(
    async (update: (folders: LibraryFolder[]) => LibraryFolder[]) => {
      const folders = update(libraryFoldersRef.current);
      libraryFoldersRef.current = folders;
      await localforage.setItem('libraryFolders', folders);
      setLibraryFolders(folders);
    },
    [],
  );

  const handleFolderPicked = useCallback(
    async (id: string, name: string) => {
      await saveFolders((folders) => {
        const currentFolder = folders.find((folder) => folder.id === id);
        return currentFolder
          ? folders.map((folder) =>
              folder.id === id ? { ...folder, name } : folder,
            )
          : [...folders, { id, name, lastUpdate: new Date().toISOString() }];
      });
    },
    [saveFolders],
  );

  const handleRemoveFolder = useCallback(
    async (id: string) => {
      await saveFolders((folders) =>
        folders.filter((folder) => folder.id !== id),
      );
    },
    [saveFolders],
  );

  const handleFolderCountsChange = useCallback(
    async (counts: Record<string, number>) => {
      await saveFolders((folders) =>
        folders.map((folder) =>
          counts[folder.id] === undefined
            ? folder
            : { ...folder, bookCount: counts[folder.id] },
        ),
      );
    },
    [saveFolders],
  );

  const handleFolderRefreshed = useCallback(
    async (id: string, bookCount: number) => {
      await saveFolders((folders) =>
        folders.map((folder) =>
          folder.id === id
            ? { ...folder, bookCount, lastUpdate: new Date().toISOString() }
            : folder,
        ),
      );
    },
    [saveFolders],
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onSearchChange={setSearchQuery} />
      <main className="flex-1 container-wrapper mx-auto max-w-7xl px-4">
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  isLoadingFolders={isLoadingFolders}
                  libraryFolders={libraryFolders}
                  onFolderSelect={handleFolderPicked}
                  onFolderRemove={handleRemoveFolder}
                  onFolderCountsChange={handleFolderCountsChange}
                  onFolderRefreshed={handleFolderRefreshed}
                />
              }
            />
            <Route
              path="/bookshelf"
              element={
                <BookshelfPage
                  folders={libraryFolders}
                  searchQuery={searchQuery}
                />
              }
            />
            <Route
              path="/series/:series"
              element={
                <SeriesPage
                  folders={libraryFolders}
                  searchQuery={searchQuery}
                />
              }
            />
            <Route
              path="/book/:id"
              element={<BookDetailsPage folders={libraryFolders} />}
            />
            <Route
              path="/bookshelf/:legacyPath"
              element={<LegacyBookshelfRedirect />}
            />
            <Route
              path="/bookshelf/:legacyFolder/:legacySeries"
              element={<LegacyBookshelfRedirect />}
            />
            <Route
              path="/book/:legacyFolder/:legacySeries/:legacyId"
              element={<LegacyBookRedirect />}
            />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
};

function LegacyBookshelfRedirect() {
  const { legacySeries } = useParams();
  return legacySeries ? (
    <Navigate to={`/series/${encodeURIComponent(legacySeries)}`} replace />
  ) : (
    <Navigate to="/bookshelf" replace />
  );
}

function LegacyBookRedirect() {
  const { legacyId } = useParams();
  return <Navigate to={`/book/${legacyId}`} replace />;
}
