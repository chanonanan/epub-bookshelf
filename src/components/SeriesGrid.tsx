import type { BookMetadata } from '@/epubUtils';
import { useNavigate } from 'react-router-dom';
import { AutoSizer, Grid } from 'react-virtualized';
import { Badge } from './ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { LazyImage } from './ui/lazy-image';

export interface SeriesGroup {
  name: string;
  books: BookMetadata[];
  coverBlob?: Blob;
}

export const SeriesGrid = ({
  series,
  folderId,
}: {
  series: SeriesGroup[];
  folderId: string;
}) => {
  const navigate = useNavigate();

  // Tailwind-style breakpoints (match your design system)
  const getColumnCount = (width: number) => {
    if (width < 640) return 1; // sm: <640px
    if (width < 768) return 2; // md: <768px
    if (width < 1024) return 3; // lg: <1024px
    if (width < 1280) return 4; // xl: <1280px
    return 5; // 2xl and up
  };

  const gutter = 24; // gap-6 = 1.5rem = 24px

  const cellRenderer = ({
    columnIndex,
    rowIndex,
    key,
    style,
    parent,
  }: {
    columnIndex: number;
    rowIndex: number;
    key: string;
    style: React.CSSProperties;
    parent: any;
  }) => {
    const { columnCount } = parent.props;
    const index = rowIndex * columnCount + columnIndex;
    if (index >= series.length) return null;

    const group = series[index];

    // Adjust for gutter
    const cellStyle: React.CSSProperties = {
      ...style,
      left: (style.left as number) + gutter / 2,
      top: (style.top as number) + gutter / 2,
      width: (style.width as number) - gutter,
      height: (style.height as number) - gutter,
    };

    return (
      <div key={key} style={cellStyle}>
        <Card
          title={group.name}
          className="hover:bg-accent transition-colors cursor-pointer relative h-full flex flex-col"
          onClick={() =>
            navigate(`/bookshelf/${folderId}/${encodeURIComponent(group.name)}`)
          }
        >
          <CardHeader className="p-0 flex-1">
            <div
              className="relative w-full h-full bg-muted rounded-t-lg overflow-hidden"
              style={{ minHeight: 0 }}
            >
              <LazyImage
                src={group.coverBlob}
                alt={`${group.name} cover`}
                className="w-full h-full object-cover"
              />
              <Badge variant="default" className="absolute top-2 right-2">
                {group.books.length} book
                {group.books.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 flex-shrink-0">
            <CardTitle className="line-clamp-2 text-base">
              {group.name}
            </CardTitle>
            <CardDescription className="line-clamp-1">
              {group.books[0].author}
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <AutoSizer>
      {({ width, height }) => {
        const columnCount = getColumnCount(width);
        const columnWidth = width / columnCount;

        const cardAspectRatio = 3 / 2; // 2:3 width:height
        const extraHeight = 64; // adjust for padding + text
        const rowHeight = columnWidth * cardAspectRatio + extraHeight;

        return (
          <Grid
            autoContainerWidth
            cellRenderer={cellRenderer}
            columnCount={columnCount}
            columnWidth={columnWidth}
            rowCount={Math.ceil(series.length / columnCount)}
            rowHeight={rowHeight}
            width={width}
            height={rowHeight * Math.ceil(series.length / columnCount)} // full content height
            style={{ overflowY: 'visible' }} // disable internal scroll
          />
        );
      }}
    </AutoSizer>
  );
};
