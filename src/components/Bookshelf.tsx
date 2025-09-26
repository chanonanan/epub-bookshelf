import { useBookshelf } from '@/hooks';
import { useLoading } from '@/hooks/useLoading';
import { type FC, useEffect, useRef } from 'react';
import { BookGrid } from './BookGrid';
import { SeriesGrid } from './SeriesGrid';
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
  const { series, loading, error, refreshBooks } = useBookshelf(
    folderId,
    searchQuery,
    initialSeries,
  );
  const gridRef = useRef<HTMLDivElement>(null);
  const { setLoading } = useLoading();
  const selectedSeries = initialSeries;

  useEffect(() => {
    if (loading) {
      setLoading(true, 'Loading books...');
    } else {
      setLoading(false);
    }
  }, [loading, setLoading]);

  if (loading) {
    return null;
  }

  if (error) {
    return (
      <ErrorShelf folderId={folderId} error={error} loadBooks={refreshBooks} />
    );
  }

  return (
    <div
      ref={gridRef}
      className="container mx-auto px-4 overflow-y-auto scroll-smooth"
      style={{ scrollPaddingTop: '1rem' }}
    >
      {selectedSeries ? (
        <BookGrid
          series={series}
          folderId={folderId}
          selectedSeries={selectedSeries}
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
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-destructive">{error}</p>
      <Button variant="outline" onClick={() => loadBooks(folderId)}>
        Retry
      </Button>
    </div>
  );
}
