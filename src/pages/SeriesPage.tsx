import { Bookshelf } from '@/components/Bookshelf';
import { PageHeader } from '@/components/PageHeader';
import { useParams } from 'react-router-dom';

interface SeriesPageProps {
  folderName?: string;
  searchQuery?: string;
}

export default function SeriesPage({
  folderName,
  searchQuery,
}: SeriesPageProps) {
  const { folderId, series } = useParams<{
    folderId: string;
    series: string;
  }>();
  const selectedSeries = series ? decodeURIComponent(series) : null;

  if (!folderId) {
    return <div>Invalid folder ID</div>;
  }

  return (
    <div className="mx-auto">
      <PageHeader
        backLabel={folderName || 'Bookshelf'}
        backTo={`/bookshelf/${folderId}`}
        title={selectedSeries || 'Series'}
        iconOnlyBack
      />
      <Bookshelf
        folderId={folderId}
        initialSeries={selectedSeries || ''}
        searchQuery={searchQuery}
      />
    </div>
  );
}
