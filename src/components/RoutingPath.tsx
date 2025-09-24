import { getMetadataById } from '@/lib/epubUtils';
import { Fragment, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './ui/breadcrumb';

export function RoutingPath() {
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

  useEffect(() => {
    const loadBook = async () => {
      const items = [{ name: 'Home', path: '/' }];
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

  return (
    <div className="mb-6 flex items-center justify-between sticky top-0 bg-background z-10 py-4">
      <Breadcrumb>
        <BreadcrumbList>
          {items.map((item, index) => (
            <Fragment key={index}>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  {index === items.length - 1 ? (
                    <BreadcrumbPage>{item.name}</BreadcrumbPage>
                  ) : (
                    <Link to={item.path}>{item.name}</Link>
                  )}
                </BreadcrumbLink>
              </BreadcrumbItem>
              {index < items.length - 1 && <BreadcrumbSeparator />}
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
