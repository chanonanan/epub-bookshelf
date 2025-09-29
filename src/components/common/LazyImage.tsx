import placeholderCover from '@/assets/placeholder.jpg';
import { useEffect, useRef, useState } from 'react';

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  isLCP?: boolean;
  srcBlob?: Blob;
}

export function LazyImage({ isLCP, className, srcBlob, ...props }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [visible, setVisible] = useState(isLCP ?? false); // LCP should render immediately
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
      { rootMargin: '200px' }, // preload a bit before visible
    );

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [isLCP]);

  // Create/revoke object URL only when visible
  useEffect(() => {
    if (!srcBlob || !visible) return;
    const url = URL.createObjectURL(srcBlob);
    setObjectUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [srcBlob, visible]);

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
