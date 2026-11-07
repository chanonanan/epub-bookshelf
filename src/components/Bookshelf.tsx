import { type BookMetadata, getBooksInFolder } from '@/epubUtils';
import {
  type FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { BookGrid } from './BookGrid';
import { SeriesGrid, type SeriesGroup } from './SeriesGrid';
import { Button } from './ui/button';

interface BookshelfProps {
  folderId: string;
  initialSeries?: string;
  searchQuery?: string;
}

export const Bookshelf: FC<BookshelfProps> = ({
  folderId,
  initialSeries,
  searchQuery = '',
}) => {
  const [books, setBooks] = useState<BookMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [discoveredCount, setDiscoveredCount] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [announcedProgress, setAnnouncedProgress] = useState('');
  const gridRef = useRef<HTMLDivElement>(null);
  const loadIdRef = useRef(0);
  const bookOrderRef = useRef(new Map<string, number>());
  const lastAnnouncedProcessedRef = useRef(0);
  const selectedSeries = initialSeries;

  const filteredBooks = useMemo(
    () =>
      searchQuery
        ? books.filter(
            (book) =>
              book.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              book.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              book.series?.toLowerCase().includes(searchQuery.toLowerCase()),
          )
        : books,
    [books, searchQuery],
  );

  const series = useMemo(
    () => groupBooksBySeries(filteredBooks),
    [filteredBooks],
  );

  const loadBooks = useCallback(async (folderId: string) => {
    const loadId = ++loadIdRef.current;
    const pendingBooks = new Map<
      string,
      { book: BookMetadata; order: number }
    >();
    let pendingSnapshot: BookMetadata[] | undefined;
    let pendingDiscoveredCount = 0;
    let pendingProcessedCount = 0;
    let pendingComplete = false;
    let updateTimer: number | undefined;

    const flushProgress = () => {
      updateTimer = undefined;
      if (loadId !== loadIdRef.current) return;

      if (pendingSnapshot) {
        const snapshot = pendingSnapshot;
        pendingSnapshot = undefined;
        bookOrderRef.current = new Map(
          snapshot.map((book, index) => [book.id, index]),
        );
        setBooks(snapshot);
      } else if (pendingBooks.size > 0) {
        const updates = Array.from(pendingBooks.values());
        pendingBooks.clear();
        setBooks((currentBooks) => {
          const booksById = new Map(
            currentBooks.map((book) => [book.id, book]),
          );
          for (const { book, order } of updates) {
            booksById.set(book.id, book);
            bookOrderRef.current.set(book.id, order);
          }
          return Array.from(booksById.values()).sort(
            (left, right) =>
              (bookOrderRef.current.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
              (bookOrderRef.current.get(right.id) ?? Number.MAX_SAFE_INTEGER),
          );
        });
      }

      setDiscoveredCount(pendingDiscoveredCount);
      setProcessedCount(pendingProcessedCount);
      setLoading(!pendingComplete);
      if (pendingComplete) {
        setAnnouncedProgress(
          `Finished processing ${pendingProcessedCount} EPUBs.`,
        );
      } else if (
        pendingProcessedCount - lastAnnouncedProcessedRef.current >=
        20
      ) {
        lastAnnouncedProcessedRef.current = pendingProcessedCount;
        setAnnouncedProgress(
          `Processed ${pendingProcessedCount} of ${pendingDiscoveredCount} EPUBs so far.`,
        );
      }
    };

    setBooks([]);
    bookOrderRef.current.clear();
    lastAnnouncedProcessedRef.current = 0;
    setAnnouncedProgress('');
    setDiscoveredCount(0);
    setProcessedCount(0);
    try {
      setLoading(true);
      setError(null);
      await getBooksInFolder(folderId, false, (progress) => {
        if (loadId !== loadIdRef.current) return;
        if (progress.books) {
          pendingSnapshot = progress.books;
        } else if (progress.book && progress.bookOrder !== undefined) {
          pendingBooks.set(progress.book.id, {
            book: progress.book,
            order: progress.bookOrder,
          });
        }
        pendingDiscoveredCount = progress.discoveredCount;
        pendingProcessedCount = progress.processedCount;
        pendingComplete = progress.complete;
        if (progress.complete) {
          if (updateTimer !== undefined) window.clearTimeout(updateTimer);
          flushProgress();
        } else if (updateTimer === undefined) {
          updateTimer = window.setTimeout(flushProgress, 100);
        }
      });
    } catch (err) {
      if (loadId === loadIdRef.current) {
        setError('Failed to load books. Please try again.');
        setLoading(false);
      }
      console.error('Error loading books:', err);
    } finally {
      if (updateTimer !== undefined) window.clearTimeout(updateTimer);
    }
  }, []);

  useEffect(() => {
    const loadIdRefCurrent = loadIdRef;
    if (folderId) {
      void loadBooks(folderId);
    }
    return () => {
      loadIdRefCurrent.current++;
    };
  }, [folderId, loadBooks]);

  if (error && books.length === 0) {
    return (
      <ErrorShelf folderId={folderId} error={error} loadBooks={loadBooks} />
    );
  }

  return (
    <div
      ref={gridRef}
      className="container mx-auto px-4 min-h-screen scroll-smooth"
      style={{ scrollPaddingTop: '1rem' }}
    >
      {loading && (
        <LoadingShelf
          discoveredCount={discoveredCount}
          processedCount={processedCount}
        />
      )}
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
          <Button variant="outline" onClick={() => loadBooks(folderId)}>
            Retry
          </Button>
        </div>
      )}
      {selectedSeries ? (
        <BookGrid
          books={series.find((s) => s.name === selectedSeries)?.books || []}
        />
      ) : series.length > 0 ? (
        <SeriesGrid series={series} folderId={folderId} />
      ) : !loading ? (
        <p className="py-12 text-center text-muted-foreground">
          No EPUB books found in this folder.
        </p>
      ) : null}
    </div>
  );
};

