import FolderPicker from '@/components/FolderPicker';
import { Button } from '@/components/ui/button';
import { useGoogleAuth, useRecentFolders } from '@/hooks';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const { isLoading, error } = useGoogleAuth();
  const { addRecentFolder } = useRecentFolders();
  const navigate = useNavigate();

  const handleFolderSelect = async (folderId: string, name: string) => {
    await addRecentFolder(folderId, name);
    import('./BookshelfPage');
    navigate(`/bookshelf/${folderId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 min-h-screen">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h2 className="text-2xl font-bold">Welcome to EPUB Bookshelf</h2>
        <p className="text-muted-foreground mb-4">
          Please select a folder containing your EPUB files
        </p>
        <FolderPicker
          onFolderSelect={handleFolderSelect}
          apiKey={import.meta.env.VITE_GOOGLE_API_KEY}
        />
      </div>
    </div>
  );
}
