import { describe, expect, it } from 'vitest';
import { parseEnv } from './env.js';

describe('parseEnv', () => {
  it('applies defaults for an empty environment', () => {
    const env = parseEnv({});
    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(3000);
    expect(env.DEMO_MODE).toBe(false);
    expect(env.LOG_LEVEL).toBe('info');
  });

  it('coerces PORT and DEMO_MODE from strings', () => {
    const env = parseEnv({ PORT: '8080', DEMO_MODE: 'true' });
    expect(env.PORT).toBe(8080);
    expect(env.DEMO_MODE).toBe(true);
  });

  it('fails fast on an invalid DATABASE_URL', () => {
    expect(() => parseEnv({ DATABASE_URL: 'not-a-url' })).toThrow(
      /DATABASE_URL/,
    );
  });

  it('rejects a too-short credential encryption key', () => {
    expect(() => parseEnv({ CREDENTIAL_ENC_KEY: 'short' })).toThrow(
      /CREDENTIAL_ENC_KEY/,
    );
  });

  it('accepts a valid full environment', () => {
    const env = parseEnv({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
      REDIS_URL: 'redis://localhost:6379',
      CREDENTIAL_ENC_KEY: 'x'.repeat(32),
    });
    expect(env.NODE_ENV).toBe('production');
    expect(env.DATABASE_URL).toContain('postgresql://');
  });
});
