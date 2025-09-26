import type { Series } from '@/components/SeriesGrid';
import { type BookMetadata, getBooksInFolder } from '@/lib/epubUtils';
import { useEffect, useMemo, useState } from 'react';

interface UseBookshelfResult {
  books: BookMetadata[];
  filteredBooks: BookMetadata[];
  series: Series[];
  loading: boolean;
  error: string | null;
  refreshBooks: () => Promise<void>;
}

export function useBookshelf(
  folderId: string,
  searchQuery: string = '',
  initialSeries?: string,
): UseBookshelfResult {
  const [books, setBooks] = useState<BookMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBooks = async () => {
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

  useEffect(() => {
    if (folderId) {
      loadBooks();
    }
  }, [folderId]);

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

  const series = useMemo(() => {
    const groupedSeries: { [key: string]: BookMetadata[] } = {};

    // Group books by series
    filteredBooks.forEach((book) => {
      if (initialSeries) {
        // If initialSeries is provided, only include books from that series
        if (book.series === initialSeries) {
          if (!groupedSeries[initialSeries]) {
            groupedSeries[initialSeries] = [];
          }
          groupedSeries[initialSeries].push(book);
        }
      } else {
        // Otherwise, group all books by series
        const seriesName = book.series || 'Standalone';
        if (!groupedSeries[seriesName]) {
          groupedSeries[seriesName] = [];
        }
        groupedSeries[seriesName].push(book);
      }
    });

    // Convert to array and sort books within series
    return Object.entries(groupedSeries).map(([name, books]) => ({
      name,
      books: books.sort((a, b) => (a.seriesIndex || 0) - (b.seriesIndex || 0)),
      coverBlob: books[0]?.coverBlob,
    }));
  }, [filteredBooks, initialSeries]);

  return {
    books,
    filteredBooks,
    series,
    loading,
    error,
    refreshBooks: loadBooks,
  };
}
