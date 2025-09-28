import type { File } from '@/types/models';
import { BookCard } from './BookCard';

interface Props {
  files: File[];
  viewMode: 'list' | 'card';
}

export function BookList({ files, viewMode }: Props) {
  if (viewMode === 'list') {
    return (
      <ul className="flex flex-col gap-2">
        {files.map((file, index) => (
          <BookCard file={file} index={index} view="list" />
        ))}
      </ul>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {files.map((file, index) => (
        <BookCard key={file.id} file={file} index={index} view="grid" />
      ))}
    </div>
  );
}
