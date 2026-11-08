import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { useLayoutEffect, useRef, useState } from 'react';

type ViewMode = 'grid' | 'list';

interface VirtualizedCollectionProps {
  itemCount: number;
  viewMode: ViewMode;
  renderItem: (index: number) => React.ReactNode;
}

const VIRTUALIZATION_THRESHOLD = 40;
const GRID_GAP = 12;

export function VirtualizedCollection({
  itemCount,
  viewMode,
  renderItem,
}: VirtualizedCollectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const isGrid = viewMode === 'grid';
  const isVirtualized = itemCount > VIRTUALIZATION_THRESHOLD;
  const scrollMargin = containerRef.current
    ? containerRef.current.getBoundingClientRect().top + window.scrollY
    : 0;
  const columnCount = isGrid
    ? Math.max(1, Math.floor((width + GRID_GAP) / (120 + GRID_GAP)))
    : 1;
  const columnWidth = width / columnCount;
  const itemWidth = isGrid
    ? columnWidth - (GRID_GAP * (columnCount - 1)) / columnCount
    : width;
  const rowHeight = isGrid ? Math.ceil(itemWidth * 1.5 + 96) : 112;
  const rowCount = Math.ceil(itemCount / columnCount);
  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    enabled: isVirtualized && width > 0,
    estimateSize: () => rowHeight,
    getItemKey: (index) => index,
    overscan: 3,
    scrollMargin,
  });

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => setWidth(container.getBoundingClientRect().width);

    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(container);
    window.addEventListener('resize', updateWidth);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  const layoutClassName = isGrid
    ? 'grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3 sm:gap-4'
    : 'flex flex-col gap-2';

  if (!isVirtualized) {
    return (
      <div ref={containerRef} className={layoutClassName}>
        {Array.from({ length: itemCount }, (_, index) => (
          <div key={index} className={isGrid ? 'min-w-0' : 'w-full'}>
            {renderItem(index)}
          </div>
        ))}
      </div>
    );
  }

  if (width === 0) {
    return <div ref={containerRef} className="w-full" />;
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: virtualizer.getTotalSize() }}
    >
      {virtualizer.getVirtualItems().map((virtualRow) => {
        const rowStartIndex = virtualRow.index * columnCount;
        const rowItems = Array.from(
          { length: Math.min(columnCount, itemCount - rowStartIndex) },
          (_, columnIndex) => rowStartIndex + columnIndex,
        );

        return (
          <div
            key={virtualRow.key}
            className={isGrid ? 'grid' : 'flex flex-col'}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: rowHeight - (isGrid ? GRID_GAP : 8),
              transform: `translateY(${virtualRow.start - scrollMargin}px)`,
              gridTemplateColumns: isGrid
                ? `repeat(${columnCount}, minmax(0, 1fr))`
                : undefined,
              columnGap: isGrid ? GRID_GAP : undefined,
              rowGap: isGrid ? undefined : 8,
            }}
          >
            {rowItems.map((index) => (
              <div
                key={index}
                className="h-full min-w-0"
                style={{ width: isGrid ? itemWidth : '100%' }}
              >
                {renderItem(index)}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
