import { GroupedShelf } from '@/components/bookshelf/GroupedShelf';
import { SearchBox } from '@/components/common/SearchBox';
import { ViewToggle } from '@/components/common/ViewToggle';
import { db } from '@/db/schema';
import { batchProcessor } from '@/services/batchProcessor';
import type { File } from '@/types/models';
import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

export default function BookshelfPage() {
  const { provider, folderId } = useParams<{
    provider: string;
    folderId: string;
  }>();
  const [params, setParams] = useSearchParams();

  const viewMode = (params.get('view') as 'list' | 'card') ?? 'card';
  const groupBy =
    (params.get('groupBy') as 'author' | 'series' | 'tags' | 'none') ?? 'none';
  const search = params.get('search')?.toLowerCase();

  // Get files from Dexie (updated progressively by workers)
  const files = useLiveQuery(
    () => db.files.where({ provider, folderId }).toArray(),
    [provider, folderId],
  ) as File[] | undefined;

  // Enqueue jobs when folder opens
  useEffect(() => {
    if (files?.length) {
      batchProcessor.addJobs(files);
    }
  }, [files]);

  if (!files) return <div className="p-4">Loading files…</div>;

  // Filtering
  const filtered = files.filter((f) => {
    if (!search) return true;
    const t = f.metadata?.title?.toLowerCase() ?? f.name.toLowerCase();
    const a = f.metadata?.author?.join(', ').toLowerCase() ?? '';
    const tags = f.metadata?.tags?.join(', ').toLowerCase() ?? '';
    return t.includes(search) || a.includes(search) || tags.includes(search);
  });

  // Handlers
  const updateView = (mode: 'list' | 'card') => {
    params.set('view', mode);
    setParams(params);
  };
  const updateGroup = (g: 'author' | 'series' | 'tags' | 'none') => {
    params.set('groupBy', g);
    setParams(params);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap justify-between items-center gap-2">
        <SearchBox />
        <div className="flex gap-2">
          <select
            value={groupBy}
            onChange={(e) => updateGroup(e.target.value as any)}
            className="px-2 py-1 border rounded"
          >
            <option value="none">No Group</option>
            <option value="author">Author</option>
            <option value="series">Series</option>
            <option value="tags">Tags</option>
          </select>
          <ViewToggle viewMode={viewMode} onChange={updateView} />
        </div>
      </div>

      {/* Shelf */}
      <GroupedShelf files={filtered} groupBy={groupBy} viewMode={viewMode} />
    </div>
  );
}
