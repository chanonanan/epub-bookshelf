import { PageHeader } from '@/components/PageHeader';
import { LazyImage } from '@/components/ui/lazy-image';
import { Badge } from '@/components/ui/badge';
import type { LibraryFolder } from '@/types/library';
import DOMPurify from 'dompurify';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import {
  type BookMetadata,
  getCachedBooksInFolder,
  getMetadataById,
  refreshBookInfo,
} from '../epubUtils';
import { downloadFile } from '../googleDrive';
import { useTranslate } from '@/lib/useTranslate';

export default function BookDetailsPage({
  folders,
  onSearchChange,
}: {
  folders: LibraryFolder[];
  onSearchChange: (query: string) => void;
}) {
  const { t } = useTranslate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigationState = location.state as {
    returnScrollY?: number;
    returnTo?: string;
    seriesBookCount?: number;
  } | null;
  const [book, setBook] = useState<BookMetadata | null>(null);
  const [seriesBookCount, setSeriesBookCount] = useState(
    navigationState?.seriesBookCount,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const loadBook = async () => {
      if (!id) {
        setError(t('bookDetails.invalidBookId'));
        setIsLoading(false);
        return;
      }

      try {
        // Load book metadata from cache
        const metadata = await getMetadataById(id);
        if (!metadata) {
          setError(t('bookDetails.bookNotFound'));
          setIsLoading(false);
          return;
        }

        setBook(metadata);
      } catch (err) {
        console.error('Error loading book:', err);
        setError(t('bookDetails.failedToLoadBookDetails'));
      } finally {
        setIsLoading(false);
      }
    };

    loadBook();
  }, [id]);

  useEffect(() => {
    let isCurrent = true;
    const knownSeriesBookCount = navigationState?.seriesBookCount;

    if (knownSeriesBookCount !== undefined) {
      setSeriesBookCount(knownSeriesBookCount);
      return;
    }

    setSeriesBookCount(undefined);
    if (!book?.series || folders.length === 0) return;

    Promise.all(folders.map((folder) => getCachedBooksInFolder(folder.id)))
      .then((folderBooks) => {
        if (!isCurrent || folderBooks.some((books) => books === null)) return;
        const booksById = new Map(
          folderBooks
            .flatMap((books) => books ?? [])
            .map((cachedBook) => [cachedBook.id, cachedBook]),
        );
        setSeriesBookCount(
          Array.from(booksById.values()).filter(
            (cachedBook) => cachedBook.series === book.series,
          ).length,
        );
      })
      .catch((err) => {
        console.error('Error checking library series count:', err);
      });

    return () => {
      isCurrent = false;
    };
  }, [book?.series, folders, location.key, navigationState?.seriesBookCount]);

  const handleRefresh = async () => {
    if (!book?.id) return;

    setIsRefreshing(true);
    setError(null);

    try {
      const freshMetadata = await refreshBookInfo(book.id, book.fileSize ?? '');
      if (!freshMetadata) {
        throw new Error('Failed to refresh EPUB metadata');
      }
      setBook(freshMetadata);
    } catch (err) {
      console.error('Error refreshing metadata:', err);
      setError('Failed to refresh book metadata');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDownload = async () => {
    if (!book?.id) return;

    setIsDownloading(true);
    setError(null);

    try {
      const blob = await downloadFile(book.id);

      if (!blob) {
        throw new Error(t('bookDetails.failedToDownload'));
      }

      // Create download link with proper filename
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${book.title}.epub`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error('Error downloading book:', err);
      setError(t('bookDetails.failedToDownload'));
    } finally {
      setIsDownloading(false);
    }
  };

  const sanitizedDescription = useMemo(() => {
    if (!book?.description) return '';
    return DOMPurify.sanitize(book.description, { FORBID_ATTR: ['style'] });
  }, [book?.description]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 min-h-screen">
        <p className="text-destructive">{error || 'Book not found'}</p>
        <Button variant="outline" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="book-details-page">
      <div className="max-w-4xl mx-auto">
        <PageHeader
          backLabel={
            book.series && seriesBookCount !== 1 ? book.series : 'Bookshelf'
          }
          backTo={
            navigationState?.returnTo ??
            (book.series && seriesBookCount !== 1
              ? `/bookshelf?series=${encodeURIComponent(book.series)}&groupBy=none`
              : '/bookshelf')
          }
          backScrollY={navigationState?.returnScrollY}
          title={book.title}
          iconOnlyBack
        />
        <div className="flex flex-col gap-8 md:flex-row">
          <div className="mx-0 flex w-full flex-shrink-0 flex-col items-center md:w-64">
            <LazyImage
              src={book.coverBlob}
              alt={`${book.title} cover`}
              className="book-details-cover w-full max-w-[16rem] rounded-xl md:w-48"
              imageClassName="aspect-[2/3] w-full object-cover"
            />
            <div className="mt-5 flex w-full flex-col gap-2.5">
              <Button
                onClick={handleDownload}
                variant="default"
                className="w-full"
                disabled={isDownloading}
              >
                {isDownloading ? t('bookDetails.downloading') : t('bookDetails.downloadEpub')}
              </Button>
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="w-full"
                disabled={isRefreshing}
              >
                {isRefreshing ? t('common.refreshing') : t('bookDetails.refreshMetadata')}
              </Button>
            </div>
          </div>
          <div className="book-details-copy flex-grow text-sm">
            <table className="book-metadata table-auto border-separate border-spacing-y-2">
              <tbody>
                {book.author && (
                  <tr>
                    <th scope="row" className="pr-4 text-left align-top">
                      {t('bookDetails.author')}:
                    </th>
                    <td>
                      <Link
                        onClick={() => onSearchChange('')}
                        className="underline underline-offset-2"
                        to={`/bookshelf?author=${encodeURIComponent(book.author)}&groupBy=none`}
                      >
                        {book.author}
                      </Link>
                    </td>
                  </tr>
                )}
                {book.series && (
                  <tr>
                    <th scope="row" className="pr-4 text-left align-top">
                      {t('bookDetails.series')}:
                    </th>
                    <td>
                      <Link
                        onClick={() => onSearchChange('')}
                        className="underline underline-offset-2"
                        to={`/bookshelf?series=${encodeURIComponent(book.series)}&groupBy=none`}
                      >
                        {book.series}
                      </Link>
                      {book.seriesIndex && <> #{book.seriesIndex}</>}
                    </td>
                  </tr>
                )}
                {[
                  [t('bookDetails.language'), book.language],
                  [t('bookDetails.publisher'), book.publisher],
                  [t('bookDetails.published'), book.publishDate],
                  [t('bookDetails.fileSize'), book.fileSize],
                ].map(
                  ([label, value]) =>
                    value && (
                      <tr key={label}>
                        <th scope="row" className="pr-4 text-left align-top">
                          {label}:
                        </th>
                        <td>{value}</td>
                      </tr>
                    ),
                )}
              </tbody>
            </table>
            {sanitizedDescription && (
              <section className="prose mt-6 max-w-none dark:prose-invert">
                <h2 className="mb-3 text-base font-semibold">{t('bookDetails.description')}</h2>
                <div
                  className="book-description text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
                />
              </section>
            )}
            {book.tags && book.tags.length > 0 && (
              <section className="mt-5">
                <h2 className="mb-2 font-semibold">{t('bookDetails.tags')}</h2>
                <div className="flex flex-wrap gap-2">
                  {book.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      <Link
                        to={`/bookshelf?tag=${encodeURIComponent(tag)}&groupBy=none`}
                        onClick={() => onSearchChange('')}
                      >
                        {tag}
                      </Link>
                    </Badge>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
