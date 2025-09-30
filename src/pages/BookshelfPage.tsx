import type { BookCardProps } from '@/components/bookshelf/BookCard';
import { BookList } from '@/components/bookshelf/BookList';
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

  if (!files) return null;

  const viewMode = (params.get('view') as 'list' | 'card') ?? 'card';
  const groupBy =
    (params.get('groupBy') as 'author' | 'series' | 'tags' | 'none') ?? 'none';
  const search = params.get('search')?.toLowerCase();
  const filterAuthor = params.get('author')?.toLowerCase();
  const filterSeries = params.get('series')?.toLowerCase();
  const filterTag = params.get('tags')?.toLowerCase();

  const filtered = files.filter((f) => {
    // text search
    if (search) {
      const t = f.metadata?.title?.toLowerCase() ?? f.name.toLowerCase();
      const a = f.metadata?.author?.join(', ').toLowerCase() ?? '';
      const tags = f.metadata?.tags?.join(', ').toLowerCase() ?? '';
      if (
        !t.includes(search) &&
        !a.includes(search) &&
        !tags.includes(search)
      ) {
        return false;
      }
    }

    // author filter
    if (filterAuthor) {
      const authors = f.metadata?.author?.map((a) => a.toLowerCase()) ?? [];
      if (!authors.includes(filterAuthor)) return false;
    }

    // series filter
    if (filterSeries) {
      if (f.metadata?.series?.toLowerCase() !== filterSeries) return false;
    }

    // tags filter
    if (filterTag) {
      const tags = f.metadata?.tags?.map((t) => t.toLowerCase()) ?? [];
      if (!tags.includes(filterTag)) return false;
    }

    return true;
  });

  const grouped = groupFilesBy(
    filtered,
    groupBy || 'none',
    provider!,
    folderId!,
  );

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
    <div className="flex flex-1 flex-col space-y-4 container">
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
      <BookList files={grouped} viewMode={viewMode} />
    </div>
  );
}

function groupFilesBy(
  files: File[],
  groupBy: 'none' | 'author' | 'series' | 'tags',
  provider: string,
  folderId: string,
): Omit<BookCardProps, 'view' | 'index'>[] {
  if (groupBy === 'none')
    return files.map((file) => ({
      id: file.id,
      coverId: file.coverId!,
      title: file.metadata?.title || file.name,
      subTitle:
        (file.metadata?.author?.[0] as any)?.['#text'] ||
        file.metadata?.author?.[0],
      status: file.status,
      link: `/${provider}/file/${file.id}`,
    }));

  const seen = new Set<string>();
  const grouped: Omit<BookCardProps, 'view' | 'index'>[] = [];

  for (const f of files) {
    let key: string | undefined;
    let link: string = '';

    if (groupBy === 'author') {
      key = f.metadata?.author?.[0];
      link = `/${provider}/folder/${folderId}?author=${encodeURIComponent(key!)}`;
    } else if (groupBy === 'series') {
      key = f.metadata?.series;
      link = `/${provider}/folder/${folderId}?series=${encodeURIComponent(key!)}`;
    } else if (groupBy === 'tags') {
      key = f.metadata?.tags?.[0];
      link = `/${provider}/folder/${folderId}?tags=${encodeURIComponent(key!)}`;
    }

    if (key && !seen.has(key)) {
      seen.add(key);
      grouped.push({
        id: key,
        coverId: f.coverId!,
        title: key,
        status: f.status,
        link,
      });
    }
  }

  return grouped;
}
