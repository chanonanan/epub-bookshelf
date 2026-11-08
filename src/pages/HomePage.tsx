import FolderPicker from '@/components/FolderPicker';
import { Button } from '@/components/ui/button';
import type { LibraryFolder } from '@/types/library';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  BookOpen,
  FolderOpen,
  Database,
  MoreHorizontal,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBooksInFolder } from '../epubUtils';
import { initializeGoogleAuth, listEpubFiles } from '../googleDrive';
import { useTranslate } from '@/lib/useTranslate';

interface HomePageProps {
  isLoadingFolders: boolean;
  libraryFolders: LibraryFolder[];
  onLoadDevTestData?: (
    onProgress: (loaded: number, total: number) => void,
  ) => Promise<void>;
  onFolderSelect: (folderId: string, folderName: string) => Promise<void>;
  onFolderRemove: (folderId: string) => Promise<void>;
  onFolderCountsChange: (counts: Record<string, number>) => Promise<void>;
  onFolderRefreshed: (folderId: string, bookCount: number) => Promise<void>;
}

export default function HomePage({
  isLoadingFolders,
  libraryFolders,
  onLoadDevTestData,
  onFolderSelect,
  onFolderRemove,
  onFolderCountsChange,
  onFolderRefreshed,
}: HomePageProps) {
  const { t } = useTranslate();
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countErrors, setCountErrors] = useState<Record<string, string>>({});
  const [refreshingFolders, setRefreshingFolders] = useState<Set<string>>(
    new Set(),
  );
  const [removingFolders, setRemovingFolders] = useState<Set<string>>(
    new Set(),
  );
  const [isLoadingTestData, setIsLoadingTestData] = useState(false);
  const [testDataProgress, setTestDataProgress] = useState('');

  useEffect(() => {
    let active = true;
    initializeGoogleAuth()
      .then(() => {
        if (active) setIsAuthLoading(false);
      })
      .catch((err) => {
        console.error('Failed to initialize Google auth:', err);
        if (active) {
          setError(t('home.failedToInitGoogleAuth'));
          setIsAuthLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const foldersWithoutCounts = libraryFolders.filter(
      (folder) => folder.bookCount === undefined,
    );

    void Promise.all(
      foldersWithoutCounts.map(async (folder) => {
        try {
          const files = await listEpubFiles(folder.id);
          return [folder.id, files.length] as const;
        } catch (err) {
          console.error(`Failed to count EPUBs in ${folder.name}:`, err);
          if (active) {
            setCountErrors((current) => ({
              ...current,
              [folder.id]: t('home.countUnavailable'),
            }));
          }
          return null;
        }
      }),
    )
      .then(async (results) => {
        if (!active) return;
        const counts = Object.fromEntries(
          results.filter(
            (result): result is readonly [string, number] => !!result,
          ),
        );
        if (Object.keys(counts).length > 0) {
          await onFolderCountsChange(counts);
        }
        setCountErrors((current) => {
          const next = { ...current };
          Object.keys(counts).forEach((id) => delete next[id]);
          return next;
        });
      })
      .catch((err) => {
        console.error('Failed to save bookshelf folder counts:', err);
        if (active) {
          setCountErrors((current) => ({
            ...current,
            ...Object.fromEntries(
              foldersWithoutCounts.map((folder) => [
                folder.id,
                'Could not save count',
              ]),
            ),
          }));
        }
      });

    return () => {
      active = false;
    };
  }, [libraryFolders, onFolderCountsChange]);

  const refreshFolder = async (folder: LibraryFolder) => {
    setError(null);
    setRefreshingFolders((current) => new Set(current).add(folder.id));
    try {
      const books = await getBooksInFolder(folder.id, true);
      await onFolderRefreshed(folder.id, books.length);
      setCountErrors((current) => {
        const next = { ...current };
        delete next[folder.id];
        return next;
      });
    } catch (err) {
      console.error(`Failed to refresh ${folder.name}:`, err);
      setError(`Could not refresh “${folder.name}”. Please try again.`);
    } finally {
      setRefreshingFolders((current) => {
        const next = new Set(current);
        next.delete(folder.id);
        return next;
      });
    }
  };

  const removeFolder = async (folder: LibraryFolder) => {
    setRemovingFolders((current) => new Set(current).add(folder.id));
    try {
      await onFolderRemove(folder.id);
    } catch (err) {
      console.error(`Failed to remove ${folder.name} from the bookshelf:`, err);
      setError(`Could not remove “${folder.name}”. Please try again.`);
      setRemovingFolders((current) => {
        const next = new Set(current);
        next.delete(folder.id);
        return next;
      });
    }
  };

  if (isLoadingFolders || (isAuthLoading && !import.meta.env.DEV)) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (error && libraryFolders.length === 0 && !import.meta.env.DEV) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl py-10">
      <section className="relative mb-14 overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-primary/5 px-6 py-14 text-center sm:px-12 sm:py-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl"
        />
        <div className="relative mx-auto flex max-w-xl flex-col items-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <BookOpen aria-hidden="true" className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Your books, all in one place
          </h1>
          <p className="mt-3 max-w-md text-muted-foreground">
            Pick up where you left off or discover your next favorite from your
            bookshelf.
          </p>
          <Button asChild size="lg" className="mt-8 gap-2 px-7">
            <Link to="/bookshelf">
              <BookOpen aria-hidden="true" />
              Explore Bookshelf
            </Link>
          </Button>
          {import.meta.env.DEV && onLoadDevTestData && (
            <Button
              type="button"
              variant="outline"
              className="mt-3 gap-2"
              disabled={isLoadingTestData}
              onClick={async () => {
                setError(null);
                setIsLoadingTestData(true);
                setTestDataProgress('');
                try {
                  await onLoadDevTestData((loaded, total) => {
                    setTestDataProgress(`${loaded} of ${total}`);
                  });
                } catch (err) {
                  console.error('Failed to load local test data:', err);
                  setError(
                    err instanceof Error
                      ? err.message
                      : 'Could not load local test data.',
                  );
                } finally {
                  setIsLoadingTestData(false);
                }
              }}
            >
              <Database aria-hidden="true" />
              {isLoadingTestData
                ? `Loading covers${testDataProgress ? ` (${testDataProgress})` : '...'}`
                : 'Load test data'}
            </Button>
          )}
        </div>
      </section>

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      <section aria-label="Bookshelf folders">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{t('home.driveFolders')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('home.manageFolders')}
            </p>
          </div>
          <FolderPicker
            onFolderSelect={onFolderSelect}
            apiKey={import.meta.env.VITE_GOOGLE_API_KEY}
          />
        </div>
        {libraryFolders.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center">
            <FolderOpen className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <h3 className="font-medium">{t('home.noFoldersAddedYet')}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('home.addDriveFolderToStart')}
            </p>
          </div>
        ) : (
          <div className="divide-y rounded-lg border">
            {libraryFolders.map((folder) => (
              <div
                key={folder.id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <FolderOpen className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{folder.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {countErrors[folder.id] ??
                        (folder.bookCount === undefined
                          ? t('home.countingEpubs')
                          : `${folder.bookCount} ${t(folder.bookCount === 1 ? 'common.book' : 'common.books')}`)}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t('common.actionsFor', { name: folder.name })}
                      disabled={
                        refreshingFolders.has(folder.id) ||
                        removingFolders.has(folder.id)
                      }
                    >
                      {refreshingFolders.has(folder.id) ? (
                        <RefreshCw className="animate-spin" />
                      ) : (
                        <MoreHorizontal />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => void refreshFolder(folder)}
                    >
                      <RefreshCw />
                      {t('common.refresh')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => void removeFolder(folder)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 />
                      {t('home.removeFromLibrary')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
