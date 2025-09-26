import { Badge } from './ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { LazyImage } from './ui/lazy-image';

interface BookMetadata {
  id: string;
  title: string;
  author: string;
  coverBlob?: Blob;
  badge?: string | number;
}

interface BookCardProps {
  book: BookMetadata;
  onClick?: () => void;
  onHover?: () => void;
}

export const BookCard = ({ book, onClick, onHover }: BookCardProps) => {
  return (
    <Card
      key={book.id}
      onClick={onClick}
      onMouseEnter={onHover}
      className="hover:bg-accent transition-colors cursor-pointer relative"
    >
      <CardHeader className="p-0">
        <div className="relative w-full aspect-[2/3] bg-muted rounded-md md:rounded-t-lg overflow-hidden">
          <LazyImage
            src={book.coverBlob}
            alt={`${book.title} cover`}
            className="w-full h-full object-cover"
          />
          {book.badge && (
            <Badge variant="default" className="absolute top-2 right-2">
              {book.badge}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="hidden sm:block p-4">
        <CardTitle className="line-clamp-2 text-base mb-1">
          {book.title}
        </CardTitle>
        <CardDescription className="line-clamp-1">
          {book.author}
        </CardDescription>
      </CardContent>
    </Card>
  );
};
