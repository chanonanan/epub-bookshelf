import FolderPicker from '@/components/FolderPicker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGoogleAuth, useRecentFolders } from '@/hooks';
import { setTokens } from '@/lib/googleDrive';
import { useGoogleLogin } from '@react-oauth/google';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const { isLoading, error, isAuthenticated, checkTokens } = useGoogleAuth();
  const { addRecentFolder } = useRecentFolders();
  const navigate = useNavigate();

  const handleFolderSelect = async (folderId: string, name: string) => {
    await addRecentFolder(folderId, name);
    import('./BookshelfPage');
    navigate(`/bookshelf/${folderId}`);
  };

  const onSuccessLogin = async (tokenResponse: TokenResponse) => {
    console.log('Login Success:', tokenResponse);
    await setTokens(tokenResponse);
    await checkTokens();
  };

  const googleLogin = useGoogleLogin({
    onSuccess: onSuccessLogin,
    onError: () => {
      console.log('One Tap Login Failed');
    },
    scope: 'https://www.googleapis.com/auth/drive.readonly',
  });

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 min-h-screen">
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-destructive">
              You need to sign in with your Google account to continue.
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect your Google Drive to access and organize your EPUB book
              collection.
            </p>

            <Button
              variant="outline"
              onClick={() => googleLogin()}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>Sign in with Google</>
              )}
            </Button>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>This app will request permission to:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>View your Google Drive files</li>
                <li>Cache book metadata locally</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
