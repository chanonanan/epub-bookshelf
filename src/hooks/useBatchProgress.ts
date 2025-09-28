import { syncChannel } from '@/services/channel';
import { useEffect, useState } from 'react';

interface Progress {
  processed: number;
  total: number;
  errorCount: number;
}

export function useBatchProgress() {
  const [progress, setProgress] = useState<Progress>({
    processed: 0,
    total: 0,
    errorCount: 0,
  });

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data.type === 'progress') {
        setProgress(e.data.progress);
      }
    };
    syncChannel.addEventListener('message', handler);

    return () => {
      syncChannel.removeEventListener('message', handler);
    };
  }, []);

  return progress;
}
