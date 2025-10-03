import { usePreserveVirtualScroll } from '@/hooks/usePreserveVirtualScroll';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { BookCard, type BookCardProps } from './BookCard';

interface Props {
  files: Omit<BookCardProps, 'view' | 'index'>[];
  viewMode: 'list' | 'card';
}

export function BookList({ files, viewMode }: Props) {
  const cardWidth = 150;
  const cardHeight = 290;
  const listHeight = 90; // approximate row height for list mode
  const gap = 16;
  const overscanRows = 3;
  const ref = useRef<HTMLDivElement>(null);
  const [viewportH, setViewportH] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerW, setContainerW] = useState(0);
  const location = useLocation();
  usePreserveVirtualScroll(
    `booklist-${location.pathname + location.search}`,
    files.length > 0,
    () => document.body,
  );

  useEffect(() => {
    const el = document.body;

    const ro = new ResizeObserver(() => {
      setContainerW(el.clientWidth);
    });
    ro.observe(el);

    const onScroll = () => setScrollTop(el.scrollTop);
    el.addEventListener('scroll', onScroll, { passive: true });
    setViewportH(el.clientHeight);
    setContainerW(el.clientWidth);

    const onWinResize = () => setViewportH(el.clientHeight);
    window.addEventListener('resize', onWinResize);

    return () => {
      ro.disconnect();
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onWinResize);
    };
  }, []);

  // === Calculate columns and rowHeight depending on mode ===
  const columns = useMemo(() => {
    if (viewMode === 'list') return 1;
    if (!containerW) return 1;
    const full = cardWidth + gap;
    const safeW = containerW - gap * 2;
    return Math.min(5, Math.max(1, Math.floor(safeW / full)));
  }, [viewMode, containerW]);

  const rowHeight = viewMode === 'list' ? listHeight + gap : cardHeight + gap;
  const totalRows = Math.ceil(files.length / columns);

  const startRow = Math.max(
    0,
    Math.floor(scrollTop / rowHeight) - overscanRows,
  );
  const visibleRowCount =
    Math.ceil((viewportH || 0) / rowHeight) + overscanRows * 2;
  const endRow = Math.min(totalRows, startRow + visibleRowCount);

  const startIndex = startRow * columns;
  const endIndex = Math.min(files.length, endRow * columns);

  const topSpacer = startRow * rowHeight;

  const bottomSpacer = Math.max(0, (totalRows - endRow) * rowHeight);

  const slice = files.slice(startIndex, endIndex);

  return (
    <div ref={ref}>
      {/* Top spacer */}
      <div style={{ blockSize: topSpacer }} />

      {viewMode === 'card' ? (
        // === GRID MODE ===
        <div
          className="grid justify-around content-start"
          style={{
            gridTemplateColumns: `repeat(${columns}, minmax(0, ${cardWidth}px))`,
            gap,
          }}
        >
          {slice.map((it, sliceIndex) => (
            <div
              key={it.id}
              style={{
                inlineSize: cardWidth,
                blockSize: cardHeight,
                contentVisibility: 'auto',
                containIntrinsicSize: `${cardHeight}px ${cardWidth}px`,
              }}
            >
              <BookCard {...it} index={sliceIndex + startIndex} view="grid" />
            </div>
          ))}
        </div>
      ) : (
        // === LIST MODE ===
        <div className="flex flex-col gap-2">
          {slice.map((it, sliceIndex) => (
            <ul
              key={it.id}
              style={{
                blockSize: listHeight,
                contentVisibility: 'auto',
                containIntrinsicSize: `${listHeight}px ${containerW}px`,
              }}
            >
              <BookCard {...it} index={sliceIndex + startIndex} view="list" />
            </ul>
          ))}
        </div>
      )}

      {/* Bottom spacer */}
      <div style={{ blockSize: bottomSpacer }} />
    </div>
  );
}
