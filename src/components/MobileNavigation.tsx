import { House, LibraryBig, Search, Settings, X } from 'lucide-react';
import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslate } from '@/lib/useTranslate';

type MobileNavigationStyle = CSSProperties & {
  '--mobile-dock-viewport-offset': string;
};

interface MobileNavigationProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function MobileNavigation({
  searchQuery,
  onSearchChange,
}: MobileNavigationProps) {
  const { t } = useTranslate();
  const location = useLocation();
  const { pathname } = location;
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [viewportOffset, setViewportOffset] = useState(0);
  const navigationRef = useRef<HTMLElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTriggerRef = useRef<HTMLButtonElement>(null);
  const searchReturnLocationRef = useRef(location);
  const hasOpenedSearchRef = useRef(false);
  const isSearchInputFocusedRef = useRef(false);
  const searchFocusScrollYRef = useRef(0);
  const searchFocusViewportHeightRef = useRef(0);
  const keyboardScrollRestoredRef = useRef(false);
  const keyboardScrollRestoreTimerRef = useRef<number | null>(null);
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
    const navigation = navigationRef.current;
    if (!navigation) return;

    const visualViewport = window.visualViewport;
    const updateVisibleBottom = () => {
      if (!isSearchInputFocusedRef.current) {
        navigation.classList.remove('is-keyboard-visible');
        setViewportOffset(0);
        if (keyboardScrollRestoreTimerRef.current !== null) {
          window.clearTimeout(keyboardScrollRestoreTimerRef.current);
          keyboardScrollRestoreTimerRef.current = null;
        }
        return;
      }

      const visibleBottom = visualViewport
        ? visualViewport.offsetTop + visualViewport.height
        : window.innerHeight;
      const currentBottom =
        Number.parseFloat(getComputedStyle(navigation).bottom) || 0;
      const fixedViewportBottom =
        navigation.getBoundingClientRect().bottom + currentBottom;
      const viewportOcclusion = Math.max(
        0,
        fixedViewportBottom - visibleBottom,
      );
      const currentViewportHeight = visualViewport?.height ?? window.innerHeight;
      const isKeyboardVisible =
        viewportOcclusion > 100 ||
        searchFocusViewportHeightRef.current - currentViewportHeight > 100;
      navigation.classList.toggle('is-keyboard-visible', isKeyboardVisible);

      setViewportOffset(viewportOcclusion);

      if (!isKeyboardVisible) {
        keyboardScrollRestoredRef.current = false;
        if (keyboardScrollRestoreTimerRef.current !== null) {
          window.clearTimeout(keyboardScrollRestoreTimerRef.current);
          keyboardScrollRestoreTimerRef.current = null;
        }
        return;
      }
      if (keyboardScrollRestoredRef.current) return;

      if (keyboardScrollRestoreTimerRef.current !== null) {
        window.clearTimeout(keyboardScrollRestoreTimerRef.current);
      }
      keyboardScrollRestoreTimerRef.current = window.setTimeout(() => {
        keyboardScrollRestoreTimerRef.current = null;
        if (
          !isSearchInputFocusedRef.current ||
          keyboardScrollRestoredRef.current
        ) {
          return;
        }

        if (Math.abs(window.scrollY - searchFocusScrollYRef.current) > 1) {
          window.scrollTo({
            top: searchFocusScrollYRef.current,
            behavior: 'auto',
          });
        }
        keyboardScrollRestoredRef.current = true;
      }, 120);
    };

    const initialMeasurement = window.setTimeout(updateVisibleBottom, 100);
    updateVisibleBottom();
    visualViewport?.addEventListener('resize', updateVisibleBottom);
    visualViewport?.addEventListener('scroll', updateVisibleBottom);
    window.addEventListener('resize', updateVisibleBottom);
    window.addEventListener('scroll', updateVisibleBottom);
    window.addEventListener('orientationchange', updateVisibleBottom);

    return () => {
      visualViewport?.removeEventListener('resize', updateVisibleBottom);
      visualViewport?.removeEventListener('scroll', updateVisibleBottom);
      window.removeEventListener('resize', updateVisibleBottom);
      window.removeEventListener('scroll', updateVisibleBottom);
      window.removeEventListener('orientationchange', updateVisibleBottom);
      window.clearTimeout(initialMeasurement);
      if (keyboardScrollRestoreTimerRef.current !== null) {
        window.clearTimeout(keyboardScrollRestoreTimerRef.current);
      }
      navigation.classList.remove('is-keyboard-visible');
    };
  }, []);

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
    keyboardScrollRestoredRef.current = false;
    if (keyboardScrollRestoreTimerRef.current !== null) {
      window.clearTimeout(keyboardScrollRestoreTimerRef.current);
      keyboardScrollRestoreTimerRef.current = null;
    }
    const navigation = navigationRef.current;
    if (!navigation) return;

    navigation.classList.remove('is-keyboard-visible');
    setViewportOffset(0);
  };

  return (
    <nav
      ref={navigationRef}
      aria-label={t('common.mobileNavigation')}
      className={`mobile-dock ${isSearchOpen ? 'is-search-open' : ''}`}
      style={
        {
          '--mobile-dock-viewport-offset': `${viewportOffset}px`,
        } as MobileNavigationStyle
      }
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
          aria-label={t('common.home')}
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
          aria-label={t('common.bookshelf')}
          aria-current={isShelfActive ? 'page' : undefined}
          onClick={closeSearch}
          className={`mobile-nav-link ${isShelfActive ? 'is-active' : ''}`}
        >
          <LibraryBig aria-hidden="true" />
        </NavLink>
        <NavLink
          to="/settings"
          aria-label={t('common.settings')}
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
        aria-label={t('common.searchBooks')}
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
          aria-label={t('common.searchBooks')}
          placeholder={t('common.searchBooks')}
          value={searchQuery}
          onFocus={() => {
            searchFocusScrollYRef.current = window.scrollY;
            searchFocusViewportHeightRef.current =
              window.visualViewport?.height ?? window.innerHeight;
            keyboardScrollRestoredRef.current = false;
            isSearchInputFocusedRef.current = true;
          }}
          onBlur={handleSearchInputBlur}
          onChange={(event) => onSearchChange(event.target.value)}
          className="mobile-search-input"
        />
        <button
          type="button"
          aria-label={t('common.closeSearch')}
          onClick={returnFromSearch}
          className="mobile-search-close"
        >
          <X aria-hidden="true" />
        </button>
      </form>
    </nav>
  );
}
