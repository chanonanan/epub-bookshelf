import { ChevronDown, FolderOpen, Search } from 'lucide-react';
import { type FC } from 'react';
import { ModeToggle } from './ModeToggle';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

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
        <SelectFolderDropDown
          currentFolderName={currentFolderName}
          onFolderSelect={onFolderSelect}
          onAddFolder={onAddFolder}
          lastUpdate={lastUpdate}
          recentFolders={recentFolders}
        />
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

function SelectFolderDropDown({
  currentFolderName,
  onFolderSelect,
  onAddFolder,
  lastUpdate,
  recentFolders,
}: Omit<NavbarProps, 'onSearchChange'>) {
  return (
    <div className="flex items-center gap-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="gap-2"
            aria-label={
              currentFolderName
                ? `Switch folder, current folder: ${currentFolderName}`
                : 'Choose a folder'
            }
          >
            <FolderOpen className="h-4 w-4 shrink-0" />
            <span className="max-w-[160px] truncate sm:max-w-[220px]">
              {currentFolderName || 'Choose folder'}
            </span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-[240px]">
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            Switch bookshelf folder
          </div>
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
            Choose another folder...
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {lastUpdate && (
        <span className="text-sm text-muted-foreground hidden sm:inline">
          Last update: {new Date(lastUpdate).toLocaleString()}
        </span>
      )}
    </div>
  );
}
