import type { BookMetadata } from '@/epubUtils';
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
    <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3 sm:gap-4">
      {series.map((group) => (
        <button
          key={group.books[0]?.id ?? group.name}
          className="w-full text-left focus:outline-none"
          onClick={() =>
            navigate(`/bookshelf/${folderId}/${encodeURIComponent(group.name)}`)
          }
        >
          <Card className="h-full cursor-pointer transition-colors hover:bg-accent">
            <CardHeader className="p-0">
              <div className="relative aspect-[2/3] w-full overflow-hidden rounded-t-lg bg-muted">
                <LazyImage
                  src={group.coverBlob}
                  alt={`${group.name} cover`}
                  className="h-full w-full object-cover"
                />
                <Badge
                  variant="default"
                  className="absolute right-1 top-1 sm:right-2 sm:top-2"
                >
                  {group.books.length} book
                  {group.books.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-2">
              <CardTitle className="line-clamp-2 text-xs sm:text-sm">
                {group.name}
              </CardTitle>
              <CardDescription className="line-clamp-1 text-[11px]">
                {group.books[0].author}
              </CardDescription>
            </CardContent>
          </Card>
        </button>
      ))}
    </div>
  );
};
