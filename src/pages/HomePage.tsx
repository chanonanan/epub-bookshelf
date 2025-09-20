import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import FolderPicker from '../components/FolderPicker';
import { initializeGoogleAuth } from '../googleDrive';
import { Button } from '../components/ui/button';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useState(() => {
    const init = async () => {
      try {
        await initializeGoogleAuth();
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to initialize Google auth:', err);
        setError('Failed to initialize Google authentication');
        setIsLoading(false);
      }
    };

    init();
  });

  const handleFolderSelect = (folderId: string) => {
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
        <p className="text-muted-foreground mb-4">Please select a folder containing your EPUB files</p>
        <FolderPicker 
          onFolderSelect={handleFolderSelect}
          apiKey={import.meta.env.VITE_GOOGLE_API_KEY}
        />
      </div>
    </div>
  );
}