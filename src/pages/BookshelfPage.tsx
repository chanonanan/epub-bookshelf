import { Bookshelf } from '@/components/Bookshelf';
import { RoutingPath } from '@/components/RoutingPath';
import { useParams } from 'react-router-dom';

interface BookshelfPageProps {
  folderName?: string;
  searchQuery?: string;
}

export default function BookshelfPage({
  folderName,
  searchQuery,
}: BookshelfPageProps) {
  const { folderId } = useParams<{
    folderId: string;
  }>();

  if (!folderId) {
    return <div>Invalid folder ID</div>;
  }

  return (
    <div className="mx-auto">
      <RoutingPath folderName={folderName} />
      <Bookshelf folderId={folderId} searchQuery={searchQuery} />
    </div>
  );
}
