import { RoutingPath } from '@/components/RoutingPath';
import { LazyImage } from '@/components/ui/lazy-image';
import { useBook } from '@/hooks';
import DOMPurify from 'dompurify';
import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';

export default function BookDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { book, isLoading, error, refreshMetadata, downloadBook } = useBook(id);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshMetadata();
    setIsRefreshing(false);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    await downloadBook();
    setIsDownloading(false);
  };

  const sanitizedDescription = useMemo(() => {
    if (!book?.description) return '';
    return DOMPurify.sanitize(book.description, { FORBID_ATTR: ['style'] });
  }, [book?.description]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error || 'Book not found'}</p>
        <Button variant="outline" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-4xl mx-auto pb-8">
        <RoutingPath />
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-shrink-0 w-full md:w-64">
            <LazyImage
              src={book.coverBlob}
              alt={`${book.title} cover`}
              className="w-full aspect-[2/3] object-cover rounded-lg shadow-lg"
            />
            <div className="flex flex-col gap-2 mt-4">
              <Button
                onClick={handleDownload}
                variant="default"
                className="w-full"
                disabled={isDownloading}
              >
                {isDownloading ? 'Downloading...' : 'Download EPUB'}
              </Button>
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="w-full"
                disabled={isRefreshing}
              >
                {isRefreshing ? 'Refreshing...' : 'Refresh Metadata'}
              </Button>
            </div>
          </div>
          <div className="flex-grow">
            <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
            {book.series && (
              <p className="text-lg text-muted-foreground mb-4">
                Series: {book.series}
                {book.seriesIndex && <> #{book.seriesIndex}</>}
              </p>
            )}
            <p className="text-xl mb-6">{book.author}</p>
            {sanitizedDescription && (
              <div className="prose dark:prose-invert mb-6">
                <h2 className="text-xl font-semibold mb-2">Description</h2>
                <div
                  className="text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {book.publisher && (
                <div>
                  <h3 className="font-semibold">Publisher</h3>
                  <p>{book.publisher}</p>
                </div>
              )}
              {book.publishDate && (
                <div>
                  <h3 className="font-semibold">Published</h3>
                  <p>
                    {new Date(book.publishDate).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}
              {book.language && (
                <div>
                  <h3 className="font-semibold">Language</h3>
                  <p>{book.language}</p>
                </div>
              )}
              {book.fileSize && (
                <div>
                  <h3 className="font-semibold">File Size</h3>
                  <p>{book.fileSize}</p>
                </div>
              )}
            </div>
            {book.tags && book.tags.length > 0 && (
              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-2">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {book.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 rounded-full bg-primary/10 text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
