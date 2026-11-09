import {
  type BookMetadata,
  getBooksInFolder,
  refreshBookInfo,
} from '@/epubUtils';
import type { LibraryFolder } from '@/types/library';
import {
  type FC,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  BookOpen,
  CheckSquare,
  LayoutGrid,
  LayoutList,
  Menu,
  RefreshCw,
  X,
} from 'lucide-react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { BookGrid } from './BookGrid';
import { SeriesGrid, type SeriesGroup } from './SeriesGrid';
import { Button } from './ui/button';
import { useTranslate } from '@/lib/useTranslate';

interface BookshelfProps {
  folders: LibraryFolder[];
  searchQuery?: string;
}

const bookshelfBooksCache = new Map<string, BookMetadata[]>();

const getBookshelfCacheKey = (folders: LibraryFolder[]) =>
  folders
    .map((folder) => `${folder.id}:${folder.name}:${folder.lastUpdate}`)
    .join('|');

interface PendingBook {
  id: string;
  name: string;
  failed: boolean;
}

type GroupBy = 'series' | 'author' | 'tags' | 'none';
type SortBy = 'title' | 'author' | 'series' | 'publishDate';
type ViewMode = 'grid' | 'list';

interface ShelfNavigationState {
  returnGroupBy?: GroupBy;
  returnScrollY?: number;
}

const isGroupBy = (value: string | null): value is GroupBy =>
  value === 'series' ||
  value === 'author' ||
  value === 'tags' ||
  value === 'none';

const isSortBy = (value: string | null): value is SortBy =>
  value === 'title' ||
  value === 'author' ||
  value === 'series' ||
  value === 'publishDate';

