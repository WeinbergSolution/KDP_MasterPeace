import { redact } from './redaction.js';

// Central structured logger (AGENTS.md §9.2). Application code never calls
// console.*; it logs through this logger, which emits one redacted JSON line
// per event and carries a correlation id for request tracing.

/** Log severity levels. */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** Structured fields attached to a log entry. */
export type LogFields = Record<string, unknown>;

/** A structured logger with per-level methods and child scoping. */
export interface Logger {
  debug(message: string, fields?: LogFields): void;
  info(message: string, fields?: LogFields): void;
  warn(message: string, fields?: LogFields): void;
  error(message: string, fields?: LogFields): void;
  child(fields: LogFields): Logger;
}

/** Sink that receives one fully-formatted JSON log line. */
export type LogSink = (line: string) => void;

/**
 * Writes a single log line to stdout (never `console.*`, per §9.1).
 *
 * @param line The formatted JSON log line.
 */
function writeLine(line: string): void {
  process.stdout.write(`${line}\n`);
}

/**
 * Serializes a log entry to a redacted, single-line JSON string.
 *
 * @param level The log level.
 * @param message The human-readable message.
 * @param fields The merged structured fields.
 * @returns The JSON-encoded log line.
 */
function formatEntry(
  level: LogLevel,
  message: string,
  fields: LogFields,
): string {
  const redacted = redact(fields) as LogFields;
  return JSON.stringify({
    level,
    time: new Date().toISOString(),
    message,
    ...redacted,
  });
}

/**
 * Creates a structured logger. Base fields (e.g. a correlation id or service
 * name) are merged into every entry; `child` derives a scoped logger.
 *
 * @param base Fields merged into every log entry.
 * @param sink Destination for formatted lines (defaults to stdout).
 * @returns A logger instance.
 */
export function createLogger(
  base: LogFields = {},
  sink: LogSink = writeLine,
): Logger {
  const emit = (level: LogLevel, message: string, fields?: LogFields) =>
    sink(formatEntry(level, message, { ...base, ...fields }));
  return {
    debug: (message, fields) => emit('debug', message, fields),
    info: (message, fields) => emit('info', message, fields),
    warn: (message, fields) => emit('warn', message, fields),
    error: (message, fields) => emit('error', message, fields),
    child: (fields) => createLogger({ ...base, ...fields }, sink),
  };
}
