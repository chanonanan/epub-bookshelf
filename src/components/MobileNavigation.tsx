import { House, LibraryBig, Search, Settings } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

const navigationItemClass =
  'flex min-h-11 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset';

interface MobileNavigationProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function MobileNavigation({
  searchQuery,
  onSearchChange,
}: MobileNavigationProps) {
  const location = useLocation();
  const { pathname } = location;
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchReturnLocationRef = useRef(location);
  const isHomeActive = pathname === '/';
  const isShelfActive =
    pathname === '/bookshelf' ||
    pathname.startsWith('/series/') ||
    pathname.startsWith('/book/');
  const isSettingsActive = pathname === '/settings';
  const activeIndex = isSettingsActive ? 2 : isShelfActive ? 1 : 0;

  useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus();
    }
  }, [isSearchOpen]);

  const closeSearch = () => {
    searchInputRef.current?.blur();
    setIsSearchOpen(false);
    onSearchChange('');
  };

  const openSearch = () => {
    searchReturnLocationRef.current = location;
    setIsSearchOpen(true);
    navigate('/bookshelf');
  };

  const returnFromSearch = () => {
    closeSearch();
    navigate(searchReturnLocationRef.current);
  };

  return (
    <nav
      aria-label="Mobile navigation"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-50 px-4 md:hidden"
    >
      <div
        className={`pointer-events-auto mx-auto grid h-[3.25rem] max-w-[26rem] gap-2 transition-[width,grid-template-columns] duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          isSearchOpen
            ? 'w-full grid-cols-[3.25rem_minmax(0,1fr)]'
            : 'w-[calc(min(68vw,26rem)+3.75rem)] grid-cols-[minmax(0,1fr)_3.25rem]'
        }`}
      >
        <div className="relative min-w-0">
          <div
            aria-hidden={isSearchOpen}
            inert={isSearchOpen}
            className={`absolute inset-0 transition-[opacity,transform] duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
              isSearchOpen
                ? 'pointer-events-none scale-95 opacity-0'
                : 'scale-100 opacity-100'
            }`}
          >
            <div className="relative isolate grid h-full grid-cols-3 items-center rounded-full border border-white/85 bg-gradient-to-r from-amber-50/75 via-white/70 to-orange-50/65 p-1 shadow-[0_6px_24px_rgba(120,74,25,0.14),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-2xl backdrop-saturate-150 dark:border-amber-100/15 dark:from-stone-900/75 dark:via-zinc-900/70 dark:to-amber-950/65 dark:shadow-[0_6px_24px_rgba(0,0,0,0.26),inset_0_1px_0_rgba(255,255,255,0.1)]">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-full border border-white/90 bg-gradient-to-b from-amber-100/90 to-orange-50/85 shadow-[0_2px_8px_rgba(120,74,25,0.1),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl transition-transform duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none dark:border-amber-100/15 dark:from-amber-100/15 dark:to-orange-100/10 dark:shadow-[0_2px_10px_rgba(0,0,0,0.18)]"
                style={{ transform: `translateX(${activeIndex * 100}%)` }}
              />
              <NavLink
                to="/"
                end
                aria-label="Home"
                aria-current={isHomeActive ? 'page' : undefined}
                onClick={closeSearch}
                className={({ isActive }) =>
                  `relative z-10 ${navigationItemClass} ${
                    isActive
                      ? 'text-amber-950 dark:text-amber-50'
                      : 'text-stone-600 hover:text-amber-950 dark:text-stone-300 dark:hover:text-amber-50'
                  }`
                }
              >
                <House
                  aria-hidden="true"
                  className={`h-5 w-5 transition-transform duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                    isHomeActive ? '-translate-y-0.5 scale-110' : ''
                  }`}
                />
              </NavLink>
              <NavLink
                to="/bookshelf"
                aria-label="Shelf"
                aria-current={isShelfActive ? 'page' : undefined}
                onClick={closeSearch}
                className={`relative z-10 ${navigationItemClass} ${
                  isShelfActive
                    ? 'text-amber-950 dark:text-amber-50'
                    : 'text-stone-600 hover:text-amber-950 dark:text-stone-300 dark:hover:text-amber-50'
                }`}
              >
                <LibraryBig
                  aria-hidden="true"
                  className={`h-5 w-5 transition-transform duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                    isShelfActive ? '-translate-y-0.5 scale-110' : ''
                  }`}
                />
              </NavLink>
              <NavLink
                to="/settings"
                aria-label="Settings"
                aria-current={isSettingsActive ? 'page' : undefined}
                onClick={closeSearch}
                className={`relative z-10 ${navigationItemClass} ${
                  isSettingsActive
                    ? 'text-amber-950 dark:text-amber-50'
                    : 'text-stone-600 hover:text-amber-950 dark:text-stone-300 dark:hover:text-amber-50'
                }`}
              >
                <Settings
                  aria-hidden="true"
                  className={`h-5 w-5 transition-transform duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                    isSettingsActive ? '-translate-y-0.5 scale-110' : ''
                  }`}
                />
              </NavLink>
            </div>
          </div>
          <button
            type="button"
            aria-label="Return to previous page"
            aria-hidden={!isSearchOpen}
            tabIndex={isSearchOpen ? 0 : -1}
            onClick={returnFromSearch}
            className={`absolute inset-0 flex h-full w-full items-center justify-center rounded-full border border-white/85 bg-gradient-to-b from-amber-50/85 to-orange-50/75 text-amber-950 shadow-[0_6px_24px_rgba(120,74,25,0.14),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-2xl backdrop-saturate-150 transition-[opacity,transform] duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 motion-reduce:transition-none dark:border-amber-100/15 dark:from-stone-900/85 dark:to-amber-950/75 dark:text-amber-50 dark:shadow-[0_6px_24px_rgba(0,0,0,0.26),inset_0_1px_0_rgba(255,255,255,0.1)] ${
              isSearchOpen
                ? 'scale-100 opacity-100'
                : 'pointer-events-none scale-90 opacity-0'
            }`}
          >
            <House aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
        <div className="relative min-w-0">
          <button
            type="button"
            aria-label="Search books"
            tabIndex={isSearchOpen ? -1 : 0}
            aria-hidden={isSearchOpen}
            onClick={openSearch}
            className={`absolute inset-0 flex h-full w-full items-center justify-center rounded-full border border-white/85 bg-gradient-to-b from-amber-50/85 to-orange-50/75 text-amber-950 shadow-[0_6px_24px_rgba(120,74,25,0.14),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-2xl backdrop-saturate-150 transition-[opacity,transform] duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 motion-reduce:transition-none dark:border-amber-100/15 dark:from-stone-900/85 dark:to-amber-950/75 dark:text-amber-50 dark:shadow-[0_6px_24px_rgba(0,0,0,0.26),inset_0_1px_0_rgba(255,255,255,0.1)] ${
              isSearchOpen
                ? 'pointer-events-none scale-90 opacity-0'
                : 'scale-100 opacity-100'
            }`}
          >
            <Search aria-hidden="true" className="h-5 w-5" />
          </button>
          <form
            role="search"
            aria-hidden={!isSearchOpen}
            inert={!isSearchOpen}
            onSubmit={(event) => event.preventDefault()}
            className={`absolute inset-0 flex h-full items-center rounded-full border border-white/85 bg-gradient-to-r from-amber-50/85 via-white/80 to-orange-50/75 shadow-[0_6px_24px_rgba(120,74,25,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl backdrop-saturate-150 transition-[opacity,transform] duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none dark:border-amber-100/15 dark:from-stone-900/85 dark:via-zinc-900/80 dark:to-amber-950/75 dark:shadow-[0_6px_24px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.1)] ${
              isSearchOpen
                ? 'scale-100 opacity-100'
                : 'pointer-events-none scale-95 opacity-0'
            }`}
          >
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-4 h-5 w-5 text-amber-950 dark:text-amber-50"
            />
            <input
              ref={searchInputRef}
              type="search"
              aria-label="Search books"
              placeholder="Search..."
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              className="h-full w-full rounded-full bg-transparent pl-12 pr-4 text-base text-stone-900 outline-none placeholder:text-stone-600 dark:text-stone-100 dark:placeholder:text-stone-400"
            />
          </form>
        </div>
      </div>
    </nav>
  );
}
