import { useParams } from 'react-router-dom';
import { Bookshelf } from '../components/Bookshelf';

interface BookshelfPageProps {
  searchQuery?: string;
}

export default function BookshelfPage({ searchQuery }: BookshelfPageProps) {
  const { folderId } = useParams<{ folderId: string }>();

  if (!folderId) {
    return <div>Invalid folder ID</div>;
  }

  return (
    <div className="bg-background">
      <Bookshelf folderId={folderId} searchQuery={searchQuery} />
    </div>
  );
}
