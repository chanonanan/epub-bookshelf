import {
  type BookMetadata,
  getBooksInFolder,
  refreshBookInfo,
} from '@/epubUtils';
import type { LibraryFolder } from '@/types/library';
import {
  type FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AlertCircle,
  BookOpen,
  CheckSquare,
  LayoutGrid,
  LayoutList,
  LoaderCircle,
  RefreshCw,
  X,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { BookGrid } from './BookGrid';
import { SeriesGrid, type SeriesGroup } from './SeriesGrid';
import { Button } from './ui/button';

interface BookshelfProps {
  folders: LibraryFolder[];
  initialSeries?: string;
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
  initialSeries,
  searchQuery = '',
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
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
  const gridRef = useRef<HTMLDivElement>(null);
  const loadIdRef = useRef(0);
  const lastAnnouncedProcessedRef = useRef(0);
  const previousGroupByRef = useRef<GroupBy>('series');
  const selectedSeries = initialSeries;
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

  const updateShelfParam = useCallback(
    (key: string, value: string | null, defaultValue?: string) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          if (!value || value === defaultValue) next.delete(key);
          else next.set(key, value);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

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
    () => groupBooksByCategory(filteredBooks, groupBy, sortBy),
    [filteredBooks, groupBy, sortBy],
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
        `Could not refresh ${failedIds.length} selected book${failedIds.length === 1 ? '' : 's'}.`,
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
                `Processed ${processed} of ${discovered} EPUBs so far.`,
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
      setAnnouncedProgress(`Finished processing ${processedOffset} EPUBs.`);
    } catch (err) {
      if (loadId === loadIdRef.current) {
        setError('Failed to load one or more Drive folders. Please try again.');
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
          <p>{error} Showing books found so far.</p>
          <Button variant="outline" onClick={() => void loadBooks(folders)}>
            Retry
          </Button>
        </div>
      )}
      {!selectedSeries && !isEmptyLibrary && (
        <section
          aria-label="Shelf controls"
          className="mb-5 space-y-3 rounded-xl border bg-card/70 p-3 shadow-sm sm:p-4"
        >
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="shelf-group-by">
              Group books by
            </label>
            <select
              id="shelf-group-by"
              value={groupBy}
              disabled={selectionMode}
              onChange={(event) => {
                updateShelfParam('groupBy', event.target.value, 'series');
                setSelectedIds(new Set());
              }}
              className="h-9 min-w-32 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="series">Group: Series</option>
              <option value="author">Group: Author</option>
              <option value="tags">Group: Tag</option>
              <option value="none">All books</option>
            </select>
            <label className="sr-only" htmlFor="shelf-sort-by">
              Sort books by
            </label>
            <select
              id="shelf-sort-by"
              value={sortBy}
              onChange={(event) =>
                updateShelfParam('sortBy', event.target.value, 'title')
              }
              className="h-9 min-w-32 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="title">Sort: Title</option>
              <option value="author">Sort: Author</option>
              <option value="series">Sort: Series</option>
              <option value="publishDate">Sort: Published</option>
            </select>
            <div
              role="group"
              aria-label="Shelf layout"
              className="flex rounded-md border bg-background p-0.5"
            >
              <button
                type="button"
                aria-label="Grid view"
                aria-pressed={viewMode === 'grid'}
                onClick={() => updateShelfParam('view', 'grid', 'grid')}
                className={`flex h-8 w-9 items-center justify-center rounded ${
                  viewMode === 'grid' ? 'bg-accent text-accent-foreground' : ''
                }`}
              >
                <LayoutGrid aria-hidden="true" className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="List view"
                aria-pressed={viewMode === 'list'}
                onClick={() => updateShelfParam('view', 'list', 'grid')}
                className={`flex h-8 w-9 items-center justify-center rounded ${
                  viewMode === 'list' ? 'bg-accent text-accent-foreground' : ''
                }`}
              >
                <LayoutList aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
            <Button
              type="button"
              variant={selectionMode ? 'secondary' : 'outline'}
              size="sm"
              onClick={handleSelectionModeChange}
            >
              <CheckSquare aria-hidden="true" />
              {selectionMode ? 'Done selecting' : 'Select books'}
            </Button>
            {selectionMode && (
              <>
                <span
                  className="text-sm text-muted-foreground"
                  aria-live="polite"
                >
                  {selectedBooks.length} selected
                </span>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void handleBulkRefresh()}
                  disabled={selectedBooks.length === 0 || isRefreshingSelected}
                >
                  <RefreshCw
                    aria-hidden="true"
                    className={isRefreshingSelected ? 'animate-spin' : ''}
                  />
                  {isRefreshingSelected ? 'Refreshing...' : 'Refresh metadata'}
                </Button>
              </>
            )}
          </div>
          {(activeAuthor || activeSeries || activeTag || activeUntagged) && (
            <div className="flex flex-wrap items-center gap-2">
              {activeAuthor && (
                <FilterChip
                  label={`Author: ${activeAuthor}`}
                  onRemove={() => updateShelfParam('author', null)}
                />
              )}
              {activeSeries && (
                <FilterChip
                  label={`Series: ${activeSeries}`}
                  onRemove={() => updateShelfParam('series', null)}
                />
              )}
              {activeTag && (
                <FilterChip
                  label={`Tag: ${activeTag}`}
                  onRemove={() => updateShelfParam('tag', null)}
                />
              )}
              {activeUntagged && (
                <FilterChip
                  label="Untagged books"
                  onRemove={() => updateShelfParam('untagged', null)}
                />
              )}
              <button
                type="button"
                onClick={() => {
                  setSearchParams(
                    (current) => {
                      const next = new URLSearchParams(current);
                      next.delete('author');
                      next.delete('series');
                      next.delete('tag');
                      next.delete('untagged');
                      return next;
                    },
                    { replace: true },
                  );
                }}
                className="text-xs text-muted-foreground underline underline-offset-2"
              >
                Clear filters
              </button>
            </div>
          )}
          {bulkActionError && (
            <p role="alert" className="text-sm text-destructive">
              {bulkActionError}
            </p>
          )}
        </section>
      )}
      {isEmptyLibrary ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
          <BookOpen
            aria-hidden="true"
            className="mb-4 h-10 w-10 text-muted-foreground"
          />
          <h1 className="text-xl font-semibold">
            It&apos;s a little too quiet in here.
          </h1>
          <p className="mt-2 max-w-md text-muted-foreground">
            No books yet. Let&apos;s give these shelves something to read.
          </p>
          <Button asChild className="mt-6">
            <Link to="/">Add a Drive folder</Link>
          </Button>
        </div>
      ) : selectedSeries ? (
        <>
          <BookGrid
            books={series.find((s) => s.name === selectedSeries)?.books || []}
            viewMode={viewMode}
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onToggleSelection={toggleSelection}
          />
          {!isLoading &&
            (series.find((s) => s.name === selectedSeries)?.books.length ??
              0) === 0 && (
              <p className="py-12 text-center text-muted-foreground">
                No books match this series and the current search or filters.
              </p>
            )}
        </>
      ) : groupBy === 'none' ? (
        <>
          <BookGrid
            books={filteredBooks}
            viewMode={viewMode}
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onToggleSelection={toggleSelection}
          />
          {!searchQuery && pendingBooks.size > 0 && (
            <PendingBooksGrid
              books={[...pendingBooks.values()]}
              viewMode={viewMode}
            />
          )}
          {!isLoading && filteredBooks.length === 0 && (
            <p className="py-12 text-center text-muted-foreground">
              {hasActiveFilters
                ? 'No books match the current search and filters.'
                : 'No EPUB books found in your library.'}
            </p>
          )}
        </>
      ) : (
        <>
          {series.length > 0 && <SeriesGrid series={series} />}
          {!searchQuery && pendingBooks.size > 0 && (
            <PendingBooksGrid
              books={[...pendingBooks.values()]}
              viewMode={viewMode}
            />
          )}
          {!isLoading && !hasActiveFilters && series.length === 0 && (
            <p className="py-12 text-center text-muted-foreground">
              No EPUB books found in your library.
            </p>
          )}
          {!isLoading && hasActiveFilters && series.length === 0 && (
            <p className="py-12 text-center text-muted-foreground">
              No books match the current search and filters.
            </p>
          )}
        </>
      )}
    </div>
  );
};

