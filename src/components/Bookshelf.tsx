import { type FC, useRef } from 'react';
import { BookGrid } from './BookGrid';
import { SeriesGrid, type SeriesGroup } from './SeriesGrid';
import { Button } from './ui/button';
import { useBookshelf } from '@/hooks';
import type { BookMetadata } from '@/lib/epubUtils';
import { Loading } from './Loading';

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
  const { series, loading, error, refreshBooks } = useBookshelf(
    folderId,
    searchQuery,
    initialSeries
  );
  const gridRef = useRef<HTMLDivElement>(null);
  const selectedSeries = initialSeries;

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <ErrorShelf folderId={folderId} error={error} loadBooks={refreshBooks} />
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
