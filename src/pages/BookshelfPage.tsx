import { Bookshelf } from '@/components/Bookshelf';
import { useParams } from 'react-router-dom';

interface BookshelfPageProps {
  searchQuery?: string;
}

export default function BookshelfPage({ searchQuery }: BookshelfPageProps) {
  const { folderId } = useParams<{
    folderId: string;
  }>();

  if (!folderId) {
    return <div>Invalid folder ID</div>;
  }

  return (
    <div className="mx-auto pt-4">
      <Bookshelf folderId={folderId} searchQuery={searchQuery} />
    </div>
  );
}
