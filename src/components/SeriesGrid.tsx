import type { BookMetadata } from '@/epubUtils';
import { BookOpenCheck } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslate } from '@/lib/useTranslate';
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

export interface SeriesGroup {
  name: string;
  books: BookMetadata[];
  coverBlob?: Blob;
  filter?: { key: 'author' | 'tag' | 'untagged'; value: string };
}

type GroupBy = 'series' | 'author' | 'tags' | 'none';

export const SeriesGrid = ({
  series,
  viewMode = 'grid',
  groupBy = 'series',
  pendingBooks = [],
}: {
  series: SeriesGroup[];
  viewMode?: 'grid' | 'list';
  groupBy?: GroupBy;
  pendingBooks?: PendingBook[];
}) => {
  const { t } = useTranslate();
  const navigate = useNavigate();
  const location = useLocation();

  const renderItem = (index: number) => {
    if (index >= series.length) {
      return (
        <PendingBookCard
          book={pendingBooks[index - series.length]}
          viewMode={viewMode}
        />
      );
    }

    const group = series[index];
    return (
      <button
        key={group.books[0]?.id ?? group.name}
        type="button"
        className={`group h-full w-full rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
          viewMode === 'list'
            ? 'flex items-center gap-3 rounded-lg border bg-card p-2 transition hover:bg-gray-50 dark:hover:bg-gray-800'
            : ''
        }`}
        onClick={() => {
          const returnState = {
            returnScrollY: window.scrollY,
            returnGroupBy: groupBy,
            restoreScrollY: 0,
          };
          if (group.filter) {
            const filterQuery =
              group.filter.key === 'untagged'
                ? 'untagged=1&groupBy=none'
                : `${group.filter.key}=${encodeURIComponent(group.filter.value)}&groupBy=none`;
            navigate(`/bookshelf?${filterQuery}`, {
              state: returnState,
            });
            return;
          }
          if (group.books[0]?.series) {
            navigate(
              `/bookshelf?series=${encodeURIComponent(group.books[0].series)}&groupBy=none`,
              { state: returnState },
            );
            return;
          }
          if (group.books.length === 1) {
            navigate(`/book/${group.books[0].id}`, {
              state: {
                seriesBookCount: group.books.length,
                seriesName: group.books[0].series,
                returnScrollY: window.scrollY,
              },
            });
            return;
          }
          navigate(`/series/${encodeURIComponent(group.name)}`, {
            state: {
              ...returnState,
              returnTo: `${location.pathname}${location.search}`,
            },
          });
        }}
      >
        {viewMode === 'grid' ? (
          <Card className="h-full cursor-pointer border bg-card p-2 shadow transition hover:bg-gray-50 hover:shadow-md dark:hover:bg-gray-800">
            <CardHeader className="p-0">
              <div className="relative aspect-[2/3] w-full min-h-0 flex-none overflow-hidden rounded-sm bg-muted">
                {group.books.length > 1 ? (
                  <>
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 overflow-hidden rounded-sm shadow-sm"
                      style={{ transform: 'translate(12px, -12px)' }}
                    >
                      <LazyImage
                        src={group.books[1].coverBlob}
                        alt=""
                        className="absolute inset-0 h-full w-full"
                        imageClassName="h-full w-full object-cover"
                      />
                    </div>
                    <div className="absolute bottom-0 left-0 right-3 top-3 z-[3] overflow-hidden rounded-sm shadow-md">
                      <LazyImage
                        src={group.books[0].coverBlob}
                        alt=""
                        className="absolute inset-0 h-full w-full"
                        imageClassName="h-full w-full object-cover"
                      />
                    </div>
                  </>
                ) : (
                  <LazyImage
                    src={group.coverBlob}
                    alt=""
                    className="absolute inset-0 h-full w-full"
                    imageClassName="h-full w-full object-cover"
                  />
                )}
              </div>
            </CardHeader>
            <CardContent className="px-0 py-2">
              <CardTitle className="min-h-8 line-clamp-2 text-xs sm:min-h-10 sm:text-sm">
                {group.name}
              </CardTitle>
              <CardDescription className="line-clamp-1 text-[11px]">
                {group.books[0].author}
              </CardDescription>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="relative h-20 w-14 flex-none overflow-hidden rounded bg-muted">
              <LazyImage
                src={group.books[0]?.coverBlob}
                alt=""
                className="absolute inset-0 h-full w-full"
                imageClassName="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-medium">{group.name}</p>
              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                {group.books[0]?.author || t('common.unknownAuthor')}
              </p>
              {group.books.length > 1 && (
                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                  {t('bookshelf.bookCount', { count: group.books.length })}
                </p>
              )}
            </div>
            <BookOpenCheck
              aria-hidden="true"
              className="h-4 w-4 flex-none text-muted-foreground"
            />
          </>
        )}
      </button>
    );
  };

  return (
    <VirtualizedCollection
      itemCount={series.length + pendingBooks.length}
      viewMode={viewMode}
      renderItem={renderItem}
    />
  );
};
