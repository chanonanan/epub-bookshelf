import { LazyImage } from '@/components/common/LazyImage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { db } from '@/db/schema';
import { useLiveQuery } from 'dexie-react-hooks';
import DOMPurify from 'dompurify';
import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';

export default function BookDetailsPage() {
  const { provider, fileId } = useParams<{
    provider: string;
    fileId: string;
  }>();

  const file = useLiveQuery(
    () => db.files.get([provider!, fileId!]),
    [provider, fileId],
  );

  const cover = useLiveQuery(
    () => (file?.coverId ? db.covers.get(file.coverId) : undefined),
    [file?.coverId],
  );

  const sanitizedDescription = useMemo(() => {
    if (!file?.metadata?.description) return '';
    return DOMPurify.sanitize(file.metadata?.description, {
      FORBID_ATTR: ['style'],
    });
  }, [file?.metadata?.description]);

  if (!file) return <div className="p-4">Loading...</div>;

  const folderId = file.folderId;

  return (
    <div className="max-w-4xl mx-auto py-2 px-4">
      <h1 className="text-xl font-bold mb-4">
        {file.metadata?.title ?? file.name}
      </h1>
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-shrink-0 w-full md:w-64">
          {/* Cover image */}
          <LazyImage
            id={file.id}
            srcBlob={cover?.blob}
            alt={file.metadata?.title ?? 'Book cover'}
            className="w-48 h-auto rounded shadow"
          />
          {/* Actions */}
          <div className="flex flex-col gap-2 mt-4">
            <Button variant="default" className="w-full">
              Download EPUB
            </Button>
            <Button variant="outline" className="w-full">
              Refresh Metadata
            </Button>
            <Button disabled variant="outline">
              Reader (Coming soon)
            </Button>
          </div>
        </div>
        {/* Metadata */}
        <div className="flex-grow">
          {/* Authors */}
          <div className="flex  mb-2">
            <span className="font-semibold w-[80px]">Author:</span>
            {file.metadata?.author?.length && (
              <div>
                {file.metadata.author.map((a) => (
                  <Badge key={a}>
                    <Link
                      to={`/${provider}/folder/${folderId}?author=${encodeURIComponent(
                        a,
                      )}`}
                    >
                      {a}
                    </Link>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Series */}
          {file.metadata?.series && (
            <div className="flex mb-2">
              <span className="font-semibold w-[80px]">Series:</span>
              <div>
                <Badge>
                  <Link
                    to={`/${provider}/folder/${folderId}?series=${encodeURIComponent(
                      file.metadata.series,
                    )}`}
                  >
                    {file.metadata.series}
                  </Link>
                </Badge>
              </div>
            </div>
          )}

          {/* Tags */}
          {file.metadata?.tags?.length ? (
            <div className="flex mb-2">
              <span className="font-semibold w-[80px]">Tags:</span>{' '}
              <div className="flex gap-2">
                {file.metadata.tags.map((tag) => (
                  <Badge key={tag}>
                    <Link
                      to={`/${provider}/folder/${folderId}?tag=${encodeURIComponent(
                        tag,
                      )}`}
                    >
                      {tag}
                    </Link>
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex mb-2">
            <span className="font-semibold w-[80px]">Language:</span>{' '}
            {file.metadata?.language ?? 'N/A'}
          </div>
          <div className="flex mb-2">
            <span className="font-semibold w-[80px]">Publisher:</span>{' '}
            {file.metadata?.publisher ?? 'N/A'}
          </div>
          <div className="flex mb-2">
            <span className="font-semibold w-[80px]">Size:</span>{' '}
            {file.size
              ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
              : 'Unknown'}
          </div>

          {/* Description */}
          {sanitizedDescription && (
            <div className="mb-2">
              <span className="font-semibold mb-2">Description</span>
              <div
                className="text-muted-foreground text-sm"
                dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
