import type { BookMetadata } from '@/epubUtils';
import { useNavigate } from 'react-router-dom';
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
          className="group w-full rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          onClick={() => {
            if (group.books.length === 1) {
              navigate(
                `/book/${folderId}/${encodeURIComponent(group.name)}/${group.books[0].id}`,
              );
              return;
            }
            navigate(
              `/bookshelf/${folderId}/${encodeURIComponent(group.name)}`,
            );
          }}
        >
          <Card className="h-full cursor-pointer border-0 bg-transparent shadow-none transition-colors hover:bg-transparent">
            <CardHeader className="p-0">
              <div className="relative aspect-[2/3] w-full min-h-0 flex-none bg-muted">
                {group.books.length > 1 ? (
                  <>
                    {group.books.slice(1, 3).map((book, index) => {
                      const stackOffset = (2 - index) * 5;

                      return (
                        <div
                          key={book.id}
                          aria-hidden="true"
                          className="absolute inset-0 overflow-hidden shadow-[1px_1px_2px_rgba(0,0,0,0.3)]"
                          style={{
                            transform: `translate(${stackOffset}px, -${stackOffset}px)`,
                            zIndex: index + 1,
                          }}
                        >
                          <LazyImage
                            src={book.coverBlob}
                            alt=""
                            className="absolute inset-0 h-full w-full"
                            imageClassName="h-full w-full object-cover"
                          />
                        </div>
                      );
                    })}
                    <div className="absolute inset-0 z-[3] overflow-hidden">
                      <LazyImage
                        src={group.books[0].coverBlob}
                        alt=""
                        className="absolute inset-0 h-full w-full"
                        imageClassName="h-full w-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
                      />
                    </div>
                  </>
                ) : (
                  <LazyImage
                    src={group.coverBlob}
                    alt=""
                    className="absolute inset-0 h-full w-full"
                    imageClassName="h-full w-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
                  />
                )}
              </div>
            </CardHeader>
            <CardContent className="px-0 py-2">
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
