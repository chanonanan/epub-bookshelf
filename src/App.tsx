import { useEffect, useState } from 'react';
import { Bookshelf } from './components/Bookshelf';
import { initializeGoogleAuth } from './googleDrive';
import { Button } from './components/ui/button';
import './App.css';

function App() {
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

  return (
    <div className="min-h-screen bg-background">
      <Bookshelf />
    </div>
  );
}

export default App;
