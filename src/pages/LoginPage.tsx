import { useProvider } from '@/app/providers';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2Icon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const { login, token, provider } = useProvider();
  const naviagte = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from =
    (location.state as { from?: Location })?.from?.pathname ||
    `/${provider}` ||
    '/';

  useEffect(() => {
    if (!token) return;

    naviagte(from, { replace: true });
  }, [token, from, naviagte]);

  const onLoginClick = async (provider: 'gdrive' | 'onedrive') => {
    setLoading(true);
    setError(null);
    try {
      await login(provider);
      if (token) {
        naviagte(from, { replace: true });
        return;
      }
    } catch (err) {
      console.error('Login error:', err);
    }

    setError('Login failed. Please try again.');
    setLoading(false);
  };

  return (
    // <div className="flex flex-col items-center justify-center h-screen gap-4">
    //   <h1 className="text-2xl font-bold">📚 EPUB Bookshelf</h1>
    //   <button className="btn-primary" onClick={() => login('gdrive')}>
    //     Login with Google Drive
    //   </button>
    //   <button className="btn-secondary" onClick={() => login('onedrive')}>
    //     Login with OneDrive
    //   </button>
    // </div>
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>Login</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Connect your Cloud Storae to access and organize your EPUB book
            collection.
          </p>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={() => onLoginClick('gdrive')}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2Icon className="animate-spin" />
                Connecting...
              </>
            ) : (
              <>Login with Google Drive</>
            )}
          </Button>

          <Button
            onClick={() => onLoginClick('onedrive')}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2Icon className="animate-spin" />
                Connecting...
              </>
            ) : (
              <>Login with OneDrive</>
            )}
          </Button>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>This app will request permission to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>View your files & folders</li>
              <li>Access EPUB files for reading metadata</li>
              <li>Cache book metadata locally</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