export const Bookshelf: FC<BookshelfProps> = ({
  folders,
  searchQuery = '',
}) => {
  const { t } = useTranslate();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigationState = location.state as ShelfNavigationState | null;
  const restoreGroupBy = isGroupBy(navigationState?.returnGroupBy ?? null)
    ? navigationState?.returnGroupBy
    : undefined;
  const cacheKey = getBookshelfCacheKey(folders);
  const [books, setBooks] = useState<BookMetadata[]>(
    () => bookshelfBooksCache.get(cacheKey) ?? [],
  );
  const [loadedCacheKey, setLoadedCacheKey] = useState(() =>
    bookshelfBooksCache.has(cacheKey) ? cacheKey : '',
  );
  const [loading, setLoading] = useState(
    () => folders.length > 0 && !bookshelfBooksCache.has(cacheKey),
  );
  const [pendingBooks, setPendingBooks] = useState<Map<string, PendingBook>>(
    () => new Map(),
  );
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [isRefreshingSelected, setIsRefreshingSelected] = useState(false);
  const [bulkActionError, setBulkActionError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [announcedProgress, setAnnouncedProgress] = useState('');
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLElement>(null);
  const drawerGestureRef = useRef<{
    pointerId: number;
    startY: number;
    startedAt: number;
  } | null>(null);
  const drawerGestureMovedRef = useRef(false);
  const controlsHeadingRef = useRef<HTMLHeadingElement>(null);
  const controlsTriggerRef = useRef<HTMLButtonElement>(null);
  const loadIdRef = useRef(0);
  const lastAnnouncedProcessedRef = useRef(0);
  const previousGroupByRef = useRef<GroupBy>('series');
  const groupByParam = searchParams.get('groupBy');
  const sortByParam = searchParams.get('sortBy');
  const groupBy: GroupBy = isGroupBy(groupByParam) ? groupByParam : 'series';
  const sortBy: SortBy = isSortBy(sortByParam) ? sortByParam : 'title';
  const viewMode: ViewMode =
    searchParams.get('view') === 'list' ? 'list' : 'grid';
  const activeAuthor = searchParams.get('author');
  const activeSeries = searchParams.get('series');
  const activeTag = searchParams.get('tag');
  const activeUntagged = searchParams.get('untagged') === '1';

  const handleDrawerPointerDown = (
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    if (!event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drawerGestureRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startedAt: performance.now(),
    };
    drawerGestureMovedRef.current = false;
    controlsRef.current?.classList.add('is-dragging');
  };

  const handleDrawerPointerMove = (
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    const gesture = drawerGestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const offset = Math.max(0, event.clientY - gesture.startY);
    if (offset > 8) drawerGestureMovedRef.current = true;
    controlsRef.current?.style.setProperty('--drawer-drag-y', `${offset}px`);
  };

  const resetDrawerGesture = () => {
    controlsRef.current?.style.removeProperty('--drawer-drag-y');
    controlsRef.current?.classList.remove('is-dragging');
    drawerGestureRef.current = null;
  };

  const handleDrawerPointerUp = (
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    const gesture = drawerGestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const offset = Math.max(0, event.clientY - gesture.startY);
    const duration = performance.now() - gesture.startedAt;
    const shouldClose =
      offset > 72 || (offset > 28 && duration < 220 && offset / duration > 0.5);

    resetDrawerGesture();
    if (shouldClose) {
      setIsControlsOpen(false);
      controlsTriggerRef.current?.focus({ preventScroll: true });
    }
  };

  const handleDrawerPointerCancel = (
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    if (drawerGestureRef.current?.pointerId !== event.pointerId) return;
    drawerGestureMovedRef.current = false;
    resetDrawerGesture();
  };

  useEffect(() => {
    if (!isControlsOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    controlsHeadingRef.current?.focus({ preventScroll: true });

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (
        target instanceof Node &&
        !controlsRef.current?.contains(target) &&
        !controlsTriggerRef.current?.contains(target)
      ) {
        setIsControlsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsControlsOpen(false);
        controlsTriggerRef.current?.focus({ preventScroll: true });
        return;
      }

      if (event.key === 'Tab') {
        const focusableElements =
          controlsRef.current?.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), select:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
          );
        if (!focusableElements?.length) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        if (
          event.shiftKey &&
          (document.activeElement === firstElement ||
            document.activeElement === controlsHeadingRef.current)
        ) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isControlsOpen]);

  const updateShelfParam = useCallback(
    (key: string, value: string | null, defaultValue?: string) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          if (!value || value === defaultValue) next.delete(key);
          else next.set(key, value);
          if (!value && key !== 'groupBy' && restoreGroupBy) {
            next.set('groupBy', restoreGroupBy);
          }
          return next;
        },
        {
          replace: true,
          state:
            !value && key !== 'groupBy' && restoreGroupBy
              ? { restoreScrollY: navigationState?.returnScrollY }
              : location.state,
        },
      );
    },
    [location.state, navigationState, restoreGroupBy, setSearchParams],
  );

  const clearFilters = () => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete('author');
        next.delete('series');
        next.delete('tag');
        next.delete('untagged');
        if (restoreGroupBy) next.set('groupBy', restoreGroupBy);
        return next;
      },
      {
        replace: true,
        state: restoreGroupBy
          ? { restoreScrollY: navigationState?.returnScrollY }
          : location.state,
      },
    );
  };

  const filteredBooks = useMemo(() => {
    const visibleBooks = loadedCacheKey === cacheKey || loading ? books : [];
    const query = searchQuery.trim().toLowerCase();
    return visibleBooks.filter((book) => {
      if (
        query &&
        !book.title?.toLowerCase().includes(query) &&
        !book.author?.toLowerCase().includes(query) &&
        !book.series?.toLowerCase().includes(query) &&
        !(book.tags ?? []).some((tag) => tag.toLowerCase().includes(query))
      ) {
        return false;
      }
      if (
        activeAuthor &&
        !book.author.toLowerCase().includes(activeAuthor.toLowerCase())
      ) {
        return false;
      }
      if (
        activeSeries &&
        book.series?.toLowerCase() !== activeSeries.toLowerCase()
      ) {
        return false;
      }
      if (
        activeTag &&
        !(book.tags ?? []).some(
          (tag) => tag.toLowerCase() === activeTag.toLowerCase(),
        )
      ) {
        return false;
      }
      if (activeUntagged && (book.tags?.length ?? 0) > 0) return false;
      return true;
    });
  }, [
    books,
    cacheKey,
    loadedCacheKey,
    searchQuery,
    activeAuthor,
    activeSeries,
    activeTag,
    activeUntagged,
    loading,
  ]);

  const series = useMemo(
    () => groupBooksByCategory(filteredBooks, groupBy, sortBy, t),
    [filteredBooks, groupBy, sortBy, t],
  );
  const isLoading = loading || loadedCacheKey !== cacheKey;
  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
      activeAuthor ||
      activeSeries ||
      activeTag ||
      activeUntagged,
  );
  const isEmptyLibrary =
    !isLoading &&
    books.length === 0 &&
    pendingBooks.size === 0 &&
    !hasActiveFilters;
  const selectedBooks = useMemo(
    () => filteredBooks.filter((book) => selectedIds.has(book.id)),
    [filteredBooks, selectedIds],
  );

  useEffect(() => {
    const visibleIds = new Set(filteredBooks.map((book) => book.id));
    setSelectedIds((current) => {
      const next = new Set([...current].filter((id) => visibleIds.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [filteredBooks]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelectionModeChange = () => {
    if (selectionMode) {
      setSelectedIds(new Set());
      updateShelfParam('groupBy', previousGroupByRef.current, 'series');
    } else {
      previousGroupByRef.current = groupBy;
      updateShelfParam('groupBy', 'none', 'series');
    }
    setSelectionMode(!selectionMode);
  };

  const handleBulkRefresh = async () => {
    if (selectedBooks.length === 0) return;
    setIsRefreshingSelected(true);
    setBulkActionError(null);
    const refreshedBooks = new Map<string, BookMetadata>();
    const failedIds: string[] = [];

    for (let index = 0; index < selectedBooks.length; index += 4) {
      const batch = selectedBooks.slice(index, index + 4);
      const results = await Promise.all(
        batch.map(async (book) => {
          try {
            const refreshed = await refreshBookInfo(
              book.id,
              book.fileSize ?? '',
            );
            return { id: book.id, refreshed };
          } catch (error) {
            console.error(`Failed to refresh metadata for ${book.id}:`, error);
            return { id: book.id, refreshed: null };
          }
        }),
      );
      results.forEach(({ id, refreshed }) => {
        if (refreshed) refreshedBooks.set(id, refreshed);
        else failedIds.push(id);
      });
    }

    setBooks((current) => {
      const next = current.map((book) => refreshedBooks.get(book.id) ?? book);
      bookshelfBooksCache.set(cacheKey, next);
      return next;
    });
    setSelectedIds(new Set());
    setIsRefreshingSelected(false);
    if (failedIds.length > 0) {
      setBulkActionError(
        t('bookshelf.couldNotRefresh', { count: failedIds.length }),
      );
    } else {
      setSelectionMode(false);
    }
  };

  const loadBooks = useCallback(async (sources: LibraryFolder[]) => {
    const loadId = ++loadIdRef.current;
    const shelfKey = getBookshelfCacheKey(sources);
    setSelectionMode(false);
    setSelectedIds(new Set());
    setPendingBooks(new Map());
    const cachedBooks = bookshelfBooksCache.get(shelfKey);
    if (cachedBooks) {
      setBooks(cachedBooks);
      setLoadedCacheKey(shelfKey);
      setLoading(false);
      setError(null);
      return;
    }

    setBooks([]);
    setLoadedCacheKey('');
    lastAnnouncedProcessedRef.current = 0;
    setAnnouncedProgress('');
    setLoading(sources.length > 0);
    setError(null);
    if (sources.length === 0) return;

    let completedBooks: BookMetadata[] = [];
    let discoveredOffset = 0;
    let processedOffset = 0;
    try {
      for (const source of sources) {
        let sourceBooks: Array<BookMetadata | undefined> = [];
        let sourceDiscoveredCount = 0;
        let sourceProcessedCount = 0;
        const booksInSource = await getBooksInFolder(
          source.id,
          false,
          (progress) => {
            if (loadId !== loadIdRef.current) return;
            sourceDiscoveredCount = progress.discoveredCount;
            sourceProcessedCount = progress.processedCount;
            if (progress.books) {
              sourceBooks = progress.books;
            } else if (progress.book && progress.bookOrder !== undefined) {
              sourceBooks[progress.bookOrder] = progress.book;
            }
            if (progress.discoveredFile) {
              const { id, name } = progress.discoveredFile;
              setPendingBooks((current) =>
                new Map(current).set(id, { id, name, failed: false }),
              );
            }
            if (progress.processedFileId) {
              const processedFileId = progress.processedFileId;
              setPendingBooks((current) => {
                const next = new Map(current);
                if (progress.failedFileId) {
                  const pending = next.get(progress.failedFileId);
                  if (pending)
                    next.set(pending.id, { ...pending, failed: true });
                } else {
                  next.delete(processedFileId);
                }
                return next;
              });
            }

            const combined = new Map<string, BookMetadata>();
            completedBooks.forEach((book) => combined.set(book.id, book));
            sourceBooks.forEach((book) => {
              if (book) combined.set(book.id, book);
            });
            const orderedBooks = Array.from(combined.values());
            setBooks(orderedBooks);

            const discovered = discoveredOffset + sourceDiscoveredCount;
            const processed = processedOffset + sourceProcessedCount;
            setLoading(true);
            if (processed - lastAnnouncedProcessedRef.current >= 20) {
              lastAnnouncedProcessedRef.current = processed;
              setAnnouncedProgress(
                t('bookshelf.processingProgress', { processed, discovered }),
              );
            }
          },
        );
        if (loadId !== loadIdRef.current) return;

        const uniqueBooks = new Map(
          completedBooks.map((book) => [book.id, book]),
        );
        booksInSource.forEach((book) => uniqueBooks.set(book.id, book));
        completedBooks = Array.from(uniqueBooks.values());
        discoveredOffset += sourceDiscoveredCount;
        processedOffset += sourceProcessedCount;
        setBooks(completedBooks);
      }

      bookshelfBooksCache.set(shelfKey, completedBooks);
      setLoadedCacheKey(shelfKey);
      setLoading(false);
      setAnnouncedProgress(t('bookshelf.processingFinished', { count: processedOffset }));
    } catch (err) {
      if (loadId === loadIdRef.current) {
        setError(t('bookshelf.failedToLoadFolders'));
        setLoadedCacheKey(shelfKey);
        setLoading(false);
      }
      console.error('Error loading books:', err);
    }
  }, []);

  useEffect(() => {
    const loadIdRefCurrent = loadIdRef;
    void loadBooks(folders);
    return () => {
      loadIdRefCurrent.current++;
    };
  }, [folders, loadBooks]);

  return (
    <div
      ref={gridRef}
      className="container mx-auto px-4 min-h-screen scroll-smooth"
      style={{ scrollPaddingTop: '1rem' }}
    >
      <span
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcedProgress}
      </span>
      {error && (
        <div className="flex items-center justify-between gap-4 py-4 text-sm text-destructive">
          <p>{error} {t('bookshelf.showingBooksSoFar')}</p>
          <Button variant="outline" onClick={() => void loadBooks(folders)}>
            {t('bookshelf.retry')}
          </Button>
        </div>
      )}
      {!isEmptyLibrary && (
        <>
          <button
            ref={controlsTriggerRef}
            type="button"
            className="shelf-menu-trigger"
            aria-label={
              isControlsOpen
                ? t('bookshelf.closeMenu')
                : t('bookshelf.openMenu')
            }
            aria-expanded={isControlsOpen}
            aria-controls="shelf-controls-panel"
            onClick={() => setIsControlsOpen((isOpen) => !isOpen)}
          >
            {isControlsOpen ? (
              <X aria-hidden="true" />
            ) : (
              <Menu aria-hidden="true" />
            )}
          </button>
          <div
            aria-hidden="true"
            className={`shelf-drawer-backdrop ${isControlsOpen ? 'is-open' : ''}`}
            onClick={() => setIsControlsOpen(false)}
          />
          <section
            id="shelf-controls-panel"
            ref={controlsRef}
            role={isControlsOpen ? 'dialog' : undefined}
            aria-modal={isControlsOpen ? true : undefined}
            aria-labelledby="shelf-controls-title"
            className={`shelf-controls shelf-controls-panel mb-5 space-y-3 rounded-xl border bg-card/70 p-3 shadow-sm sm:p-4 ${isControlsOpen ? 'is-open' : ''}`}
          >
            <header className="shelf-drawer-header">
              <button
                type="button"
                aria-label="Swipe down or tap to close shelf controls"
                className="shelf-drawer-handle"
                onPointerDown={handleDrawerPointerDown}
                onPointerMove={handleDrawerPointerMove}
                onPointerUp={handleDrawerPointerUp}
                onPointerCancel={handleDrawerPointerCancel}
                onClick={(event) => {
                  if (drawerGestureMovedRef.current) {
                    event.preventDefault();
                    drawerGestureMovedRef.current = false;
                    return;
                  }
                  setIsControlsOpen(false);
                  controlsTriggerRef.current?.focus({ preventScroll: true });
                }}
              >
                <span aria-hidden="true" />
              </button>
              <div>
                <h2
                  id="shelf-controls-title"
                  ref={controlsHeadingRef}
                  tabIndex={-1}
                  className="text-lg font-semibold tracking-tight"
                >
                  {t('bookshelf.shelfControls')}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('bookshelf.organizeDescription')}
                </p>
              </div>
            </header>
            <div className="shelf-filter-selects">
              <label className="sr-only" htmlFor="shelf-group-by">
                {t('bookshelf.groupByLabel')}
              </label>
              <select
                id="shelf-group-by"
                value={groupBy}
                disabled={selectionMode}
                onChange={(event) => {
                  updateShelfParam('groupBy', event.target.value, 'series');
                  setSelectedIds(new Set());
                }}
                className="shelf-filter-select h-10 min-w-32 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="series">{t('bookshelf.groupSeries')}</option>
                <option value="author">{t('bookshelf.groupAuthor')}</option>
                <option value="tags">{t('bookshelf.groupTag')}</option>
                <option value="none">{t('bookshelf.groupAllBooks')}</option>
              </select>
              <label className="sr-only" htmlFor="shelf-sort-by">
                {t('bookshelf.sortByLabel')}
              </label>
              <select
                id="shelf-sort-by"
                value={sortBy}
                onChange={(event) =>
                  updateShelfParam('sortBy', event.target.value, 'title')
                }
                className="shelf-filter-select h-10 min-w-32 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="title">{t('bookshelf.sortTitle')}</option>
                <option value="author">{t('bookshelf.sortAuthor')}</option>
                <option value="series">{t('bookshelf.sortSeries')}</option>
                <option value="publishDate">{t('bookshelf.sortPublished')}</option>
              </select>
            </div>
            <div className="shelf-control-actions">
              <div
                role="group"
                aria-label={t('bookshelf.shelfLayout')}
                className="shelf-layout-toggle flex rounded-md border bg-background p-0.5"
              >
                <button
                  type="button"
                  aria-label={t('bookshelf.gridView')}
                  aria-pressed={viewMode === 'grid'}
                  onClick={() => updateShelfParam('view', 'grid', 'grid')}
                  className={`flex h-9 w-10 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    viewMode === 'grid'
                      ? 'bg-accent text-accent-foreground'
                      : ''
                  }`}
                >
                  <LayoutGrid aria-hidden="true" className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label={t('bookshelf.listView')}
                  aria-pressed={viewMode === 'list'}
                  onClick={() => updateShelfParam('view', 'list', 'grid')}
                  className={`flex h-9 w-10 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    viewMode === 'list'
                      ? 'bg-accent text-accent-foreground'
                      : ''
                  }`}
                >
                  <LayoutList aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
              <Button
                type="button"
                variant={selectionMode ? 'secondary' : 'outline'}
                size="sm"
                className="shelf-selection-button h-10 rounded-lg"
                onClick={handleSelectionModeChange}
              >
                <CheckSquare aria-hidden="true" />
                {selectionMode ? t('bookshelf.doneSelecting') : t('bookshelf.selectBooks')}
              </Button>
              {selectionMode && (
                <>
                  <span
                    className="text-sm text-muted-foreground"
                    aria-live="polite"
                  >
                    {selectedBooks.length} {t('bookshelf.selected')}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    className="h-10 rounded-lg"
                    onClick={() => void handleBulkRefresh()}
                    disabled={
                      selectedBooks.length === 0 || isRefreshingSelected
                    }
                  >
                    <RefreshCw
                      aria-hidden="true"
                      className={isRefreshingSelected ? 'animate-spin' : ''}
                    />
                    {isRefreshingSelected
                      ? t('common.refreshing')
                      : t('bookDetails.refreshMetadata')}
                  </Button>
                </>
              )}
            </div>
            {(activeAuthor || activeSeries || activeTag || activeUntagged) && (
              <div className="flex flex-wrap items-center gap-2">
                {activeAuthor && (
                  <FilterChip
                    label={`${t('bookDetails.author')}: ${activeAuthor}`}
                    onRemove={() => updateShelfParam('author', null)}
                    removeFilterLabel={t('common.removeFilter')}
                  />
                )}
                {activeSeries && (
                  <FilterChip
                    label={`${t('bookDetails.series')}: ${activeSeries}`}
                    onRemove={() => updateShelfParam('series', null)}
                    removeFilterLabel={t('common.removeFilter')}
                  />
                )}
                {activeTag && (
                  <FilterChip
                    label={`${t('bookDetails.tags')}: ${activeTag}`}
                    onRemove={() => updateShelfParam('tag', null)}
                    removeFilterLabel={t('common.removeFilter')}
                  />
                )}
                {activeUntagged && (
                  <FilterChip
                    label={t('bookshelf.untaggedBooks')}
                    onRemove={() => updateShelfParam('untagged', null)}
                    removeFilterLabel={t('common.removeFilter')}
                  />
                )}
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs text-muted-foreground underline underline-offset-2"
                >
                  {t('bookshelf.clearFilters')}
                </button>
              </div>
            )}
            {bulkActionError && (
              <p role="alert" className="text-sm text-destructive">
                {bulkActionError}
              </p>
            )}
          </section>
        </>
      )}
      {isEmptyLibrary ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
          <BookOpen
            aria-hidden="true"
            className="mb-4 h-10 w-10 text-muted-foreground"
          />
          <h1 className="text-xl font-semibold">
            {t('bookshelf.quietHeading')}
          </h1>
          <p className="mt-2 max-w-md text-muted-foreground">
            {t('bookshelf.noBooksYet')}
          </p>
          <Button asChild className="mt-6">
            <Link to="/">Add a Drive folder</Link>
          </Button>
        </div>
      ) : groupBy === 'none' ? (
        <>
          <BookGrid
            books={filteredBooks}
            viewMode={viewMode}
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onToggleSelection={toggleSelection}
            pendingBooks={hasActiveFilters ? [] : [...pendingBooks.values()]}
          />
          {!isLoading && filteredBooks.length === 0 && (
            <p className="py-12 text-center text-muted-foreground">
              {hasActiveFilters
                ? t('bookshelf.noBooksMatch')
                : t('bookshelf.noBooksFound')}
            </p>
          )}
        </>
      ) : (
        <>
          {(series.length > 0 ||
            (!hasActiveFilters && pendingBooks.size > 0)) && (
            <SeriesGrid
              series={series}
              viewMode={viewMode}
              groupBy={groupBy}
              pendingBooks={hasActiveFilters ? [] : [...pendingBooks.values()]}
            />
          )}
          {!isLoading && !hasActiveFilters && series.length === 0 && (
            <p className="py-12 text-center text-muted-foreground">
              {t('bookshelf.noBooksFound')}
            </p>
          )}
          {!isLoading && hasActiveFilters && series.length === 0 && (
            <p className="py-12 text-center text-muted-foreground">
              {t('bookshelf.noBooksMatch')}
            </p>
          )}
        </>
      )}
    </div>
  );
};

function FilterChip({
  label,
  onRemove,
  removeFilterLabel,
}: {
  label: string;
  onRemove: () => void;
  removeFilterLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex max-w-full items-center gap-1 rounded-full border bg-background px-3 py-1 text-xs"
    >
      <span className="truncate">{label}</span>
      <X aria-hidden="true" className="h-3 w-3 flex-none" />
      <span className="sr-only">{removeFilterLabel}</span>
    </button>
  );
}

function groupBooksByCategory(
  books: BookMetadata[],
  groupBy: GroupBy,
  sortBy: SortBy,
  translate: (key: string) => string,
): SeriesGroup[] {
  const compareBooks = (left: BookMetadata, right: BookMetadata) => {
    const leftValue = left[sortBy] ?? left.title;
    const rightValue = right[sortBy] ?? right.title;
    return String(leftValue).localeCompare(String(rightValue), undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  };
  const sortedBooks = [...books].sort(compareBooks);
  const groups = new Map<string, BookMetadata[]>();

  sortedBooks.forEach((book) => {
    const name =
      groupBy === 'author'
        ? book.author || translate('common.unknownAuthor')
        : groupBy === 'tags'
          ? book.tags?.[0] || translate('common.untagged')
          : book.series || book.title;
    const group = groups.get(name) ?? [];
    group.push(book);
    groups.set(name, group);
  });

  return Array.from(groups.entries())
    .map(([name, groupBooks]) => {
      const sortedGroupBooks =
        groupBy === 'series' && groupBooks.some((book) => book.series)
          ? [...groupBooks].sort(
              (left, right) =>
                (left.seriesIndex ?? Number.MAX_SAFE_INTEGER) -
                (right.seriesIndex ?? Number.MAX_SAFE_INTEGER),
            )
          : groupBooks;
      const filter: SeriesGroup['filter'] =
        groupBy === 'author'
          ? { key: 'author', value: name }
          : groupBy === 'tags'
            ? name === 'Untagged'
              ? { key: 'untagged', value: '1' }
              : { key: 'tag', value: name }
            : undefined;
      return {
        name,
        books: sortedGroupBooks,
        coverBlob: sortedGroupBooks[0]?.coverBlob,
        filter,
      };
    })
    .sort((left, right) =>
      left.name.localeCompare(right.name, undefined, {
        numeric: true,
        sensitivity: 'base',
      }),
    );
}
