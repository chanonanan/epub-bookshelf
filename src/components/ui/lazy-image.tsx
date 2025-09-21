import { useState, type FC } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
}

export const LazyImage: FC<LazyImageProps> = ({ src, alt, className }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className={`relative w-full h-full ${className || ''}`}>
      {isLoading && <div className="absolute inset-0 bg-muted animate-pulse" />}
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className={className}
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
