import { useParams } from 'react-router-dom';
import { Bookshelf } from '../components/Bookshelf';
import FolderPicker from '../components/FolderPicker';

export default function BookshelfPage() {
  const { folderId } = useParams<{ folderId: string }>();

  if (!folderId) {
    return <div>Invalid folder ID</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-end mb-4">
          <FolderPicker 
            onFolderSelect={(newFolderId) => window.location.href = `/bookshelf/${newFolderId}`}
            apiKey={import.meta.env.VITE_GOOGLE_API_KEY}
          />
        </div>
        <Bookshelf folderId={folderId} />
      </div>
    </div>
  );
}