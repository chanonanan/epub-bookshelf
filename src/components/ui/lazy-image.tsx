import { useEffect, useRef, useState, type FC } from 'react';

interface LazyImageProps {
  src: Blob | undefined;
  alt: string;
  className?: string;
  imageClassName?: string;
}

const observerCallbacks = new Map<Element, () => void>();
let imageObserver: IntersectionObserver | undefined;

const observeNearViewport = (
  element: Element,
  onVisible: () => void,
): (() => void) => {
  if (!('IntersectionObserver' in window)) {
    onVisible();
    return () => {};
  }

  if (!imageObserver) {
    imageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          observerCallbacks.get(entry.target)?.();
          observerCallbacks.delete(entry.target);
          imageObserver?.unobserve(entry.target);
        });
      },
      { rootMargin: '200px' },
    );
  }

  observerCallbacks.set(element, onVisible);
  imageObserver.observe(element);
  return () => {
    observerCallbacks.delete(element);
    imageObserver?.unobserve(element);
  };
};

export const LazyImage: FC<LazyImageProps> = ({
  src,
  alt,
  className,
  imageClassName,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [srcUrl, setSrcUrl] = useState<string>();
  const [isNearViewport, setIsNearViewport] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !src) return;
    return observeNearViewport(container, () => setIsNearViewport(true));
  }, [src]);

  useEffect(() => {
    setIsLoading(Boolean(src));
    setError(false);
    if (!src || !isNearViewport) {
      setSrcUrl(undefined);
      return;
    }

    const objectUrl = URL.createObjectURL(src);
    setSrcUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [isNearViewport, src]);

  return (
    <div ref={containerRef} className={`relative w-full ${className || ''}`}>
      {isLoading && <div className="absolute inset-0 bg-muted animate-pulse" />}
      {srcUrl ? (
        <img
          src={srcUrl}
          alt={alt}
          loading="lazy"
          className={imageClassName ?? className}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setError(true);
            setIsLoading(false);
          }}
          style={{
            opacity: isLoading ? 0 : 1,
            transition: 'opacity 0.2s ease-in-out',
          }}
        />
      ) : null}
      {(!src || error) && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          No Cover
        </div>
      )}
    </div>
  );
};
