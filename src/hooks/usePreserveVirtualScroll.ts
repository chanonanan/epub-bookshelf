import { useEffect, useRef } from 'react';

function getScrollTop(el: HTMLElement | Document): number {
  if (el === document.body || el === document.documentElement) {
    return document.documentElement.scrollTop || document.body.scrollTop;
  }
  return (el as HTMLElement).scrollTop;
}

function setScrollTop(el: HTMLElement | Document, value: number) {
  if (el === document.body || el === document.documentElement) {
    document.documentElement.scrollTop = value;
    document.body.scrollTop = value;
  } else {
    (el as HTMLElement).scrollTop = value;
  }
}

export function usePreserveVirtualScroll(
  key: string,
  ready: boolean,
  getEl: () => HTMLElement | Document | null = () => document.documentElement,
) {
  const restored = useRef(false);

  // Restore
  useEffect(() => {
    if (!ready || restored.current) return;

    const saved = sessionStorage.getItem(`vpos:${key}`);
    if (saved == null) {
      restored.current = true;
      return;
    }

    const y = parseInt(saved, 10) || 0;

    const tryRestore = () => {
      const el = getEl();
      if (!el) return;

      const scrollHeight =
        (el as HTMLElement).scrollHeight ||
        document.documentElement.scrollHeight;

      if (scrollHeight > y) {
        setScrollTop(el, y);
        restored.current = true;
      } else {
        requestAnimationFrame(tryRestore);
      }
    };

    requestAnimationFrame(tryRestore);
  }, [key, ready, getEl]);

  // Save continuously on scroll
  useEffect(() => {
    const el = getEl();
    if (!el) return;

    const onScroll = () => {
      sessionStorage.setItem(`vpos:${key}`, String(getScrollTop(el)));
    };

    el.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      el.removeEventListener('scroll', onScroll);
    };
  }, [key, getEl]);
}
