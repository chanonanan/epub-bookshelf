import type { BookMetadata } from '@/lib/epubUtils';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookCard } from './BookCard';
import type { Series } from './SeriesGrid';
// import { Grid, type CellComponentProps } from 'react-window';

const preloadBookDetailsPage = () => {
  import('../pages/BookDetailsPage');
};

interface BookGridProps {
  selectedSeries: string;
  folderId: string;
  series: Series[];
}

export const BookGrid = ({
  series,
  folderId,
  selectedSeries,
}: BookGridProps) => {
  const navigate = useNavigate();
  const [books, setBooks] = useState<BookMetadata[]>([]);

  useEffect(() => {
    const selected = series.find((s) => s.name === selectedSeries);
    if (selected) {
      setBooks(selected.books);
    }
  }, [series, selectedSeries]);

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4">
      {books.map((book, index) => (
        <BookCard
          key={book.id}
          book={{
            id: book.id,
            title: book.title,
            author: book.author,
            coverBlob: book.coverBlob,
            badge: book.seriesIndex,
          }}
          index={index}
          onHover={preloadBookDetailsPage}
          onClick={() =>
            navigate(`/book/${folderId}/${selectedSeries}/${book.id}`)
          }
        />
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
