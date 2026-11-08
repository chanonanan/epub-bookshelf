import type { BookMetadata } from '@/epubUtils';
import { Check, BookOpenCheck } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Badge } from './ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { LazyImage } from './ui/lazy-image';
import { PendingBookCard, type PendingBook } from './PendingBookCard';
import { VirtualizedCollection } from './VirtualizedCollection';

const preloadBookDetailsPage = () => {
  import('../pages/BookDetailsPage');
};

interface BookGridProps {
  books: BookMetadata[];
  viewMode?: 'grid' | 'list';
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelection?: (id: string) => void;
  pendingBooks?: PendingBook[];
}

export const BookGrid = ({
  books,
  viewMode = 'grid',
  selectionMode = false,
  selectedIds = new Set(),
  onToggleSelection,
  pendingBooks = [],
}: BookGridProps) => {
  const navigate = useNavigate();
  const { series } = useParams<{ series: string }>();
  const location = useLocation();

  const renderItem = (index: number) => {
    if (index >= books.length) {
      return (
        <PendingBookCard
          book={pendingBooks[index - books.length]}
          viewMode={viewMode}
        />
      );
    }

    const book = books[index];
    return (
      <button
        key={book.id}
        type="button"
        aria-pressed={selectionMode ? selectedIds.has(book.id) : undefined}
        className={`book-grid-item group relative h-full w-full rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
          viewMode === 'list'
            ? 'flex items-center gap-3 rounded-lg border bg-card p-2 transition hover:bg-gray-50 dark:hover:bg-gray-800'
            : ''
        } ${selectedIds.has(book.id) ? 'ring-2 ring-primary' : ''}`}
        onMouseEnter={preloadBookDetailsPage}
        onClick={() => {
          if (selectionMode) {
            onToggleSelection?.(book.id);
            return;
          }
          navigate(`/book/${book.id}`, {
            state: {
              seriesBookCount: books.length,
              seriesName: series ?? book.series,
              returnScrollY: window.scrollY,
              returnTo: `${location.pathname}${location.search}`,
            },
          });
        }}
      >
        {viewMode === 'grid' ? (
          <Card className="book-grid-card h-full border bg-card p-2">
            <CardHeader className="p-0">
              <div className="relative aspect-[2/3] w-full min-h-0 flex-none overflow-hidden rounded-md bg-muted">
                <LazyImage
                  src={book.coverBlob}
                  alt=""
                  className="absolute inset-0 h-full w-full"
                  imageClassName="h-full w-full object-cover"
                />
                {book.seriesIndex! > 0 && (
                  <Badge variant="default" className="absolute right-2 top-2">
                    {book.seriesIndex}
                  </Badge>
                )}
                {selectionMode && (
                  <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border bg-background/90">
                    {selectedIds.has(book.id) && (
                      <Check aria-hidden="true" className="h-4 w-4" />
                    )}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-1 pt-2.5">
              <CardTitle className="mb-1 min-h-8 line-clamp-2 text-xs leading-snug sm:min-h-10 sm:text-sm">
                {book.title}
              </CardTitle>
              <CardDescription className="line-clamp-1 text-[11px]">
                {book.author}
              </CardDescription>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="relative h-20 w-14 flex-none overflow-hidden rounded bg-muted">
              <LazyImage
                src={book.coverBlob}
                alt=""
                className="absolute inset-0 h-full w-full"
                imageClassName="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-medium">{book.title}</p>
              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                {book.author}
              </p>
              {book.series && (
                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                  {book.series}
                </p>
              )}
            </div>
            {selectionMode ? (
              <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full border bg-background">
                {selectedIds.has(book.id) && (
                  <Check aria-hidden="true" className="h-4 w-4" />
                )}
              </span>
            ) : (
              <BookOpenCheck
                aria-hidden="true"
                className="h-4 w-4 flex-none text-muted-foreground"
              />
            )}
          </>
        )}
      </button>
    );
  };

  return (
    <VirtualizedCollection
      itemCount={books.length + pendingBooks.length}
      viewMode={viewMode}
      renderItem={renderItem}
    />
  );
};
