import type { BookMetadata } from '@/lib/epubUtils';
import { useNavigate } from 'react-router-dom';
import { Badge } from './ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { LazyImage } from './ui/lazy-image';

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
        <Card
          key={group.name}
          className="hover:bg-accent transition-colors cursor-pointer relative"
          onClick={() =>
            navigate(`/bookshelf/${folderId}/${encodeURIComponent(group.name)}`)
          }
        >
          <CardHeader className="p-0">
            <div className="relative w-full aspect-[2/3] bg-muted rounded-t-lg overflow-hidden">
              <LazyImage
                src={group.coverBlob}
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
};
