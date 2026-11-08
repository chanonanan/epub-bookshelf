import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PageHeaderProps {
  backLabel: string;
  backTo: string;
  backScrollY?: number;
  title?: string;
  iconOnlyBack?: boolean;
}

export function PageHeader({
  backLabel,
  backTo,
  backScrollY,
  title,
  iconOnlyBack = false,
}: PageHeaderProps) {
  const backState =
    backScrollY === undefined ? undefined : { restoreScrollY: backScrollY };

  return (
    <header className="book-details-header mb-6 py-4">
      {iconOnlyBack && title ? (
        <div className="flex items-center gap-3">
          <Link
            to={backTo}
            state={backState}
            aria-label={`Back to ${backLabel}`}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <ArrowLeft aria-hidden="true" className="h-5 w-5" />
          </Link>
          <h1 className="min-w-0 text-2xl font-semibold tracking-tight">
            {title}
          </h1>
        </div>
      ) : (
        <>
          <Link
            to={backTo}
            state={backState}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            <span>Back to {backLabel}</span>
          </Link>
          {title && (
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">
              {title}
            </h1>
          )}
        </>
      )}
    </header>
  );
}
