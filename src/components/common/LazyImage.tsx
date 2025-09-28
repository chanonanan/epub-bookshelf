import { useState } from 'react';

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  isLCP?: boolean;
}

export function LazyImage({ isLCP, className, ...props }: Props) {
  const [loaded, setLoaded] = useState(false);

  return (
    <img
      {...props}
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
