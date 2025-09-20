/**
 * Displays a grid of book covers with titles
 */
import { type FC, useEffect, useState } from 'react';
import { ReaderDialog } from './ReaderDialog';
import { listEpubFiles, downloadFile } from '../googleDrive';
import { extractBookInfo, getCachedCover, getCachedMetadata } from '../epubUtils';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { BookDetailsDialog } from './BookDetailsDialog';
import { type BookMetadata } from '../epubUtils';

interface SeriesGroup {
  name: string;
  books: BookMetadata[];
  coverUrl?: string;
}

interface BookshelfProps {
  folderId: string;
}

export const Bookshelf: FC<BookshelfProps> = ({ folderId }) => {
  const [books, setBooks] = useState<BookMetadata[]>([]);
  const [series, setSeries] = useState<SeriesGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<BookMetadata | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  useEffect(() => {
    // Load books when folderId changes
    loadBooks(folderId);
  }, [folderId]);

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
      
      // Get list of EPUB files from Drive
      const files = await listEpubFiles(folderId);
      
      // Process each file
      const bookPromises = files.map(async (file) => {
        try {
          // Check cache first
          const cachedMetadata = await getCachedMetadata(file.id);
          const cachedCover = await getCachedCover(file.id);
          
          if (cachedMetadata && cachedCover) {
            // Create object URL for cached cover
            const coverUrl = URL.createObjectURL(cachedCover);
            return {
              ...cachedMetadata,
              coverUrl,
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
      setBooks(bookResults.filter((book): book is BookMetadata => book !== null));
      
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
          onClick={() => {
            setSelectedBook(book);
            setIsDetailsOpen(true);
          }}
        >
          <Card className="hover:bg-accent transition-colors">
            <CardHeader className="p-0">
              <div className="relative w-full aspect-[2/3] bg-muted rounded-t-lg overflow-hidden">
                {book.coverUrl ? (
                  <img
                    src={book.coverUrl}
                    alt={`${book.title} cover`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No Cover
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <CardTitle className="line-clamp-2 text-base mb-1">
                {book.series ? `${book.title} (#${book.seriesIndex || '?'})` : book.title}
              </CardTitle>
              <CardDescription className="line-clamp-1">
                {book.author}
              </CardDescription>
            </CardContent>
          </Card>
        </button>
      ))}

      <BookDetailsDialog
        book={selectedBook}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedBook(null);
        }}
        onRead={(bookId) => {
          setSelectedBookId(bookId);
          setIsDetailsOpen(false);
          setIsReaderOpen(true);
        }}
      />

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
          onClick={() => setSelectedSeries(group.name)}
        >
          <CardHeader className="p-0">
            <div className="relative w-full aspect-[2/3] bg-muted rounded-t-lg overflow-hidden">
              {group.coverUrl ? (
                <img
                  src={group.coverUrl}
                  alt={`${group.name} cover`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No Cover
                </div>
              )}
              <div className="absolute top-2 right-2 bg-background/80 px-2 py-1 rounded text-sm">
                {group.books.length} book{group.books.length !== 1 ? 's' : ''}
              </div>
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          {selectedSeries && (
            <Button
              variant="outline"
              onClick={() => setSelectedSeries(null)}
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