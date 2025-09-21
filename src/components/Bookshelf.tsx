import { type FC, useEffect, useState, useRef } from 'react';
import { getBooksInFolder } from '../epubUtils';
import { Button } from './ui/button';
import { type BookMetadata } from '../epubUtils';
import { BookGrid } from './BookGrid';
import { SeriesGrid, type SeriesGroup } from './SeriesGrid';

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
  const [series, setSeries] = useState<SeriesGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const selectedSeries = initialSeries;

  useEffect(() => {
    if (folderId) {
      loadBooks(folderId);
    }
  }, [folderId]);

  const filteredBooks = searchQuery
    ? books.filter(
        (book) =>
          book.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.series?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : books;

  // Group filtered books by series
  useEffect(() => {
    const groupedSeries: { [key: string]: BookMetadata[] } = {};

    filteredBooks.forEach((book) => {
      const seriesName = book.series || 'Standalone';
      if (!groupedSeries[seriesName]) {
        groupedSeries[seriesName] = [];
      }
      groupedSeries[seriesName].push(book);
    });

    const seriesGroups = Object.entries(groupedSeries).map(([name, books]) => ({
      name,
      books,
      coverBlob: books[0]?.coverBlob,
    }));

    setSeries(seriesGroups);
  }, [filteredBooks]);

  useEffect(() => {
    const grouped = groupBooksBySeries(books);
    setSeries(grouped);
  }, [books]);

  const loadBooks = async (folderId: string) => {
    try {
      setLoading(true);
      setError(null);
      const books = await getBooksInFolder(folderId);
      setBooks(books);
    } catch (err) {
      setError('Failed to load books. Please try again.');
      console.error('Error loading books:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingShelf />;
  }

  if (error) {
    return (
      <ErrorShelf folderId={folderId} error={error} loadBooks={loadBooks} />
    );
  }

  return (
    <div
      ref={gridRef}
      className="container mx-auto px-4 min-h-screen overflow-y-auto scroll-smooth"
      style={{ scrollPaddingTop: '1rem' }}
    >
      {selectedSeries ? (
        <BookGrid
          books={series.find((s) => s.name === selectedSeries)?.books || []}
        />
      ) : (
        <SeriesGrid series={series} folderId={folderId} />
      )}
    </div>
  );
};

function LoadingShelf() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
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

  return seriesGroups.sort((a, b) => a.name.localeCompare(b.name));
}
