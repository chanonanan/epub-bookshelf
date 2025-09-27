import {
  type BookMetadata,
  extractBookInfo,
  getMetadataById,
} from '@/lib/epubUtils';
import { FileUtil } from '@/lib/googleDrive';
import { useEffect, useState } from 'react';

interface UseBookResult {
  book: BookMetadata | null;
  isLoading: boolean;
  error: string | null;
  refreshMetadata: () => Promise<void>;
  downloadBook: () => Promise<void>;
}

export function useBook(bookId: string | undefined): UseBookResult {
  const [book, setBook] = useState<BookMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const loadBook = async () => {
      if (!bookId) {
        setError('Invalid book ID');
        setIsLoading(false);
        return;
      }

      try {
        const metadata = await getMetadataById(bookId);
        if (!metadata) {
          setError('Book not found');
          return;
        }
        setBook(metadata);
      } catch (err) {
        console.error('Error loading book:', err);
        setError('Failed to load book details');
      } finally {
        setIsLoading(false);
      }
    };

    loadBook();
  }, [bookId]);

  const refreshMetadata = async () => {
    if (!book?.id) return;

    setIsRefreshing(true);
    setError(null);

    try {
      const blob = await FileUtil.getFileById(book.id);
      if (!blob) {
        throw new Error('Failed to download EPUB file');
      }

      const freshMetadata = await extractBookInfo(book.id, blob);
      setBook(freshMetadata);
    } catch (err) {
      console.error('Error refreshing metadata:', err);
      setError('Failed to refresh book metadata');
    } finally {
      setIsRefreshing(false);
    }
  };

  const downloadBook = async () => {
    if (!book?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const blob = await FileUtil.getFileById(book.id);
      if (!blob) {
        throw new Error('Failed to download file');
      }

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${book.title}.epub`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error('Error downloading book:', err);
      setError('Failed to download book');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    book,
    isLoading: isLoading || isRefreshing,
    error,
    refreshMetadata,
    downloadBook,
  };
}
