import { db } from '@/db/schema';
import { logBuffer } from '@/lib/logger';
import type { File } from '@/types/models';
import { syncChannel } from './channel';
import { saveCover } from './coverService';

interface Progress {
  processed: number;
  total: number;
  errorCount: number;
}

class BatchProcessor {
  private queue: File[] = [];
  private running = 0;
  private concurrency = 3; // 👈 how many workers at once
  private progress: Progress = { processed: 0, total: 0, errorCount: 0 };
  private getAccessToken:
    | ((provider: string) => Promise<string | null | undefined>)
    | null = null;

  setTokenProvider(
    fn: (provider: string) => Promise<string | null | undefined>,
  ) {
    this.getAccessToken = fn;
  }

  addJobs(files: File[], force = false) {
    const jobs = force ? files : files.filter((f) => f.status !== 'ready');
    if (!jobs.length) return;

    console.log('Add jobs', jobs);

    this.queue.push(...jobs);
    this.progress.total += jobs.length;
    this.runNext();
  }

  private runNext() {
    while (this.running < this.concurrency && this.queue.length > 0) {
      const file = this.queue.shift()!;
      this.startJob(file);
    }
  }

  private startJob(file: File) {
    this.running++;

    db.files.update([file.provider, file.id], { status: 'processing' });

    this.extract(file)
      .then(() => {
        this.progress.processed++;
      })
      .catch(async (err) => {
        console.error('[BatchProcessor] Job failed', err);
        this.progress.errorCount++;
        await db.files.update([file.provider, file.id], { status: 'error' });
      })
      .finally(() => {
        this.running--;
        this.notify();
        this.runNext(); // kick off next job
      });
  }

  private extract(file: File) {
    return new Promise<void>(async (resolve, reject) => {
      const worker = new Worker(
        new URL('../workers/epubWorker.ts', import.meta.url),
        { type: 'module' },
      );

      const accessToken = await this.getAccessToken?.(file.provider);

      worker.onmessage = async (e) => {
        const { type, payload } = e.data;

        if (type === 'WORKER_LOG') {
          logBuffer.add({
            level: e.data.level,
            message: e.data.args,
            timestamp: Date.now(),
            trace: ['at epubWorker.ts'],
          });
        }

        if (type === 'done') {
          resolve();
        }

        if (type === 'cover') {
          try {
            const blob = new Blob([payload], { type: 'image/jpeg' });
            await saveCover(file.id, file.provider, blob);

            await db.files.update([file.provider, file.id], {
              coverId: file.id,
            });
            resolve();
          } catch (err) {
            console.error('Cover save failed', err);
          }
        }

        if (type === 'error') {
          console.log('Extracted error: ', payload);
          reject(new Error(e.data.error));
        }
      };

      worker.postMessage({
        type: 'extract',
        provider: file.provider,
        fileId: file.id,
        accessToken,
      });
    });
  }

  private notify() {
    syncChannel.postMessage({ type: 'progress', progress: this.progress });
  }
}

export const batchProcessor = new BatchProcessor();
