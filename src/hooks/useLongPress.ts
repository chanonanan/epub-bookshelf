import { useCallback, useRef } from 'react';

interface UseLongPressOptions {
  delay?: number;
}

/**
 * Hook that returns a function to bind long-press handlers to any element.
 * Each call can have its own callback — works in loops or conditionals.
 */
export function useLongPress<T extends HTMLElement = HTMLElement>({
  delay = 600,
}: UseLongPressOptions = {}) {
  const timerRef = useRef<number | null>(null);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 👉 returns a function to create event bindings per element
  const bind = useCallback(
    (callback: (event: React.MouseEvent<T> | React.TouchEvent<T>) => void) => ({
      onMouseDown: (e: React.MouseEvent<T>) => {
        e.persist?.();
        timerRef.current = window.setTimeout(() => callback(e), delay);
      },
      onMouseUp: clear,
      onMouseLeave: clear,
      onTouchStart: (e: React.TouchEvent<T>) => {
        e.persist?.();
        timerRef.current = window.setTimeout(() => callback(e), delay);
      },
      onTouchEnd: clear,
    }),
    [delay, clear],
  );

  return bind;
}
