import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { logBuffer } from '@/lib/logger';
import { Portal } from '@radix-ui/react-portal';
import { useEffect, useRef, useState } from 'react';
import { LogItem } from './LogItem';

interface LogViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LogViewerDialog({ open, onOpenChange }: LogViewerDialogProps) {
  const [logs, setLogs] = useState(logBuffer.getAll());
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-refresh logs
  useEffect(() => {
    if (!open) return; // only refresh when dialog is open
    const id = setInterval(() => {
      setLogs(logBuffer.getAll());
    }, 1000);
    return () => clearInterval(id);
  }, [open]);

  // Smart auto-scroll: only if user is near bottom
  useEffect(() => {
    const container = logContainerRef.current;
    if (!container) return;

    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      50;

    if (isNearBottom) {
      container.scrollTop = container.scrollHeight;
    }
  }, [logs]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Portal>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Captured Logs</DialogTitle>
          </DialogHeader>

          <div
            ref={logContainerRef}
            className="mt-2 max-h-[70vh] overflow-y-auto rounded border p-2 font-mono text-sm bg-muted"
          >
            {logs.map((entry, idx) => (
              <LogItem key={idx} entry={entry} />
            ))}
          </div>
        </DialogContent>
      </Portal>
    </Dialog>
  );
}
