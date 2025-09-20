import { type FC } from 'react';
import { Badge } from './ui/badge/index';
import { Button } from './ui/button';

import { Card } from './ui/card';
import { type BookMetadata } from '../epubUtils';

interface BookDetailsProps {
  book: BookMetadata;
  onRead: () => void;
  onDownload: () => void;
  downloading?: boolean;
}

export const BookDetails: FC<BookDetailsProps> = ({ book, onRead, onDownload, downloading = false }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">{book.title}</h2>
          {book.author && (
            <div className="text-lg text-muted-foreground">{book.author}</div>
          )}
          <div className="flex gap-2 mt-4">
            <Button onClick={onRead}>Read</Button>
            <Button onClick={onDownload} disabled={downloading} variant="outline">
              {downloading ? 'Downloading...' : 'Download'}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[200px,1fr] gap-8">
        <div>
          <Card className="overflow-hidden">
            <div className="aspect-[2/3] relative">
              {book.coverUrl ? (
                <img
                  src={book.coverUrl}
                  alt={`${book.title} cover`}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
                  No Cover
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          {book.series && (
            <div>
              <h3 className="font-semibold mb-1">Series</h3>
              <p>
                {book.series} {book.seriesIndex ? `#${book.seriesIndex}` : ''}
              </p>
            </div>
          )}

          {book.description && (
            <div>
              <h3 className="font-semibold mb-1">Description</h3>
              <p className="text-muted-foreground">{book.description}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {book.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>

          <div className="space-y-1 mt-2">
            <h3 className="text-sm font-medium">Book Details</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted-foreground">
              {book.series && (
                <div className="col-span-2">
                  <span className="font-medium">Series:</span> {book.series} {book.seriesIndex ? `#${book.seriesIndex}` : ''}
                </div>
              )}
              {book.publisher && (
                <div>
                  <span className="font-medium">Publisher:</span> {book.publisher}
                </div>
              )}
              {book.publishDate && (
                <div>
                  <span className="font-medium">Published:</span>{' '}
                  {new Date(book.publishDate).getFullYear()}
                </div>
              )}
              {book.language && (
                <div>
                  <span className="font-medium">Language:</span>{' '}
                  {book.language.toUpperCase()}
                </div>
              )}
              {book.fileSize && (
                <div>
                  <span className="font-medium">Size:</span> {book.fileSize}
                </div>
              )}
              {book.calibreId && (
                <div>
                  <span className="font-medium">Calibre ID:</span> {book.calibreId}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};