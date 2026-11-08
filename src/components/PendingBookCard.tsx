import { AlertCircle, LoaderCircle } from 'lucide-react';
import { useTranslate } from '@/lib/useTranslate';

export interface PendingBook {
  id: string;
  name: string;
  failed: boolean;
}

export function PendingBookCard({
  book,
  viewMode,
}: {
  book: PendingBook;
  viewMode: 'grid' | 'list';
}) {
  const { t } = useTranslate();
  return (
    <div
      aria-label={book.failed ? t('pendingBook.failedToLoad', { name: book.name }) : t('pendingBook.loading', { name: book.name })}
      className={`min-w-0 ${
        viewMode === 'list'
          ? 'flex h-full items-center gap-3 rounded-lg border bg-card p-2'
          : ''
      }`}
    >
      <div
        className={
          viewMode === 'grid'
            ? 'relative aspect-[2/3] overflow-hidden rounded-sm bg-muted'
            : 'relative h-20 w-14 flex-none overflow-hidden rounded bg-muted'
        }
      >
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted via-muted/60 to-muted" />
        {book.failed ? (
          <AlertCircle
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-destructive"
          />
        ) : (
          <LoaderCircle
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 animate-spin text-muted-foreground"
          />
        )}
      </div>
      <p
        className={`line-clamp-2 text-xs text-muted-foreground sm:text-sm ${
          viewMode === 'grid' ? 'mt-2' : 'min-w-0'
        }`}
      >
        {book.name.replace(/\.epub$/i, '')}
      </p>
    </div>
  );
}
