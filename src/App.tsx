import { useEffect, useState, useCallback } from 'react';
import { Bookshelf } from './components/Bookshelf';
import { initializeGoogleAuth } from './googleDrive';
import { Button } from './components/ui/button';
import FolderPicker from './components/FolderPicker';
import './App.css';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  
  const handleFolderSelect = useCallback((folderId: string, folderName: string) => {
    setSelectedFolderId(folderId);
  }, []);

  useEffect(() => {
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
  }, []);

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

  if (!selectedFolderId) {
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-end mb-4">
          <FolderPicker 
            onFolderSelect={handleFolderSelect}
            apiKey={import.meta.env.VITE_GOOGLE_API_KEY}
          />
        </div>
      </div>
      <Bookshelf folderId={selectedFolderId} />
    </div>
  );
}

export default App;
