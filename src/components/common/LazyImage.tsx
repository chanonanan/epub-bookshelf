import placeholderCover from '@/assets/placeholder.jpg';
import { useEffect, useRef, useState } from 'react';

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  id: string;
  isLCP?: boolean;
  srcBlob?: Blob;
}

export function LazyImage({ id, isLCP, className, srcBlob, ...props }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [visible, setVisible] = useState(isLCP ?? false);
  const [objectUrl, setObjectUrl] = useState<string>();
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Observe when the image enters viewport
  useEffect(() => {
    if (isLCP || !imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [isLCP]);

  // Get cached object URL only when visible
  useEffect(() => {
    if (!srcBlob || !id || !visible) return;

    const url = getObjectUrl(id, srcBlob);
    setObjectUrl(url);

    // Do NOT revoke here → cache keeps it alive
    // Cleanup handled globally if needed
  }, [srcBlob, id, visible]);

  return (
    <img
      {...props}
      ref={imgRef}
      src={objectUrl ?? placeholderCover}
      loading={isLCP ? 'eager' : 'lazy'}
      fetchPriority={isLCP ? 'high' : 'auto'}
      decoding="async"
      onLoad={(e) => {
        setLoaded(true);
        props.onLoad?.(e);
      }}
      className={`transition-opacity duration-300 ${
        loaded ? 'opacity-100' : 'opacity-0'
      } ${className ?? ''}`}
    />
  );
}

// Global cache (fileId/hash -> URL)
const blobUrlCache = new Map<string, string>();

function getObjectUrl(id: string, blob: Blob): string {
  if (!blobUrlCache.has(id)) {
    blobUrlCache.set(id, URL.createObjectURL(blob));
  }
  return blobUrlCache.get(id)!;
}
