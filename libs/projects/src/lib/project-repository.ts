import type { StoredProjectVersion } from './project-version.js';

// Persistence port for project versions. Production uses a Prisma-backed adapter
// (apps/api); tests and the demo mode use the in-memory adapter below. Keeping
// the port here lets the concurrency logic be tested without a live database.

/** Port for appending and reading immutable project versions. */
export interface ProjectVersionRepository {
  loadHead(projectId: string): Promise<StoredProjectVersion | null>;
  append(version: StoredProjectVersion): Promise<void>;
}

/** In-memory {@link ProjectVersionRepository} for tests and demo projects. */
export class InMemoryProjectVersionRepository implements ProjectVersionRepository {
  private readonly versions = new Map<string, StoredProjectVersion[]>();

  /**
   * Returns the latest stored version of a project, or null if none exists.
   *
   * @param projectId The project's id.
   * @returns The head version or null.
   */
  async loadHead(projectId: string): Promise<StoredProjectVersion | null> {
    const list = this.versions.get(projectId);
    return list && list.length > 0 ? list[list.length - 1] : null;
  }

  /**
   * Appends a new immutable version to a project's history.
   *
   * @param version The version to append.
   */
  async append(version: StoredProjectVersion): Promise<void> {
    const list = this.versions.get(version.projectId) ?? [];
    list.push(version);
    this.versions.set(version.projectId, list);
  }
}
