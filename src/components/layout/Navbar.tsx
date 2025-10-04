import { useProvider } from '@/app/providers';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { Link } from 'react-router-dom';
import { UserMenu } from './UserMenu';

export function Navbar() {
  const { provider } = useProvider();

  return (
    <header className="flex items-center justify-between px-4 py-2 border-b bg-white/75 dark:bg-gray-900/75 sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Link
        to={provider ? `/${provider}` : '/login'}
        className="flex items-center gap-2"
      >
        <img src="logo.png" alt="EPUB Bookshelf Logo" className="h-8 w-auto" />
        <h1 className="text-lg font-bold hidden sm:inline">EPUB Bookshelf</h1>
      </Link>

      <section className="flex items-center gap-4">
        <ProgressIndicator />
        <UserMenu />
      </section>
    </header>
  );
}
