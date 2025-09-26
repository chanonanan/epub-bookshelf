import type { BookMetadata } from '@/lib/epubUtils';
import { useNavigate } from 'react-router-dom';
import { BookCard } from './BookCard';

export interface SeriesGroup {
  name: string;
  books: BookMetadata[];
  coverBlob?: Blob;
}

export const SeriesGrid = ({
  series,
  folderId,
}: {
  series: SeriesGroup[];
  folderId: string;
}) => {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {series.map((group) => (
        <BookCard
          key={group.name}
          book={{
            id: group.name,
            title: group.name,
            author: group.books[0].author,
            coverBlob: group.coverBlob,
            badge: group.books.length,
          }}
          onClick={() =>
            navigate(`/bookshelf/${folderId}/${encodeURIComponent(group.name)}`)
          }
        />
      ))}
    </div>
  );
};
