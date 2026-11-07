import { Bookshelf } from '@/components/Bookshelf';
import type { LibraryFolder } from '@/types/library';

interface BookshelfPageProps {
  folders: LibraryFolder[];
  searchQuery?: string;
}

export default function BookshelfPage({
  folders,
  searchQuery,
}: BookshelfPageProps) {
  return (
    <div className="mx-auto pt-4">
      <Bookshelf folders={folders} searchQuery={searchQuery} />
    </div>
  );
}
