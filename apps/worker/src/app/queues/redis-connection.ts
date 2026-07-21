import { Queue } from 'bullmq';
import type { QueueName } from './queue-names';

// BullMQ/Redis connection wiring (ADR-0008). The connection is derived from the
// validated REDIS_URL; queues are created lazily at runtime so importing this
// module (build/test) never opens a socket.

/** Host/port connection options for BullMQ's Redis client. */
export interface RedisConnection {
  readonly host: string;
  readonly port: number;
}

/**
 * Parses a Redis URL into BullMQ connection options, defaulting to localhost.
 *
 * @param redisUrl The REDIS_URL from the validated environment (optional).
 * @returns The host/port connection options.
 */
export function buildRedisConnection(redisUrl?: string): RedisConnection {
  const url = new URL(redisUrl ?? 'redis://localhost:6379');
  return { host: url.hostname, port: Number(url.port) || 6379 };
}

/**
 * Creates a BullMQ queue for a given name and connection (runtime only).
 *
 * @param name The queue name.
 * @param connection The Redis connection options.
 * @returns A BullMQ Queue instance.
 */
export function createQueue(
  name: QueueName,
  connection: RedisConnection,
): Queue {
  return new Queue(name, { connection });
}
