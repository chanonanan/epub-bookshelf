import { useParams } from 'react-router-dom';
import { Bookshelf } from '../components/Bookshelf';
import FolderPicker from '../components/FolderPicker';

export default function SeriesPage() {
  const { folderId, series } = useParams<{ folderId: string; series: string }>();

  if (!folderId) {
    return <div>Invalid folder ID</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">{decodeURIComponent(series || '')}</h1>
          <FolderPicker 
            onFolderSelect={(newFolderId) => window.location.href = `/bookshelf/${newFolderId}`}
            apiKey={import.meta.env.VITE_GOOGLE_API_KEY}
          />
        </div>
        <Bookshelf folderId={folderId} initialSeries={decodeURIComponent(series || '')} />
      </div>
    </div>
  );
}