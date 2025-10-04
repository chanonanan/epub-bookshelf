import { usePreserveVirtualScroll } from '@/hooks/usePreserveVirtualScroll';
import { batchProcessor } from '@/services/batchProcessor';
import type { File } from '@/types/models';
import { RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '../ui/button';
import { BookCard, type BookCardProps } from './BookCard';

interface Props {
  books: Omit<BookCardProps, 'view' | 'index'>[];
  files: File[];
  viewMode: 'list' | 'card';
}

export function BookList({ books, files, viewMode }: Props) {
  const cardWidth = 150;
  const cardHeight = 260;
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
    books.length > 0,
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

  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelect = (fileId: string, multi: boolean) => {
    setSelected((prev) => {
      const next = new Set(multi ? prev : []); // clear if not multi-select
      if (next.has(fileId)) next.delete(fileId);
      else next.add(fileId);
      return next;
    });
  };

  const handleClick = (fileId: string, e: React.MouseEvent) => {
    const multi = e.ctrlKey || e.metaKey;

    if (multi) {
      e.preventDefault();
    }

    console.log(multi ? 'Handle select' : 'Handle click');
    toggleSelect(fileId, multi);
  };

  const handleContextMenu = (fileId: string, e: React.MouseEvent) => {
    e.preventDefault();
    console.log('Handle context menu');
    toggleSelect(fileId, true);
  };

  const clearSelection = () => setSelected(new Set());

  const handleRefreshMetadata = async () => {
    // example logic
    const selectedFiles = files.filter(
      (file) =>
        selected.has(file.id) ||
        file.metadata?.author?.some((a) => selected.has(a)) ||
        selected.has(file.metadata?.series!) ||
        file.metadata?.tags?.some((a) => selected.has(a)),
    );
    console.log('Refreshing metadata for:', selectedFiles);
    batchProcessor.addJobs(selectedFiles, true);
    clearSelection();
  };

  // === Calculate columns and rowHeight depending on mode ===
  const columns = useMemo(() => {
    if (viewMode === 'list') return 1;
    if (!containerW) return 1;
    const full = cardWidth + gap;
    const safeW = containerW - gap * 2;
    return Math.min(6, Math.max(1, Math.floor(safeW / full)));
  }, [viewMode, containerW]);

  const rowHeight = viewMode === 'list' ? listHeight + gap : cardHeight + gap;
  const totalRows = Math.ceil(books.length / columns);

  const startRow = Math.max(
    0,
    Math.floor(scrollTop / rowHeight) - overscanRows,
  );
  const visibleRowCount =
    Math.ceil((viewportH || 0) / rowHeight) + overscanRows * 2;
  const endRow = Math.min(totalRows, startRow + visibleRowCount);

  const startIndex = startRow * columns;
  const endIndex = Math.min(books.length, endRow * columns);

  const topSpacer = startRow * rowHeight;

  const bottomSpacer = Math.max(0, (totalRows - endRow) * rowHeight);

  const slice = books.slice(startIndex, endIndex);

  return (
    <>
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
            {slice.map((it, sliceIndex) => {
              const isSelected = selected.has(it.id);
              return (
                <div
                  key={it.id}
                  className="context-menu-target"
                  style={{
                    inlineSize: cardWidth,
                    blockSize: cardHeight,
                    contentVisibility: 'auto',
                    containIntrinsicSize: `${cardHeight}px ${cardWidth}px`,
                  }}
                  onClick={(e) => handleClick(it.id, e)}
                  onContextMenu={(e) => handleContextMenu(it.id, e)}
                >
                  <BookCard
                    {...it}
                    index={sliceIndex + startIndex}
                    view="grid"
                    className={`relative rounded-lg overflow-hidden cursor-pointer transition ${
                      isSelected ? 'border-blue-500' : 'hover:bg-muted/20'
                    }`}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          // === LIST MODE ===
          <div className="flex flex-col gap-2">
            {slice.map((it, sliceIndex) => {
              const isSelected = selected.has(it.id);
              return (
                <ul
                  key={it.id}
                  style={{
                    blockSize: listHeight,
                    contentVisibility: 'auto',
                    containIntrinsicSize: `${listHeight}px ${containerW}px`,
                  }}
                  className={`context-menu-target relative rounded-lg overflow-hidden cursor-pointer transition ${
                    isSelected
                      ? 'ring-4 ring-blue-500 bg-blue-50'
                      : 'hover:bg-muted/20'
                  }`}
                  onClick={(e) => handleClick(it.id, e)}
                  onContextMenu={(e) => handleContextMenu(it.id, e)}
                >
                  <BookCard
                    {...it}
                    index={sliceIndex + startIndex}
                    view="list"
                  />
                </ul>
              );
            })}
          </div>
        )}

        {/* Bottom spacer */}
        <div style={{ blockSize: bottomSpacer }} />
      </div>
      {/* Floating Action Button */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 right-6 flex gap-2 animate-in fade-in duration-200">
          <Button
            size="icon"
            className="h-14 w-14 rounded-full shadow-lg"
            onClick={handleRefreshMetadata}
          >
            <RefreshCw className="h-6 w-6" />
          </Button>
        </div>
      )}
    </>
  );
}
