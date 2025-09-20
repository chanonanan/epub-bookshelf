/**
 * EPUB reader component using epub.js
 */
import { type FC, useCallback, useEffect, useRef, useState } from 'react';
import { Book, Rendition } from 'epubjs';
import epub from 'epubjs';
import { downloadFile } from '../googleDrive';

interface ReaderProps {
  bookId: string | null;
  onClose: () => void;
}

export const Reader: FC<ReaderProps> = ({ bookId, onClose }) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [rendition, setRendition] = useState<Rendition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (!rendition) return;

    switch(e.key) {
      case 'ArrowLeft':
        rendition.prev();
        break;
      case 'ArrowRight':
        rendition.next();
        break;
    }
  }, [rendition]);

  useEffect(() => {
    if (!bookId || !viewerRef.current) return;

    const loadBook = async () => {
      try {
        setError(null);
        setIsLoading(true);

        // Download EPUB file
        const epubBlob = await downloadFile(bookId);
        if (!epubBlob) {
          setError('Failed to download book');
          return;
        }

        // Convert Blob to ArrayBuffer
        const arrayBuffer = await epubBlob.arrayBuffer();
        
        // Create EPUB.js book
        const book = epub(arrayBuffer) as Book;
        await book.ready;

        // Create rendition
        if (!viewerRef.current) throw new Error('Viewer element not found');
        const rendition = book.renderTo(viewerRef.current, {
          width: '100%',
          height: '100%',
          spread: 'auto',
        });
        setRendition(rendition);

        // Display the book
        await rendition.display();

        // Add keyboard navigation
        document.addEventListener('keyup', handleKeyPress);
        return () => document.removeEventListener('keyup', handleKeyPress);

      } catch (err) {
        console.error('Error loading book:', err);
        setError('Failed to load book');
      } finally {
        setIsLoading(false);
      }
    };

    loadBook();
  }, [bookId, handleKeyPress]);

  if (!bookId) return null;

  return (
    <div className="w-full h-full flex flex-col">
      {error ? (
        <div className="flex-1 flex items-center justify-center text-destructive">
          {error}
        </div>
      ) : isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div ref={viewerRef} className="flex-1 overflow-hidden"></div>
      )}
    </div>
  );
};