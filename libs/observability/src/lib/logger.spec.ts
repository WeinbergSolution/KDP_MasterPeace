import { describe, expect, it } from 'vitest';
import { createLogger } from './logger.js';
import { redact } from './redaction.js';

/**
 * Builds a logger whose lines are captured into an array for assertions.
 *
 * @returns The logger and the captured, parsed log entries.
 */
function capturingLogger() {
  const lines: Array<Record<string, unknown>> = [];
  const logger = createLogger({ service: 'api' }, (line) =>
    lines.push(JSON.parse(line)),
  );
  return { logger, lines };
}

describe('createLogger', () => {
  it('emits level, message and merged base fields', () => {
    const { logger, lines } = capturingLogger();
    logger.info('project saved', { projectId: 'p1' });
    expect(lines[0]).toMatchObject({
      level: 'info',
      message: 'project saved',
      service: 'api',
      projectId: 'p1',
    });
  });

  it('redacts secrets and masks emails in log fields', () => {
    const { logger, lines } = capturingLogger();
    logger.warn('login', {
      password: 'hunter2',
      apiKey: 'k',
      email: 'anna@example.com',
    });
    expect(lines[0].password).toBe('[REDACTED]');
    expect(lines[0].apiKey).toBe('[REDACTED]');
    expect(lines[0].email).toBe('a***@example.com');
  });

  it('propagates base fields to child loggers', () => {
    const { logger, lines } = capturingLogger();
    logger.child({ correlationId: 'c1' }).error('boom');
    expect(lines[0]).toMatchObject({
      service: 'api',
      correlationId: 'c1',
      level: 'error',
    });
  });
});

describe('redact', () => {
  it('redacts nested secret keys and manuscripts', () => {
    const out = redact({
      nested: { token: 't', manuscript: 'long text' },
    }) as Record<string, { token: string; manuscript: string }>;
    expect(out.nested.token).toBe('[REDACTED]');
    expect(out.nested.manuscript).toBe('[REDACTED]');
  });
});
