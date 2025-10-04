import { useState } from 'react';

function formatStackLine(line: string) {
  const match = line.trim().match(/^at\s+([^\s(]+)/);
  return match ? `at ${match[1]}` : line.trim();
}

export function LogItem({ entry }: { entry: any }) {
  const [expanded, setExpanded] = useState(false);

  const firstLine = entry.trace?.[0];
  const restLines = entry.trace?.slice(1) ?? [];

  return (
    <div className="border-b py-1 font-mono text-sm">
      {/* Header */}
      <div>
        <span
          className={
            entry.level === 'error'
              ? 'text-red-500'
              : entry.level === 'warn'
                ? 'text-yellow-500'
                : entry.level === 'info'
                  ? 'text-blue-500'
                  : 'text-gray-400'
          }
        >
          [{entry.level.toUpperCase()}]
        </span>{' '}
        <span className="text-xs text-gray-500">
          {new Date(entry.timestamp).toLocaleTimeString()}
        </span>
      </div>

      {/* Log message */}
      <div className="ml-2">
        {entry.message.map((m: any, i: number) => (
          <span key={i} className="ml-1">
            {typeof m === 'object' ? JSON.stringify(m) : String(m)}
          </span>
        ))}
      </div>

      {/* Stack trace — one line with truncation */}
      {firstLine && !expanded && (
        <div className="ml-4 mt-1 text-xs text-gray-500 flex items-center justify-between">
          <div className="truncate max-w-[75%]" title={entry.trace.join('\n')}>
            {formatStackLine(firstLine)}
          </div>

          {restLines.length > 0 && (
            <button
              onClick={() => setExpanded(true)}
              className="ml-2 text-blue-500 hover:underline whitespace-nowrap"
            >
              Show more
            </button>
          )}
        </div>
      )}

      {/* Expanded full trace */}
      {expanded && (
        <div className="ml-4 mt-1 text-xs text-gray-500 flex flex-col">
          <pre className="whitespace-pre-wrap">
            {entry.trace.map((line: string, idx: number) => (
              <div key={idx}>{formatStackLine(line)}</div>
            ))}
          </pre>

          <button
            onClick={() => setExpanded(false)}
            className="ml-2 text-blue-500 hover:underline whitespace-nowrap self-end"
          >
            Show less
          </button>
        </div>
      )}
    </div>
  );
}
