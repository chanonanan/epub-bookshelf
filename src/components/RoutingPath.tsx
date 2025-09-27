import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useBreakpoint } from '@/hooks'; // custom hook (see below)
import { getMetadataById } from '@/lib/epubUtils';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from './ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './ui/drawer';

const ITEMS_TO_DISPLAY = 3;

export const RoutingPath = () => {
  const {
    folderId,
    series,
    id: bookId,
  } = useParams<{
    folderId: string;
    series: string;
    id: string;
  }>();
  const selectedSeries = series ? decodeURIComponent(series) : null;
  const [items, setItems] = useState<{ name: string; path: string }[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const loadBook = async () => {
      const items = [];
      try {
        if (folderId) {
          items.push({ name: 'Bookshelf', path: `/bookshelf/${folderId}` });
        }
        if (selectedSeries) {
          items.push({
            name: selectedSeries,
            path: `/bookshelf/${folderId}/${selectedSeries}`,
          });
        }

        if (bookId) {
          const metadata = await getMetadataById(bookId);
          if (metadata) {
            items.push({ name: metadata.title || 'Book', path: '#' });
          }
        }
      } catch (err) {
        console.error('Error loading book metadata:', err);
      } finally {
        setItems(items);
      }
    };

    loadBook();
  }, [bookId, folderId, selectedSeries]);

  // detect mobile
  const isMobile = useBreakpoint('sm');

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="md:mb-6 flex items-center justify-between sticky top-0 bg-background z-10 p-4">
      <Breadcrumb>
        <BreadcrumbList>
          {/* Home always visible */}
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>

          {isMobile && items.length >= ITEMS_TO_DISPLAY ? (
            <>
              <BreadcrumbSeparator />
              <Drawer open={open} onOpenChange={setOpen}>
                <DrawerTrigger aria-label="Toggle Menu">
                  <BreadcrumbEllipsis className="h-4 w-4" />
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader className="text-left">
                    <DrawerTitle>Navigate to</DrawerTitle>
                    <DrawerDescription>
                      Select a page to navigate to.
                    </DrawerDescription>
                  </DrawerHeader>
                  <div className="grid gap-1 px-4">
                    {items.slice(0, -1).map((item, index) => (
                      <Link key={index} to={item.path} className="py-1 text-sm">
                        {item.name}
                      </Link>
                    ))}
                  </div>
                  <DrawerFooter className="pt-4">
                    <DrawerClose asChild>
                      <Button variant="outline">Close</Button>
                    </DrawerClose>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
            </>
          ) : (
            items.slice(0, -1).map((part, idx) => (
              <div key={idx} className="flex items-center">
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to={part.path}>{decodeURIComponent(part.name)}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </div>
            ))
          )}

          {/* Last item (always visible) */}
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{items[items.length - 1].name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
};
