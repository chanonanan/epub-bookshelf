import { type BookMetadata, getBooksInFolder } from '@/epubUtils';
import type { LibraryFolder } from '@/types/library';
import {
  type FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
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

export const Bookshelf: FC<BookshelfProps> = ({
  folders,
  initialSeries,
  searchQuery = '',
}) => {
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
  const [error, setError] = useState<string | null>(null);
  const [announcedProgress, setAnnouncedProgress] = useState('');
  const gridRef = useRef<HTMLDivElement>(null);
  const loadIdRef = useRef(0);
  const bookOrderRef = useRef(new Map<string, number>());
  const lastAnnouncedProcessedRef = useRef(0);
  const selectedSeries = initialSeries;

  const filteredBooks = useMemo(() => {
    const visibleBooks = loadedCacheKey === cacheKey ? books : [];
    return searchQuery
      ? visibleBooks.filter(
          (book) =>
            book.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            book.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            book.series?.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : visibleBooks;
  }, [books, cacheKey, loadedCacheKey, searchQuery]);

  const series = useMemo(
    () => groupBooksBySeries(filteredBooks),
    [filteredBooks],
  );
  const isLoading = loading || loadedCacheKey !== cacheKey;
  const isEmptyLibrary = !isLoading && books.length === 0 && !searchQuery;

  const loadBooks = useCallback(async (sources: LibraryFolder[]) => {
    const loadId = ++loadIdRef.current;
    const shelfKey = getBookshelfCacheKey(sources);
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
    bookOrderRef.current.clear();
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

            const combined = new Map<string, BookMetadata>();
            completedBooks.forEach((book) => combined.set(book.id, book));
            sourceBooks.forEach((book) => {
              if (book) combined.set(book.id, book);
            });
            const orderedBooks = Array.from(combined.values());
            bookOrderRef.current = new Map(
              orderedBooks.map((book, index) => [book.id, index]),
            );
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
        <BookGrid
          books={series.find((s) => s.name === selectedSeries)?.books || []}
        />
      ) : series.length > 0 ? (
        <SeriesGrid series={series} />
      ) : !isLoading && !searchQuery ? (
        <p className="py-12 text-center text-muted-foreground">
          No EPUB books found in your library.
        </p>
      ) : null}
    </div>
  );
};

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
