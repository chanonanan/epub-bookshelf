import { House, LibraryBig, Search, Settings, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

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
  const navigationRef = useRef<HTMLElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTriggerRef = useRef<HTMLButtonElement>(null);
  const searchReturnLocationRef = useRef(location);
  const hasOpenedSearchRef = useRef(false);
  const isSearchInputFocusedRef = useRef(false);
  const isHomeActive = pathname === '/';
  const isShelfActive =
    pathname === '/bookshelf' ||
    pathname.startsWith('/series/') ||
    pathname.startsWith('/book/');
  const isSettingsActive = pathname === '/settings';
  const activeIndex = isSettingsActive ? 2 : isShelfActive ? 1 : 0;

  useEffect(() => {
    if (isSearchOpen) {
      hasOpenedSearchRef.current = true;
      searchInputRef.current?.focus({ preventScroll: true });
    } else if (hasOpenedSearchRef.current) {
      searchTriggerRef.current?.focus({ preventScroll: true });
    }
  }, [isSearchOpen]);

  useEffect(() => {
    if (!isSearchOpen) return;

    const navigation = navigationRef.current;
    if (!navigation) return;

    const visualViewport = window.visualViewport;
    let animationFrame = 0;
    const updateVisibleBottom = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        const layoutHeight =
          document.documentElement.clientHeight || window.innerHeight;
        if (!isSearchInputFocusedRef.current) return;

        const visibleBottom = visualViewport
          ? visualViewport.offsetTop + visualViewport.height
          : layoutHeight;
        const viewportOcclusion = Math.max(0, layoutHeight - visibleBottom);
        navigation.classList.toggle(
          'is-keyboard-visible',
          viewportOcclusion > 100,
        );

        navigation.style.setProperty(
          '--mobile-dock-viewport-offset',
          `${viewportOcclusion}px`,
        );
      });
    };

    updateVisibleBottom();
    visualViewport?.addEventListener('resize', updateVisibleBottom);
    visualViewport?.addEventListener('scroll', updateVisibleBottom);
    window.addEventListener('resize', updateVisibleBottom);
    window.addEventListener('orientationchange', updateVisibleBottom);

    return () => {
      cancelAnimationFrame(animationFrame);
      visualViewport?.removeEventListener('resize', updateVisibleBottom);
      visualViewport?.removeEventListener('scroll', updateVisibleBottom);
      window.removeEventListener('resize', updateVisibleBottom);
      window.removeEventListener('orientationchange', updateVisibleBottom);
      navigation.classList.remove('is-keyboard-visible');
      navigation.style.removeProperty('--mobile-dock-viewport-offset');
    };
  }, [isSearchOpen]);

  useEffect(() => {
    if (!isSearchOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        searchInputRef.current?.blur();
        setIsSearchOpen(false);
        onSearchChange('');
        navigate(searchReturnLocationRef.current);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, navigate, onSearchChange]);

  const closeSearch = () => {
    searchInputRef.current?.blur();
    setIsSearchOpen(false);
    onSearchChange('');
  };

  const openSearch = () => {
    searchReturnLocationRef.current = location;
    setIsSearchOpen(true);
    if (pathname !== '/bookshelf') {
      navigate('/bookshelf');
    }
  };

  const returnFromSearch = () => {
    closeSearch();
    navigate(searchReturnLocationRef.current);
  };

  const handleSearchInputBlur = () => {
    isSearchInputFocusedRef.current = false;
    const navigation = navigationRef.current;
    if (!navigation) return;

    navigation.classList.add('is-keyboard-visible');
    navigation.style.setProperty('--mobile-dock-viewport-offset', '0px');
  };

  return (
    <nav
      ref={navigationRef}
      aria-label="Mobile navigation"
      className={`mobile-dock ${isSearchOpen ? 'is-search-open' : ''}`}
    >
      <div
        aria-hidden={isSearchOpen}
        inert={isSearchOpen}
        className="mobile-nav-capsule"
      >
        <span
          aria-hidden="true"
          className="mobile-nav-lens"
          style={{ transform: `translateX(${activeIndex * 100}%)` }}
        />
        <NavLink
          to="/"
          end
          aria-label="Home"
          aria-current={isHomeActive ? 'page' : undefined}
          onClick={closeSearch}
          className={({ isActive }) =>
            `mobile-nav-link ${isActive ? 'is-active' : ''}`
          }
        >
          <House aria-hidden="true" />
        </NavLink>
        <NavLink
          to="/bookshelf"
          aria-label="Bookshelf"
          aria-current={isShelfActive ? 'page' : undefined}
          onClick={closeSearch}
          className={`mobile-nav-link ${isShelfActive ? 'is-active' : ''}`}
        >
          <LibraryBig aria-hidden="true" />
        </NavLink>
        <NavLink
          to="/settings"
          aria-label="Settings"
          aria-current={isSettingsActive ? 'page' : undefined}
          onClick={closeSearch}
          className={`mobile-nav-link ${isSettingsActive ? 'is-active' : ''}`}
        >
          <Settings aria-hidden="true" />
        </NavLink>
      </div>

      <button
        ref={searchTriggerRef}
        type="button"
        aria-label="Search books"
        tabIndex={isSearchOpen ? -1 : 0}
        aria-hidden={isSearchOpen}
        onClick={openSearch}
        className="mobile-search-trigger"
      >
        <Search aria-hidden="true" />
      </button>

      <form
        role="search"
        aria-hidden={!isSearchOpen}
        inert={!isSearchOpen}
        onSubmit={(event) => event.preventDefault()}
        className="mobile-search-form"
      >
        <input
          ref={searchInputRef}
          type="search"
          aria-label="Search books"
          placeholder="Search books..."
          value={searchQuery}
          onFocus={() => {
            isSearchInputFocusedRef.current = true;
          }}
          onBlur={handleSearchInputBlur}
          onChange={(event) => onSearchChange(event.target.value)}
          className="mobile-search-input"
        />
        <button
          type="button"
          aria-label="Close search"
          onClick={returnFromSearch}
          className="mobile-search-close"
        >
          <X aria-hidden="true" />
        </button>
      </form>
    </nav>
  );
}
