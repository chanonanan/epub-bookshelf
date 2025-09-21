import { useParams } from 'react-router-dom';
import { Bookshelf } from '../components/Bookshelf';

interface SeriesPageProps {
  searchQuery?: string;
}

export default function SeriesPage({ searchQuery }: SeriesPageProps) {
  const { folderId, series } = useParams<{
    folderId: string;
    series: string;
  }>();

  if (!folderId) {
    return <div>Invalid folder ID</div>;
  }

  return (
    <div className="bg-background">
      <Bookshelf
        folderId={folderId}
        initialSeries={decodeURIComponent(series || '')}
        searchQuery={searchQuery}
      />
    </div>
  );
}
