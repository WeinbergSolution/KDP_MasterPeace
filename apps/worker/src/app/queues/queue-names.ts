// BullMQ queue names for the worker (target-architecture.md §5). Generation,
// export and validation jobs run on separate queues so they scale and fail
// independently.

/** The BullMQ queues consumed by the worker. */
export const QUEUE_NAMES = ['generation', 'export', 'validation'] as const;

/** A single BullMQ queue name. */
export type QueueName = (typeof QUEUE_NAMES)[number];
