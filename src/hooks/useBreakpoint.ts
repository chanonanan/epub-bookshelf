import { useEffect, useState } from 'react';

const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export function useBreakpoint(breakpoint: keyof typeof breakpoints): boolean {
  const [isBelow, setIsBelow] = useState(false);

  useEffect(() => {
    const query = `(max-width: ${breakpoints[breakpoint] - 1}px)`;
    const media = window.matchMedia(query);
    setIsBelow(media.matches);

    const listener = (e: MediaQueryListEvent) => setIsBelow(e.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [breakpoint]);

  return isBelow;
}
