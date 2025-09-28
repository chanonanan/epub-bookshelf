import placeholderCover from '@/assets/placeholder.jpg';
import { db } from '@/db/schema';
import type { File } from '@/types/models';
import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { LazyImage } from '../common/LazyImage';

export function BookCard({ file, index }: { file: File; index: number }) {
  const { provider } = useParams<{ provider: string }>();

  // Watch cover blob in Dexie
  const cover = useLiveQuery(
    () => (file.coverId ? db.covers.get(file.coverId) : undefined),
    [file.coverId],
  );

  // Create Object URL + cleanup
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  useEffect(() => {
    if (cover?.blob) {
      const url = URL.createObjectURL(cover.blob);
      setObjectUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setObjectUrl(null);
    }
  }, [cover?.blob]);

  // Fade-in effect
  const [loaded, setLoaded] = useState(false);

  const coverSrc = objectUrl ?? placeholderCover;
  const title = file.metadata?.title ?? file.name;
  if (typeof title !== 'string') {
    throw new Error('Title is not valid', title);
  }
  const author = file.metadata?.author?.join(', ') ?? 'Unknown Author';

  // Map status to label + color
  const statusMap: Record<string, { text: string; className: string }> = {
    pending: { text: 'Queued…', className: 'text-gray-400' },
    fetching: { text: 'Fetching…', className: 'text-blue-400' },
    unzipping: { text: 'Unzipping…', className: 'text-yellow-500' },
    parsing: { text: 'Parsing…', className: 'text-green-500' },
    cover: { text: 'Extracting cover…', className: 'text-purple-500' },
    ready: { text: 'Ready', className: 'text-green-600' },
    error: { text: 'Failed', className: 'text-red-500' },
  };

  const statusLabel = statusMap[file.status] ?? null;

  return (
    <Link
      to={`/${provider}/file/${file.id}`}
      className="flex flex-col p-2 border rounded shadow hover:shadow-md transition"
    >
      <LazyImage
        isLCP={index < 5}
        src={coverSrc}
        alt={title}
        className={`w-full h-40 object-cover rounded mb-2 transition-opacity duration-500 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setLoaded(true)}
      />
      <h3 className="text-sm font-semibold truncate">{title}</h3>
      <p className="text-xs text-gray-500 truncate">{author}</p>

      {statusLabel && (
        <p className={`text-xs mt-1 ${statusLabel.className}`}>
          {statusLabel.text}
        </p>
      )}
    </Link>
  );
}
