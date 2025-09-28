import { useBatchProgress } from '@/hooks/useBatchProgress';

export function ProgressIndicator() {
  const { processed, total, errorCount } = useBatchProgress();

  if (total === 0) return null;

  const percent = Math.round((processed / total) * 100);

  return (
    <div className="flex items-center gap-2 text-sm">
      {processed < total ? (
        <>
          <span>
            {processed} / {total}
          </span>
          <div className="w-24 h-2 bg-gray-200 rounded">
            <div
              className="h-2 bg-indigo-500 rounded"
              style={{ width: `${percent}%` }}
            />
          </div>
        </>
      ) : errorCount > 0 ? (
        <span className="text-red-600">⚠ {errorCount} failed</span>
      ) : (
        <span className="text-green-600">✅ Done</span>
      )}
    </div>
  );
}
