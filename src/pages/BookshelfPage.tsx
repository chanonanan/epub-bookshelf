import { Bookshelf } from '@/components/Bookshelf';
import { RoutingPath } from '@/components/RoutingPath';
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
    <div className="max-w-4xl mx-auto">
      <RoutingPath />
      <Bookshelf folderId={folderId} searchQuery={searchQuery} />
    </div>
  );
}
