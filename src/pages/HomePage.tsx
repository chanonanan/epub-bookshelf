import FolderPicker from '@/components/FolderPicker';
import { Button } from '@/components/ui/button';
import { FolderOpen } from 'lucide-react';
import { useEffect, useState } from 'react';
import { initializeGoogleAuth } from '../googleDrive';

interface HomePageProps {
  onFolderSelect: (folderId: string, folderName: string) => Promise<void>;
  recentFolders: Array<{ id: string; name: string; lastUpdate: string }>;
  onRecentFolderSelect: (folderId: string) => void;
}

export default function HomePage({
  onFolderSelect,
  recentFolders,
  onRecentFolderSelect,
}: HomePageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  });

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
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] gap-4 py-12">
        <h2 className="text-2xl font-bold">Welcome to EPUB Bookshelf</h2>
        <p className="text-muted-foreground mb-4">
          Please select a folder containing your EPUB files
        </p>
        <FolderPicker
          onFolderSelect={onFolderSelect}
          apiKey={import.meta.env.VITE_GOOGLE_API_KEY}
        />
        {recentFolders.length > 0 && (
          <section className="mt-8 w-full max-w-md">
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">
              Recent folders
            </h3>
            <div className="flex flex-col gap-2">
              {recentFolders.map((folder) => (
                <Button
                  key={folder.id}
                  variant="outline"
                  className="justify-start gap-3"
                  onClick={() => onRecentFolderSelect(folder.id)}
                >
                  <FolderOpen className="h-4 w-4 shrink-0" />
                  <span className="truncate">{folder.name}</span>
                </Button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
