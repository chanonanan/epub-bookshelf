import { useRecentFolders } from '@/hooks';
import { Search } from 'lucide-react';
import { useEffect, useState, type FC } from 'react';
import { useLocation } from 'react-router-dom';
import FolderPicker from './FolderPicker';
import { ModeToggle } from './ModeToggle';

interface NavbarProps {
  onSearchChange: (query: string) => void;
}

export const Navbar: FC<NavbarProps> = ({ onSearchChange }) => {
  const location = useLocation();
  const [currentFolderId, setCurrentFolderId] = useState<string>();
  const { currentFolder } = useRecentFolders(currentFolderId);

  // Extract folderId from path
  useEffect(() => {
    // Match both /bookshelf/:folderId and /book/:folderId routes
    const match = location.pathname.match(/\/(bookshelf|book)\/([^\/]+)/);
    setCurrentFolderId(match ? match[2] : undefined);
  }, [location]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur">
      <div className="container-wrapper flex h-14 items-center justify-between md:justify-start">
        <div className="md:flex-1 flex items-center gap-4">
          <FolderPicker />
          {currentFolder?.lastUpdate && (
            <span className="hidden md:inline-block text-sm text-muted-foreground">
              Last update: {new Date(currentFolder.lastUpdate).toLocaleString()}
            </span>
          )}
        </div>
        <div className="relative hidden md:flex items-center mx-4">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search books..."
            className="w-[300px] pl-9 h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="md:hidden relative flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder=""
              className="w-[20px] pl-9 pr-2 h-9 rounded-md border border-input bg-transparent py-1 text-sm shadow-sm transition-all duration-200 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus:w-[180px]"
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <ModeToggle />
        </div>
      </div>
    </header>
  );
};