function LoadingShelf({
  discoveredCount,
  processedCount,
}: {
  discoveredCount: number;
  processedCount: number;
}) {
  return (
    <div className="flex items-center justify-center gap-3 py-6 text-sm text-muted-foreground">
      <div
        aria-hidden="true"
        className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"
      />
      <span>
        {discoveredCount === 0
          ? 'Looking for EPUB files...'
          : `Processed ${processedCount} of ${discoveredCount} EPUBs so far...`}
      </span>
    </div>
  );
}

function ErrorShelf({
  folderId,
  error,
  loadBooks,
}: {
  folderId: string;
  error: string | null;
  loadBooks: (folderId: string) => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 min-h-screen">
      <p className="text-destructive">{error}</p>
      <Button variant="outline" onClick={() => loadBooks(folderId)}>
        Retry
      </Button>
    </div>
  );
}

function groupBooksBySeries(books: BookMetadata[]): SeriesGroup[] {
  const seriesMap = new Map<string, BookMetadata[]>();
  const standaloneBooks: BookMetadata[] = [];

  // Group books by series
  books.forEach((book) => {
    if (book.series) {
      const seriesBooks = seriesMap.get(book.series) || [];
      seriesBooks.push(book);
      seriesMap.set(book.series, seriesBooks);
    } else {
      standaloneBooks.push(book);
    }
  });

  // Convert map to array and sort books within series
  const seriesGroups: SeriesGroup[] = Array.from(seriesMap.entries()).map(
    ([name, books]) => ({
      name,
      books: books.sort((a, b) => (a.seriesIndex || 0) - (b.seriesIndex || 0)),
      coverBlob: books[0]?.coverBlob,
    }),
  );

  // Add standalone books as individual "series"
  standaloneBooks.forEach((book) => {
    seriesGroups.push({
      name: book.title,
      books: [book],
      coverBlob: book.coverBlob,
    });
  });

  return seriesGroups;
}
