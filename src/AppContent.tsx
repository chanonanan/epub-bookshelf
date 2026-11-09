import localforage from 'localforage';
import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { MobileNavigation } from './components/MobileNavigation';
import { AppUpdateManager } from './components/AppUpdateManager';
import type { LibraryFolder } from './types/library';

const HomePage = lazy(() => import('./pages/HomePage'));
const BookshelfPage = lazy(() => import('./pages/BookshelfPage'));
const BookDetailsPage = lazy(() => import('./pages/BookDetailsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

export const AppContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const previousPathRef = useRef(location.pathname);
  const scrollPositionsRef = useRef(new Map<string, number>());
  const [libraryFolders, setLibraryFolders] = useState<LibraryFolder[]>([]);
  const [devTestFolders, setDevTestFolders] = useState<LibraryFolder[] | null>(
    null,
  );
  const libraryFoldersRef = useRef(libraryFolders);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingFolders, setIsLoadingFolders] = useState(true);

  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    const saveScrollPosition = () => {
      scrollPositionsRef.current.set(previousPathRef.current, window.scrollY);
    };
    window.addEventListener('scroll', saveScrollPosition, { passive: true });
    document.addEventListener('click', saveScrollPosition, true);
    return () => {
      window.removeEventListener('scroll', saveScrollPosition);
      document.removeEventListener('click', saveScrollPosition, true);
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  useLayoutEffect(() => {
    previousPathRef.current = location.pathname;

    const locationState = location.state as { restoreScrollY?: number } | null;
    const scrollY =
      locationState?.restoreScrollY ??
      scrollPositionsRef.current.get(location.pathname) ??
      0;
    const timer = window.setTimeout(() => {
      window.scrollTo({ top: scrollY, behavior: 'auto' });
    }, 100);

    return () => window.clearTimeout(timer);
  }, [location.pathname, location.state]);

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

  const handleLoadDevTestData = import.meta.env.DEV
    ? async (onProgress: (loaded: number, total: number) => void) => {
        const { loadDevTestFolders } = await import('./devTestData');
        const folders = await loadDevTestFolders(onProgress);
        setDevTestFolders(folders);
        navigate('/bookshelf');
      }
    : undefined;

  return (
    <AppUpdateManager>
      <div className="app-shell flex flex-col">
        <Navbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <main className="app-main flex-1 container-wrapper mx-auto max-w-7xl px-4">
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
              <Route
                path="/"
                element={
                  <HomePage
                    isLoadingFolders={isLoadingFolders}
                    libraryFolders={libraryFolders}
                    onLoadDevTestData={handleLoadDevTestData}
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
                    folders={devTestFolders ?? libraryFolders}
                    searchQuery={searchQuery}
                  />
                }
              />
              <Route
                path="/series/:series"
                element={<SeriesBookshelfRedirect />}
              />
              <Route
                path="/book/:id"
                element={
                  <BookDetailsPage
                    folders={devTestFolders ?? libraryFolders}
                    onSearchChange={setSearchQuery}
                  />
                }
              />
              <Route path="/settings" element={<SettingsPage />} />
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
        <MobileNavigation
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>
    </AppUpdateManager>
  );
};

function LegacyBookshelfRedirect() {
  const { legacySeries } = useParams();
  return legacySeries ? (
    <Navigate
      to={`/bookshelf?series=${encodeURIComponent(legacySeries)}&groupBy=none`}
      replace
    />
  ) : (
    <Navigate to="/bookshelf" replace />
  );
}

function SeriesBookshelfRedirect() {
  const { series } = useParams();
  const location = useLocation();
  return (
    <Navigate
      to={`/bookshelf?series=${encodeURIComponent(series ?? '')}&groupBy=none`}
      state={location.state}
      replace
    />
  );
}

function LegacyBookRedirect() {
  const { legacyId } = useParams();
  return <Navigate to={`/book/${legacyId}`} replace />;
}
