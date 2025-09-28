import { GroupedShelf } from '@/components/bookshelf/GroupedShelf';
import { SearchBox } from '@/components/common/SearchBox';
import { ViewToggle } from '@/components/common/ViewToggle';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap justify-between items-center gap-2">
        <SearchBox />
        <div className="flex gap-2 flex-1 justify-end">
          <Select onValueChange={updateGroup}>
            <SelectTrigger className="w-full md:max-w-[120px]">
              <SelectValue placeholder="Group by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="author">Author</SelectItem>
              <SelectItem value="series">Series</SelectItem>
              <SelectItem value="tags">Tags</SelectItem>
            </SelectContent>
          </Select>
          <ViewToggle viewMode={viewMode} onChange={updateView} />
        </div>
      </div>

      {/* Shelf */}
      <GroupedShelf files={filtered} groupBy={groupBy} viewMode={viewMode} />
    </div>
  );
}
