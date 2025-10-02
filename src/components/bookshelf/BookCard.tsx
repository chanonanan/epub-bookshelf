import { db } from '@/db/schema';
import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LazyImage } from '../common/LazyImage';

export interface BookCardProps {
  id: string;
  coverId: string;
  title: string;
  subTitle?: string;
  status: string;
  view: 'grid' | 'list';
  index: number;
  link: string;
}

export function BookCard({
  id,
  coverId,
  title,
  subTitle,
  status,
  index,
  view,
  link,
}: BookCardProps) {
  // Watch cover blob in Dexie
  const cover = useLiveQuery(
    () => (coverId ? db.covers.get(coverId) : undefined),
    [coverId],
  );

  // Fade-in effect
  const [loaded, setLoaded] = useState(false);

  if (typeof title !== 'string') {
    throw new Error('Title is not valid', title);
  }

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

  const statusLabel = statusMap[status] ?? null;

  if (view === 'list') {
    return (
      <Link to={link}>
        <li
          key={id}
          className="relative group border rounded pr-3 py-2 flex justify-between items-center gap-2 max-w-full overflow-hidden h-[90px] hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          <LazyImage
            id={id}
            isLCP={index < 5}
            srcBlob={cover?.blob}
            alt={title}
            className={`h-[90px] aspect-[2/3] object-cover rounded transition-opacity duration-500 ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setLoaded(true)}
          />
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            <h3 className="text-sm font-semibold line-clamp-2">{title}</h3>
            {subTitle && (
              <p className="text-xs text-gray-500 truncate">{subTitle}</p>
            )}
          </div>
          {statusLabel && (
            <span
              className={`text-xs mt-1 flex-shrink-0 ${statusLabel.className}`}
            >
              {statusLabel.text}
            </span>
          )}
        </li>
      </Link>
    );
  }

  return (
    <Link
      to={link}
      className="flex flex-col p-2 border rounded shadow hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-800 transition"
    >
      <LazyImage
        id={id}
        isLCP={index < 5}
        srcBlob={cover?.blob}
        alt={title}
        className={`w-full aspect-[2/3] max-h-[300px] max-w-[150px] object-cover rounded mb-2 transition-opacity duration-500 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setLoaded(true)}
      />
      <h3 className="text-sm font-semibold truncate">{title}</h3>
      {subTitle && <p className="text-xs text-gray-500 truncate">{subTitle}</p>}

      {statusLabel && (
        <p className={`text-xs mt-1 ${statusLabel.className}`}>
          {statusLabel.text}
        </p>
      )}
    </Link>
  );
}
