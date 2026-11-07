import type { BookMetadata } from '@/epubUtils';
import { useNavigate, useParams } from 'react-router-dom';
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

export const BookGrid = ({ books }: { books: BookMetadata[] }) => {
  const navigate = useNavigate();
  const { series } = useParams<{ series: string }>();

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3 sm:gap-4">
      {books.map((book) => (
        <button
          key={book.id}
          className="group w-full rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          onMouseEnter={preloadBookDetailsPage}
          onClick={() =>
            navigate(`/book/${book.id}`, {
              state: {
                seriesBookCount: books.length,
                seriesName: series ? decodeURIComponent(series) : book.series,
              },
            })
          }
        >
          <Card className="border-0 bg-transparent shadow-none transition-colors hover:bg-transparent">
            <CardHeader className="p-0">
              <div className="relative w-full aspect-[2/3] min-h-0 flex-none bg-muted overflow-hidden">
                <LazyImage
                  src={book.coverBlob}
                  alt=""
                  className="absolute inset-0 h-full w-full"
                  imageClassName="h-full w-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
                />
                {book.seriesIndex! > 0 && (
                  <Badge variant="default" className="absolute top-2 right-2">
                    {book.seriesIndex}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-0 py-2">
              <CardTitle className="line-clamp-2 text-xs sm:text-sm mb-1">
                {book.title}
              </CardTitle>
              <CardDescription className="line-clamp-1 text-[11px]">
                {book.author}
              </CardDescription>
            </CardContent>
          </Card>
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
