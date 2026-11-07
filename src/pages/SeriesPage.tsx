import { Bookshelf } from '@/components/Bookshelf';
import { RoutingPath } from '@/components/RoutingPath';
import { useParams } from 'react-router-dom';

interface SeriesPageProps {
  folderName?: string;
  searchQuery?: string;
}

export default function SeriesPage({ folderName, searchQuery }: SeriesPageProps) {
  const { folderId, series } = useParams<{
    folderId: string;
    series: string;
  }>();
  const selectedSeries = series ? decodeURIComponent(series) : null;

  if (!folderId) {
    return <div>Invalid folder ID</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <RoutingPath folderName={folderName} />
      <Bookshelf
        folderId={folderId}
        initialSeries={selectedSeries || ''}
        searchQuery={searchQuery}
      />
    </div>
  );
}
