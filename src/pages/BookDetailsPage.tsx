import { LazyImage } from '@/components/common/LazyImage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { db } from '@/db/schema';
import { batchProcessor } from '@/services/batchProcessor';
import { useLiveQuery } from 'dexie-react-hooks';
import DOMPurify from 'dompurify';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

export default function BookDetailsPage() {
  const { provider, fileId } = useParams<{
    provider: string;
    fileId: string;
  }>();
  const [refreshing, setRefreshing] = useState(false);

  const file = useLiveQuery(
    () => db.files.get([provider!, fileId!]),
    [provider, fileId],
  );

  useEffect(() => {
    if (refreshing && file?.metadata) {
      setRefreshing(false);
    }
  }, [file?.metadata, refreshing]);

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

  if (!file) return null;

  const folderId = file.folderId;
  let title = file.metadata?.title ?? file.name;
  if (typeof title === 'object') {
    title = title?.['#text'] || '';
  }

  let authors =
    file.metadata?.author?.map((a) => {
      if (typeof a === 'object') {
        return a?.['#text'] || '';
      }

      return a;
    }) || [];

  const refreshMetadata = () => {
    setRefreshing(true);
    batchProcessor.addJobs([file], true);
  };

  return (
    <div className="container mx-auto py-2 px-4">
      <h1 className="text-center md:text-left text-xl font-bold mb-4">
        {title}
      </h1>
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex flex-col items-center mx-0 flex-shrink-0 w-full md:w-64">
          {/* Cover image */}
          <LazyImage
            id={file.id}
            srcBlob={cover?.blob}
            alt={title ?? 'Book cover'}
            className="w-[70%] md:w-48 h-auto rounded shadow"
          />
          {/* Actions */}
          <div className="flex flex-col gap-2 mt-4 w-full">
            <Button variant="default" className="w-full">
              Download EPUB
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={refreshMetadata}
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : 'Refresh Metadata'}
            </Button>
            <Button disabled variant="outline">
              Reader (Coming soon)
            </Button>
          </div>
        </div>
        {/* Metadata */}
        <div className="flex-grow text-sm">
          <table className="table-auto">
            <tbody>
              {/* Authors */}
              {authors?.length ? (
                <tr>
                  <td className="font-semibold pr-4 align-top">Author:</td>
                  <td className="space-x-2">
                    {authors.map((a) => (
                      <Link
                        className="underline"
                        key={a}
                        to={`/${provider}/folder/${folderId}?author=${encodeURIComponent(a)}`}
                      >
                        {a}
                      </Link>
                    ))}
                  </td>
                </tr>
              ) : null}

              {/* Series */}
              {file.metadata?.series && (
                <tr>
                  <td className="font-semibold pr-4 align-top">Series:</td>
                  <td>
                    <Link
                      className="underline"
                      to={`/${provider}/folder/${folderId}?series=${encodeURIComponent(
                        file.metadata.series,
                      )}`}
                    >
                      {file.metadata.series}
                    </Link>
                  </td>
                </tr>
              )}

              {/* Language */}
              <tr>
                <td className="font-semibold pr-4 align-top">Language:</td>
                <td>{file.metadata?.language ?? 'N/A'}</td>
              </tr>

              {/* Publisher */}
              <tr>
                <td className="font-semibold pr-4 align-top">Publisher:</td>
                <td>{file.metadata?.publisher ?? 'N/A'}</td>
              </tr>

              {/* Size */}
              <tr>
                <td className="font-semibold pr-4 align-top">Size:</td>
                <td>
                  {file.size
                    ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
                    : 'Unknown'}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Description */}
          {sanitizedDescription && (
            <section>
              <span className="font-semibold block mb-2">Description</span>
              <div
                className="text-muted-foreground text-sm"
                dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
              />
            </section>
          )}

          {/* Tags */}
          {file.metadata?.tags?.length ? (
            <section className="flex gap-2 flex-wrap mt-4">
              {file.metadata.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  <Link
                    to={`/${provider}/folder/${folderId}?tag=${encodeURIComponent(tag)}`}
                  >
                    {tag}
                  </Link>
                </Badge>
              ))}
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
