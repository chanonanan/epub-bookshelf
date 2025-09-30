import type { File } from '@/types/models';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BookCard } from './BookCard';

interface Props {
  files: File[];
  viewMode: 'list' | 'card';
}

export function BookList({ files, viewMode }: Props) {
  const cardWidth = 180;
  const cardHeight = 310;
  const gap = 16;
  const overscanRows = 3;
  const ref = useRef<HTMLDivElement>(null);
  const [viewportH, setViewportH] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerW, setContainerW] = useState(0);

  console.log('view mode: ', viewMode);

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

  const columns = useMemo(() => {
    if (!containerW) return 1;
    const full = cardWidth + gap;
    const safeW = containerW - gap; // leave breathing room
    const cols = Math.min(5, Math.max(1, Math.floor(safeW / full)));

    return cols;
  }, [containerW, cardWidth, gap]);

  const rowHeight = cardHeight + gap;
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

      {/* The actual visible grid chunk */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, minmax(0, ${cardWidth}px))`,
          gap,
          paddingInline: gap,
          justifyContent: 'center',
          alignContent: 'start',
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
            <BookCard
              key={it.id}
              file={it}
              index={sliceIndex + startIndex}
              view="grid"
            />
          </div>
        ))}
      </div>

      {/* Bottom spacer */}
      <div style={{ blockSize: bottomSpacer }} />
    </div>
  );
}
