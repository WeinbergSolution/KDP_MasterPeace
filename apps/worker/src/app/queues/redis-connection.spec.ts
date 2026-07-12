import { buildRedisConnection } from './redis-connection';

describe('buildRedisConnection', () => {
  it('defaults to localhost:6379 when no URL is given', () => {
    expect(buildRedisConnection()).toEqual({ host: 'localhost', port: 6379 });
  });

  it('parses host and port from a REDIS_URL', () => {
    expect(buildRedisConnection('redis://cache.internal:6380')).toEqual({
      host: 'cache.internal',
      port: 6380,
    });
  });
});
