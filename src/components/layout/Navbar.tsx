import { useProvider } from '@/app/providers';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { Link } from 'react-router-dom';
import { UserMenu } from './UserMenu';

export function Navbar() {
  const { provider } = useProvider();

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b bg-white dark:bg-gray-900">
      <Link
        to={provider ? `/${provider}` : '/login'}
        className="text-lg font-bold"
      >
        📚 EPUB Bookshelf
      </Link>

      <div className="flex items-center gap-4">
        <ProgressIndicator />
        <UserMenu />
      </div>
    </div>
  );
}
