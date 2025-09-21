import { type FC } from 'react';
import { Search } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { ModeToggle } from './ModeToggle';

interface NavbarProps {
  currentFolderId?: string;
  currentFolderName?: string;
  onFolderSelect: (folderId: string) => void;
  onSearchChange: (query: string) => void;
  onAddFolder: () => void;
  lastUpdate?: string;
  recentFolders: Array<{ id: string; name: string; lastUpdate: string }>;
}

export const Navbar: FC<NavbarProps> = ({
  currentFolderName,
  onFolderSelect,
  onSearchChange,
  onAddFolder,
  lastUpdate,
  recentFolders,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur">
      <div className="container-wrapper flex h-14 items-center justify-between">
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                {currentFolderName || 'Select Folder'}{' '}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[240px]">
              {recentFolders.map((folder) => (
                <DropdownMenuItem
                  key={folder.id}
                  onClick={() => onFolderSelect(folder.id)}
                  className="justify-between"
                >
                  <span className="truncate">{folder.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {new Date(folder.lastUpdate).toLocaleDateString()}
                  </span>
                </DropdownMenuItem>
              ))}
              {recentFolders.length > 0 && <DropdownMenuSeparator />}
              <DropdownMenuItem onClick={onAddFolder}>
                Select Another Folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {lastUpdate && (
            <span className="text-sm text-muted-foreground">
              Last update: {new Date(lastUpdate).toLocaleString()}
            </span>
          )}
        </div>
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search books..."
            className="w-[200px] pl-9 h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2">
          <ModeToggle />
        </div>
      </div>
    </header>
  );
};
