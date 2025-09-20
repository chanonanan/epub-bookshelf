/**
 * Displays a grid of book covers with titles
 */
import { type FC, useEffect, useState, useRef } from 'react';
import { LazyImage } from './ui/lazy-image';
import { ReaderDialog } from './ReaderDialog';
import { listEpubFiles, downloadFile } from '../googleDrive';
import { extractBookInfo, getCachedMetadata, getCachedFolderBooks, saveFolderBooks } from '../epubUtils';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';

import { type BookMetadata } from '../epubUtils';
import { useNavigate } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";

interface SeriesGroup {
  name: string;
  books: BookMetadata[];
  coverUrl?: string;
}

interface BookshelfProps {
  folderId: string;
  initialSeries?: string;
}

export const Bookshelf: FC<BookshelfProps> = ({ folderId, initialSeries }) => {
  const navigate = useNavigate();
  const [books, setBooks] = useState<BookMetadata[]>([]);
  const [series, setSeries] = useState<SeriesGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const selectedSeries = initialSeries;
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  useEffect(() => {
    // Load books when folderId changes
    if (folderId) {
      loadBooks(folderId);
    }
  }, [folderId]);

  // Restore scroll position when changing views
  useEffect(() => {
    if (gridRef.current) {
      const scrollKey = `bookshelf-scroll-${folderId}-${initialSeries || 'all'}`;
      const savedScrollTop = sessionStorage.getItem(scrollKey);
      
      if (savedScrollTop) {
        // Delay scroll restoration to ensure content is rendered
        setTimeout(() => {
          gridRef.current?.scrollTo({
            top: Number(savedScrollTop),
            behavior: 'instant'
          });
        }, 0);
      }

      // Save scroll position when unmounting or changing view
      const currentGrid = gridRef.current;
      return () => {
        if (currentGrid) {
          sessionStorage.setItem(scrollKey, currentGrid.scrollTop.toString());
        }
      };
    }
  }, [folderId, initialSeries]);

  useEffect(() => {
    // Group books by series when books array changes
    const grouped = groupBooksBySeries(books);
    setSeries(grouped);
  }, [books]);

  const groupBooksBySeries = (books: BookMetadata[]): SeriesGroup[] => {
    const seriesMap = new Map<string, BookMetadata[]>();
    const standaloneBooks: BookMetadata[] = [];

    // Group books by series
    books.forEach(book => {
      if (book.series) {
        const seriesBooks = seriesMap.get(book.series) || [];
        seriesBooks.push(book);
        seriesMap.set(book.series, seriesBooks);
      } else {
        standaloneBooks.push(book);
      }
    });

    // Convert map to array and sort books within series
    const seriesGroups: SeriesGroup[] = Array.from(seriesMap.entries()).map(([name, books]) => ({
      name,
      books: books.sort((a, b) => (a.seriesIndex || 0) - (b.seriesIndex || 0)),
      coverUrl: books[0]?.coverUrl,
    }));

    // Add standalone books as individual "series"
    standaloneBooks.forEach(book => {
      seriesGroups.push({
        name: book.title,
        books: [book],
        coverUrl: book.coverUrl,
      });
    });

    return seriesGroups.sort((a, b) => a.name.localeCompare(b.name));
  };

  const loadBooks = async (folderId: string) => {
    try {
      setLoading(true);
      setError(null);

      // First try to get cached folder data
      const cachedBooks = await getCachedFolderBooks(folderId);
      if (cachedBooks.length > 0) {
        setBooks(cachedBooks);
        setLoading(false);
        return;
      }

      // Get list of EPUB files from Drive and process in background
      const files = await listEpubFiles(folderId);
      
      // Process each file
      const bookPromises: Promise<BookMetadata | null>[] = files.map(async (file) => {
        try {
          // Check cache first
          const cachedMetadata = await getCachedMetadata(file.id);
          
          if (cachedMetadata) {
            return {
              ...cachedMetadata,
              fileSize: file.size,
            };
          }

          // Download and process if not cached
          const epubBlob = await downloadFile(file.id);
          if (!epubBlob) return null;

          // Extract metadata and cover, then immediately clear the blob
          const metadata = await extractBookInfo(file.id, epubBlob);
          return {
            ...metadata,
            fileSize: file.size,
          };
        } catch (error) {
          console.error('Error processing file:', file.name, error);
          return null;
        }
      });

      const bookResults = await Promise.all(bookPromises);
      const newBooks = bookResults.filter((book): book is BookMetadata => 
        book !== null && 
        typeof book.id === 'string' &&
        typeof book.title === 'string' &&
        typeof book.author === 'string' &&
        Array.isArray(book.tags)
      );

      // Save to folder cache
      await saveFolderBooks(folderId, newBooks);
      setBooks(newBooks);
      
    } catch (err) {
      setError('Failed to load books. Please try again.');
      console.error('Error loading books:', err);
    } finally {
      setLoading(false);
    }
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 min-h-screen">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={() => loadBooks(folderId)}>
          Retry
        </Button>
      </div>
    );
  }

  const renderBookGrid = (books: BookMetadata[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {books.map((book) => (
        <button
          key={book.id}
          className="text-left focus:outline-none w-full"
          onClick={() => navigate(`/book/${book.id}`)}
        >
          <Card className="hover:bg-accent transition-colors">
            <CardHeader className="p-0">
              <div className="relative w-full aspect-[2/3] bg-muted rounded-t-lg overflow-hidden">
                <LazyImage
                  src={book.coverUrl || ''}
                  alt={`${book.title} cover`}
                  className="w-full h-full object-cover"
                />
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <CardTitle className="line-clamp-2 text-base mb-1">
                {book.series ? `${book.title} (#${typeof book.seriesIndex === 'number' ? book.seriesIndex : '?'})` : book.title}
              </CardTitle>
              <CardDescription className="line-clamp-1">
                {book.author}
              </CardDescription>
            </CardContent>
          </Card>
        </button>
      ))}

      <ReaderDialog
        bookId={selectedBookId}
        isOpen={isReaderOpen}
        onClose={() => {
          setIsReaderOpen(false);
          setSelectedBookId(null);
        }}
      />
    </div>
  );

  const renderSeriesGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {series.map((group) => (
        <Card
          key={group.name}
          className="hover:bg-accent transition-colors cursor-pointer relative"
          onClick={() => navigate(`/bookshelf/${folderId}/${encodeURIComponent(group.name)}`)}
        >
          <CardHeader className="p-0">
            <div className="relative w-full aspect-[2/3] bg-muted rounded-t-lg overflow-hidden">
              <LazyImage
                src={group.coverUrl || ''}
                alt={`${group.name} cover`}
                className="w-full h-full object-cover"
              />
              <Badge variant="default" className="absolute top-2 right-2">
                {group.books.length} book{group.books.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <CardTitle className="line-clamp-2 text-base">
              {group.name}
            </CardTitle>
            <CardDescription className="line-clamp-1">
              {group.books[0].author}
            </CardDescription>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div 
      ref={gridRef}
      className="container mx-auto px-4 py-8 min-h-screen overflow-y-auto scroll-smooth"
      style={{ scrollPaddingTop: '1rem' }}
    >
      <div className="mb-6 flex items-center justify-between sticky top-0 bg-background z-10 py-4">
        <div className="flex items-center">
          {selectedSeries && (
            <Button
              variant="outline"
              onClick={() => navigate(`/bookshelf/${folderId}`)}
              className="mr-4"
            >
              ← Back to All Series
            </Button>
          )}
          <h2 className="text-2xl font-bold">{selectedSeries || 'All Series'}</h2>
        </div>
      </div>
      {selectedSeries ? (
        renderBookGrid(series.find(s => s.name === selectedSeries)?.books || [])
      ) : (
        renderSeriesGrid()
      )}
    </div>
  );
};