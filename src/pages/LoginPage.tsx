import { useAuth } from '@/auth/AuthProvider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { checkFolderAccess } from '@/lib/googleDrive';
import { AlertCircle, Loader2Icon } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const { login, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The place the user came from (if any)
  const from = (location.state as { from?: Location })?.from?.pathname || '/';

  useEffect(() => {
    const verifyAndRedirect = async () => {
      console.log('Verifying existing token...');
      if (!token) return;

      // If it's expired, ignore
      if (token.expires_at < Date.now()) {
        console.log('Token is expired');
        return;
      }

      // If coming from a bookshelf folder, check access
      const match = from.match(/\/epub-bookshelf\/bookshelf\/([^/]+)/);
      if (match) {
        const folderId = match[1];
        const hasAccess = await checkFolderAccess(folderId);
        if (!hasAccess) {
          alert('You don’t have access to this folder.');
          navigate('/', { replace: true });
          return;
        }
      }

      // Otherwise redirect back
      navigate(from, { replace: true });
    };

    verifyAndRedirect();
  }, [token, from, navigate]);

  // Handle login button click
  const handleLogin = async () => {
    try {
      setIsLoading(true);
      const token = await login();
      if (!token) {
        setError('Login failed. No token received.');
        setIsLoading(false);
        return;
      }

      // If the “from” is a bookshelf URL, extract folderId and test access
      const m = from.match(/\/epub-bookshelf\/bookshelf\/([^/]+)/);
      if (m && m[1]) {
        const folderId = m[1];
        const has = await checkFolderAccess(folderId);
        if (!has) {
          alert('You don’t have access to that folder');
          navigate('/', { replace: true });
          return;
        }
      }

      // Redirect back to the original page
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login failed', err);
      setError('Login failed. Please try again.');
      setIsLoading(false);
      // Show error UI
    }
  };

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

        <Button onClick={handleLogin} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2Icon className="animate-spin" />
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
            <li>Access EPUB files for reading metadata</li>
            <li>Cache book metadata locally</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoginPage;
