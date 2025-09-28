import type { File } from '@/types/models';
import { BookList } from './BookList';

interface Props {
  files: File[];
  groupBy: 'author' | 'series' | 'tags' | 'none';
  viewMode: 'list' | 'card';
}

export function GroupedShelf({ files, groupBy, viewMode }: Props) {
  if (groupBy === 'none') {
    return <BookList files={files} viewMode={viewMode} />;
  }

  const groups: Record<string, File[]> = {};

  for (const file of files) {
    let keys: string[] = [];

    if (groupBy === 'author' && file.metadata?.author) {
      keys = file.metadata.author;
    } else if (groupBy === 'series' && file.metadata?.series) {
      keys = [file.metadata.series];
    } else if (groupBy === 'tags' && file.metadata?.tags) {
      keys = file.metadata.tags;
    } else {
      keys = ['Ungrouped'];
    }

    keys.forEach((k) => {
      groups[k] = groups[k] || [];
      groups[k].push(file);
    });
  }

  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([group, items]) => (
        <div key={group}>
          <h2 className="text-lg font-semibold mb-2">{group}</h2>
          <BookList files={items} viewMode={viewMode} />
        </div>
      ))}
    </div>
  );
}
