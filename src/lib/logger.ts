type LogLevel = 'error' | 'warn' | 'info';

interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  [key: string]: unknown;
}

const isDev = import.meta.env.DEV;

function formatLog(level: LogLevel, message: string, context?: LogContext) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  };

  if (isDev) {
    const color = level === 'error' ? '\x1b[31m' : level === 'warn' ? '\x1b[33m' : '\x1b[36m';
    console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'info'](
      `${color}[${level.toUpperCase()}]\x1b[0m ${message}`,
      context || ''
    );
  } else {
    // Production: structured JSON for log aggregation
    console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'info'](
      JSON.stringify(entry)
    );
  }

  return entry;
}

export function logError(error: unknown, context?: LogContext) {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  return formatLog('error', message, { ...context, stack });
}

export function logWarning(message: string, data?: LogContext) {
  return formatLog('warn', message, data);
}

export function logEvent(name: string, properties?: LogContext) {
  return formatLog('info', name, properties);
}
