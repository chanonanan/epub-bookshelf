import { db } from '@/db/schema';
import { useLiveQuery } from 'dexie-react-hooks';
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

  if (!file) return <div>Loading…</div>;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">
        {file.metadata?.title ?? file.name}
      </h1>
      <p>Author: {file.metadata?.author?.join(', ') ?? 'Unknown'}</p>
      <p>Series: {file.metadata?.series ?? '—'}</p>
      <p>Tags: {file.metadata?.tags?.join(', ') ?? '—'}</p>

      <div className="flex gap-2">
        <button className="btn-primary">Download</button>
        <Link
          to={`/${provider}/file/${file.id}/reader`}
          className="btn-secondary disabled"
        >
          Read (coming soon)
        </Link>
      </div>
    </div>
  );
}
