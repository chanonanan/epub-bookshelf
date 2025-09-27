import type { BookMetadata } from '@/lib/epubUtils';
import { useNavigate } from 'react-router-dom';
import { BookCard } from './BookCard';

export interface Series {
  name: string;
  books: BookMetadata[];
  coverBlob?: Blob;
}

interface SeriesGridProps {
  series: Series[];
  folderId: string;
}

export const SeriesGrid = ({ series, folderId }: SeriesGridProps) => {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4">
      {series.map((group, index) => (
        <BookCard
          key={group.name}
          book={{
            id: group.name,
            title: group.name,
            author: group.books[0].author,
            coverBlob: group.coverBlob,
            badge: group.books.length,
          }}
          index={index}
          onClick={() =>
            navigate(`/bookshelf/${folderId}/${encodeURIComponent(group.name)}`)
          }
        />
      ))}
    </div>
  );
};
