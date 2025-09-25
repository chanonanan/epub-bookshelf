import FolderPicker from '@/components/FolderPicker';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useGoogleAuth, useRecentFolders } from '@/hooks';
import { AlertCircle, Loader2Icon } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const { checkTokens, error, isAuthenticated } = useGoogleAuth();
  const onAuthenticatedChange = async () => {
    await checkTokens();
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-playfair font-bold text-foreground mb-2">
            EPUB Bookshelf
          </h1>
          <p className="text-muted-foreground">
            Your digital library from Google Drive
          </p>
        </div>
        {isAuthenticated ? (
          <GoogleDriveCard onSignOut={onAuthenticatedChange} />
        ) : (
          <GoogleDriveAuth onSignIn={onAuthenticatedChange} />
        )}
      </div>
    </div>
  );
}

function GoogleDriveAuth({ onSignIn }: { onSignIn: () => void }) {
  const { isLoading, error, signIn, isAuthenticated } = useGoogleAuth();

  useEffect(() => {
    if (isAuthenticated) {
      onSignIn();
    }
  }, [isAuthenticated]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>Connect Google Drive</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Connect your Google Drive to access and organize your EPUB book
          collection.
        </p>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>This app will request permission to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>View your Google Drive files</li>
            <li>Access EPUB files for reading metadata</li>
            <li>Cache book metadata locally</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Button onClick={signIn} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2Icon className="animate-spin" />
              Connecting...
            </>
          ) : (
            <>Connect Google Drive</>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

function GoogleDriveCard({ onSignOut }: { onSignOut: () => void }) {
  const { signOut } = useGoogleAuth();
  const { addRecentFolder } = useRecentFolders();
  const navigate = useNavigate();

  const handleFolderSelect = async (folderId: string, name: string) => {
    await addRecentFolder(folderId, name);
    import('./BookshelfPage');
    navigate(`/bookshelf/${folderId}`);
  };

  const handleSignOut = async () => {
    await signOut();
    onSignOut();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>Google Drive Connected</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Your Google Drive is connected and ready to access your EPUB files.
        </p>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <FolderPicker className="w-full" variant="outline" />
        <Button
          variant="destructive"
          onClick={handleSignOut}
          className="w-full"
        >
          Disconnect
        </Button>
      </CardFooter>
    </Card>
  );
}
