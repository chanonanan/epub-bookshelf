import { useProvider } from '@/app/providers';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import {
  ArrowRightLeft,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../ThemeProvider';

export function UserMenu() {
  const { provider, token, logout } = useProvider();
  const { setTheme, theme } = useTheme();
  const isMobile = useBreakpoint('sm');
  const [open, setOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  if (!provider || !token) {
    return (
      <Link to="/login">
        <Button className="btn-primary cursor-pointer">
          <LogIn />
          Login
        </Button>
      </Link>
    );
  }

  if (!isMobile) {
    // Desktop → Dropdown
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {provider === 'gdrive' ? (
              <img
                width="25"
                height="25"
                src="https://img.icons8.com/color/48/google-drive--v1.png"
                alt="google-drive--v1"
              />
            ) : (
              <img
                width="25"
                height="25"
                src="https://img.icons8.com/color/48/skydrive.png"
                alt="skydrive"
              />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {/* Provider */}
          <DropdownMenuItem
            onClick={() => {
              // TODO: implement switch provider
              console.log('Switch provider clicked');
            }}
          >
            <ArrowRightLeft />
            Switch to {provider === 'gdrive' ? 'OneDrive' : 'Google Drive'}
          </DropdownMenuItem>

          {/* Theme */}
          <DropdownMenuItem onClick={toggleTheme}>
            {theme === 'light' ? <Moon /> : <Sun />}
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </DropdownMenuItem>

          {/* Settings */}
          <DropdownMenuItem
            onClick={() => {
              console.log('Settings clicked');
            }}
          >
            <Settings />
            Settings
          </DropdownMenuItem>

          {/* Logout */}
          <DropdownMenuItem
            onClick={() => {
              logout();
            }}
          >
            <LogOut />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Mobile → Drawer
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="ghost">
          <Menu className="h-5 w-5" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>User Menu</DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col gap-2 p-4">
          {/* Provider */}
          <Button
            variant="ghost"
            onClick={() => {
              console.log('Switch provider clicked');
              setOpen(false);
            }}
          >
            <ArrowRightLeft />
            Switch to {provider === 'gdrive' ? 'OneDrive' : 'Google Drive'}
          </Button>

          {/* Theme */}
          <Button
            variant="ghost"
            onClick={() => {
              toggleTheme();
              setOpen(false);
            }}
          >
            {theme === 'light' ? <Moon /> : <Sun />}
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </Button>

          {/* Settings */}
          <Button
            variant="ghost"
            onClick={() => {
              console.log('Settings clicked');
              setOpen(false);
            }}
          >
            <Settings />
            Settings
          </Button>

          {/* Logout */}
          <Button
            variant="destructive"
            onClick={() => {
              logout();
              setOpen(false);
            }}
          >
            <LogOut />
            Logout
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
