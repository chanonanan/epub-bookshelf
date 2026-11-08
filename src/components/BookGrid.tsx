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
// import { Grid, type CellComponentProps } from 'react-window';

const preloadBookDetailsPage = () => {
  import('../pages/BookDetailsPage');
};

interface BookGridProps {
  books: BookMetadata[];
  viewMode?: 'grid' | 'list';
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelection?: (id: string) => void;
}

export const BookGrid = ({
  books,
  viewMode = 'grid',
  selectionMode = false,
  selectedIds = new Set(),
  onToggleSelection,
}: BookGridProps) => {
  const navigate = useNavigate();
  const { series } = useParams<{ series: string }>();
  const location = useLocation();

  return (
    <div
      className={
        viewMode === 'grid'
          ? 'grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3 sm:gap-4'
          : 'flex flex-col gap-2'
      }
    >
      {books.map((book) => (
        <button
          key={book.id}
          type="button"
          aria-pressed={selectionMode ? selectedIds.has(book.id) : undefined}
          className={`group relative w-full rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
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
            <Card className="h-full border bg-card p-2 shadow transition hover:bg-gray-50 hover:shadow-md dark:hover:bg-gray-800">
              <CardHeader className="p-0">
                <div className="relative aspect-[2/3] w-full min-h-0 flex-none overflow-hidden rounded-sm bg-muted">
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
              <CardContent className="px-0 py-2">
                <CardTitle className="mb-1 line-clamp-2 text-xs sm:text-sm">
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
      ))}
    </div>
  );
};

// // Instead of renderBookGrid(books)
// const VirtualizedBookGrid = ({ books }: { books: BookMetadata[] }) => {
//   const navigate = useNavigate();
//   const columnCount = 5; // adjust for your breakpoints
//   const rowCount = Math.ceil(books.length / columnCount);

//   const Cell = ({
//     books,
//     columnIndex,
//     rowIndex,
//     style,
//   }: CellComponentProps<{ books: BookMetadata[] }>) => {
//     const bookIndex = rowIndex * columnCount + columnIndex;
//     if (bookIndex >= books.length) return null;

//     const book = books[bookIndex];
//     return (
//       <div style={style} className="p-2">
//         <button
//           key={book.id}
//           className="text-left focus:outline-none w-full"
//           onMouseEnter={preloadBookDetailsPage}
//           onClick={() => navigate(`/book/${book.id}`)}
//         >
//           <Card className="hover:bg-accent transition-colors">
//             <CardHeader className="p-0">
//               <div className="relative w-full aspect-[2/3] bg-muted rounded-t-lg overflow-hidden">
//                 <LazyImage
//                   src={book.coverBlob}
//                   alt={`${book.title} cover`}
//                   className="w-full h-full object-cover"
//                 />
//               </div>
//             </CardHeader>
//             <CardContent className="p-4">
//               <CardTitle className="line-clamp-2 text-base mb-1">
//                 {book.series
//                   ? `${book.title} (#${typeof book.seriesIndex === 'number' ? book.seriesIndex : '?'})`
//                   : book.title}
//               </CardTitle>
//               <CardDescription className="line-clamp-1">
//                 {book.author}
//               </CardDescription>
//             </CardContent>
//           </Card>
//         </button>
//       </div>
//     );
//   };

//   return (
//     <Grid
//       cellComponent={Cell}
//       cellProps={{ books }}
//       columnCount={columnCount}
//       columnWidth={220} // match your card width
//       rowCount={rowCount}
//       rowHeight={360} // match your card height
//     />
//   );
// };
