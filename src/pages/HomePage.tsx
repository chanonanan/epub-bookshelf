import { useAuth } from '@/auth/AuthProvider';
import FolderPicker from '@/components/FolderPicker';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function HomePage() {
  const { logout } = useAuth();

  const handleSignOut = async () => {
    await logout();
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
          Sign Out
        </Button>
      </CardFooter>
    </Card>
  );
}
