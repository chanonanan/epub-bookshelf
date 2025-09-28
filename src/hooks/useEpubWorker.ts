import { useEffect, useRef } from 'react';

interface WorkerMessage {
  type: 'metadata' | 'error';
  fileId: string;
  payload?: any;
  error?: string;
}

export function useEpubWorker(onResult: (msg: WorkerMessage) => void) {
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const worker = new Worker(
      new URL('../workers/epubWorker.ts', import.meta.url),
      { type: 'module' },
    );
    workerRef.current = worker;

    worker.onmessage = (e) => {
      onResult(e.data);
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, [onResult]);

  const postJob = (job: any) => {
    workerRef.current?.postMessage(job);
  };

  return { postJob };
}