function PendingBooksGrid({
  books,
  viewMode,
}: {
  books: PendingBook[];
  viewMode: ViewMode;
}) {
  return (
    <div
      aria-label="Books being processed"
      className={
        viewMode === 'grid'
          ? 'mt-4 grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3 sm:gap-4'
          : 'mt-4 flex flex-col gap-2'
      }
    >
      {books.map((book) => (
        <div
          key={book.id}
          aria-label={`${book.failed ? 'Could not load' : 'Loading'} ${book.name}`}
          className={
            viewMode === 'grid'
              ? 'min-w-0'
              : 'flex items-center gap-3 rounded-lg border bg-card p-2'
          }
        >
          <div
            className={
              viewMode === 'grid'
                ? 'relative aspect-[2/3] overflow-hidden rounded-sm bg-muted'
                : 'relative h-20 w-14 flex-none overflow-hidden rounded bg-muted'
            }
          >
            <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted via-muted/60 to-muted" />
            {book.failed ? (
              <AlertCircle
                aria-hidden="true"
                className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-destructive"
              />
            ) : (
              <LoaderCircle
                aria-hidden="true"
                className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 animate-spin text-muted-foreground"
              />
            )}
          </div>
          <p
            className={`line-clamp-2 text-xs text-muted-foreground sm:text-sm ${
              viewMode === 'grid' ? 'mt-2' : 'min-w-0'
            }`}
          >
            {book.name.replace(/\.epub$/i, '')}
          </p>
        </div>
      ))}
    </div>
  );
}

function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex max-w-full items-center gap-1 rounded-full border bg-background px-3 py-1 text-xs"
    >
      <span className="truncate">{label}</span>
      <X aria-hidden="true" className="h-3 w-3 flex-none" />
      <span className="sr-only">Remove filter</span>
    </button>
  );
}

function groupBooksByCategory(
  books: BookMetadata[],
  groupBy: GroupBy,
  sortBy: SortBy,
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
        ? book.author || 'Unknown author'
        : groupBy === 'tags'
          ? book.tags?.[0] || 'Untagged'
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
