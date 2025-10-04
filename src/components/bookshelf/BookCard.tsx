import { db } from '@/db/schema';
import { useLiveQuery } from 'dexie-react-hooks';
import { AlertCircle, Loader2 } from 'lucide-react';
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

  className?: string;
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
  className,
}: BookCardProps) {
  // Watch cover blob in Dexie
  const cover = useLiveQuery(
    () => (coverId ? db.covers.get(coverId) : undefined),
    [coverId],
  );

  // Fade-in effect
  const [loaded, setLoaded] = useState(false);
  const isLoading = status === 'processing' || status === 'pending';
  const isError = status === 'error';

  if (typeof title !== 'string') {
    throw new Error('Title is not valid', title);
  }

  if (view === 'list') {
    return (
      <Link to={link}>
        <li
          key={id}
          className={`relative group border rounded pr-3 py-2 flex 
          justify-between items-center gap-2 max-w-full overflow-hidden h-[90px]
          hover:bg-gray-50 dark:hover:bg-gray-800 transition ${className}
          ${isLoading || isError ? 'opacity-50' : 'opacity-100'}`}
        >
          {/* overlay for loader or error */}
          {(isLoading || isError) && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-black/30 backdrop-blur-sm rounded">
              {isLoading && (
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              )}
              {isError && <AlertCircle className="w-6 h-6 text-red-500" />}
            </div>
          )}

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
        </li>
      </Link>
    );
  }

  return (
    <div className="relative">
      {/* overlay for fade + icon */}
      {(isLoading || isError) && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/10 dark:bg-black/10 backdrop-blur-sm rounded">
          {isLoading && (
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          )}
          {isError && <AlertCircle className="w-8 h-8 text-red-500" />}
        </div>
      )}

      <Link
        to={link}
        className={`flex flex-col p-2 border rounded shadow hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-800 transition ${
          isLoading || isError ? 'opacity-50' : 'opacity-100'
        } ${className}`}
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
        {subTitle && (
          <p className="text-xs text-gray-500 truncate">{subTitle}</p>
        )}
      </Link>
    </div>
  );
}
