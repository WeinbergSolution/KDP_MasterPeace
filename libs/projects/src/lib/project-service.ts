import type { BookDocument } from '@kdp/contracts';
import type { ProjectVersionRepository } from './project-repository.js';
import {
  computeAstHash,
  etagForVersion,
  StoredProjectVersion,
  VersionConflictError,
} from './project-version.js';

// Project persistence service with optimistic concurrency. A save must supply
// the ETag it edited from; if the head has moved on, the save is rejected with
// a VersionConflictError instead of silently overwriting (data-model.md §4.2).

/** Label describing why a version was created. */
export type VersionLabel = StoredProjectVersion['label'];

/** Coordinates immutable, ETag-guarded project version persistence. */
export class ProjectService {
  /**
   * @param repository The version persistence port.
   */
  constructor(private readonly repository: ProjectVersionRepository) {}

  /**
   * Loads the current head version of a project.
   *
   * @param projectId The project's id.
   * @returns The head version, or null when the project has no versions yet.
   */
  async loadHead(projectId: string): Promise<StoredProjectVersion | null> {
    return this.repository.loadHead(projectId);
  }

  /**
   * Saves a new version, guarded by the base ETag the edit started from.
   *
   * @param projectId The project's id.
   * @param document The new book document to persist.
   * @param baseEtag The head ETag the client edited from (null for a new project).
   * @param label The reason this version is created (defaults to 'autosave').
   * @returns The newly stored version.
   * @throws {VersionConflictError} When baseEtag does not match the current head.
   */
  async saveVersion(
    projectId: string,
    document: BookDocument,
    baseEtag: string | null,
    label: VersionLabel = 'autosave',
  ): Promise<StoredProjectVersion> {
    const head = await this.repository.loadHead(projectId);
    const currentEtag = head ? head.etag : null;
    if (baseEtag !== currentEtag)
      throw new VersionConflictError(baseEtag, currentEtag);
    const version = this.buildVersion(projectId, document, head, label);
    await this.repository.append(version);
    return version;
  }

  /**
   * Builds the next immutable version record for a project.
   *
   * @param projectId The project's id.
   * @param document The new book document.
   * @param head The current head version, or null for the first version.
   * @param label The version label.
   * @returns The next version record.
   */
  private buildVersion(
    projectId: string,
    document: BookDocument,
    head: StoredProjectVersion | null,
    label: VersionLabel,
  ): StoredProjectVersion {
    const versionNumber = (head?.versionNumber ?? 0) + 1;
    return {
      projectId,
      versionNumber,
      etag: etagForVersion(versionNumber),
      astHash: computeAstHash(document),
      label,
      document,
    };
  }
}
