import { House, Search, Settings } from 'lucide-react';
import { type FC } from 'react';
import { NavLink } from 'react-router-dom';
import { ModeToggle } from './ModeToggle';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const Navbar: FC<NavbarProps> = ({ searchQuery, onSearchChange }) => {
  return (
    <header className="desktop-navbar sticky top-0 z-40 hidden w-full border-b border-border bg-background/95 backdrop-blur md:block">
      <div className="container-wrapper flex h-14 items-center justify-between gap-3">
        <NavLink
          to="/"
          end
          aria-label="Home"
          title="Home"
          className="hidden h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:inline-flex"
        >
          <House aria-hidden="true" className="h-5 w-5" />
        </NavLink>
        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              aria-label="Search books"
              placeholder="Search books..."
              className="h-9 w-[200px] rounded-md border border-input bg-transparent py-1 pl-9 pr-3 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings aria-hidden="true" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Settings</DialogTitle>
                <DialogDescription>
                  Choose how EPUB Bookshelf looks on this device.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium">Appearance</span>
                <ModeToggle />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
};
