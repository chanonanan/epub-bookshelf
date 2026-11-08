import { Bookshelf } from '@/components/Bookshelf';
import { PageHeader } from '@/components/PageHeader';
import type { LibraryFolder } from '@/types/library';
import { useLocation, useParams } from 'react-router-dom';

interface SeriesPageProps {
  folders: LibraryFolder[];
  searchQuery?: string;
}

export default function SeriesPage({ folders, searchQuery }: SeriesPageProps) {
  const { series } = useParams<{ series: string }>();
  const location = useLocation();
  const routeState = location.state as { returnScrollY?: number } | null;
  const selectedSeries = series ? decodeURIComponent(series) : null;

  return (
    <div className="mx-auto">
      <PageHeader
        backLabel="Bookshelf"
        backTo="/bookshelf"
        backScrollY={routeState?.returnScrollY}
        title={selectedSeries || 'Series'}
        iconOnlyBack
      />
      <Bookshelf
        folders={folders}
        initialSeries={selectedSeries || ''}
        searchQuery={searchQuery}
      />
    </div>
  );
}
