export type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';
export type LogEntry = {
  level: LogLevel;
  message: any[];
  timestamp: number;
  trace?: string[];
};

class LogBuffer {
  private buffer: LogEntry[] = [];
  private max: number;

  constructor(max: number = 200) {
    this.max = max;
  }

  add(entry: LogEntry) {
    this.buffer.push(entry);
    if (this.buffer.length > this.max) {
      this.buffer.shift();
    }
  }

  getAll() {
    return [...this.buffer];
  }
}

export const logBuffer = new LogBuffer(200);

// Patch function
function patchConsoleMethod(level: LogLevel) {
  const original = console[level].bind(console);

  console[level] = (...args: any[]) => {
    // Capture stack trace, skip the first 2 lines (Error + logger itself)
    const stack = new Error().stack?.split('\n').slice(2) ?? [];

    logBuffer.add({
      level,
      message: args,
      timestamp: Date.now(),
      trace: stack,
    });
    return original(...args); // preserves callsite better than wrapping
  };
}

// Patch all
(['log', 'info', 'warn', 'error', 'debug'] as LogLevel[]).forEach(
  patchConsoleMethod,
);
