// Application-level persistence errors. Adapters translate infrastructure errors
// (e.g. Prisma/Postgres codes) into these so callers never see ORM details
// (AGENTS.md §8: no leaked adapter internals, no silently swallowed errors).

/** A generic, non-conflict persistence failure with a stable cause. */
export class PersistenceError extends Error {
  /**
   * @param message Human-readable description of the failure.
   * @param cause The underlying error, preserved for logging.
   */
  constructor(
    message: string,
    override readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'PersistenceError';
  }
}

/** Raised when an operation crosses an organization (tenant) boundary. */
export class TenantIsolationError extends Error {
  /**
   * @param projectId The project whose access was denied.
   */
  constructor(readonly projectId: string) {
    super(`project ${projectId} is not accessible in this organization`);
    this.name = 'TenantIsolationError';
  }
}
