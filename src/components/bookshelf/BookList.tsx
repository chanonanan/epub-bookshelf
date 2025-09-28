import type { File } from '@/types/models';
import { BookCard } from './BookCard';

interface Props {
  files: File[];
  viewMode: 'list' | 'card';
}

export function BookList({ files, viewMode }: Props) {
  if (viewMode === 'list') {
    return (
      <ul className="divide-y">
        {files.map((file, index) => (
          <li key={file.id} className="p-2">
            <BookCard file={file} index={index} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {files.map((file, index) => (
        <BookCard key={file.id} file={file} index={index} />
      ))}
    </div>
  );
}
