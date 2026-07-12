import { createHash } from 'node:crypto';
import type { BookDocument } from '@kdp/contracts';

// Project versioning domain types (data-model.md §2). Every save creates a new
// immutable version; optimistic concurrency uses an ETag so two tabs cannot
// silently overwrite each other (fixes legacy finding N15/P10).

/** A stored, immutable book version with its concurrency ETag. */
export interface StoredProjectVersion {
  readonly projectId: string;
  readonly versionNumber: number;
  readonly etag: string;
  readonly astHash: string;
  readonly label: 'autosave' | 'snapshot' | 'pre-repair' | 'export';
  readonly document: BookDocument;
}

/** Thrown when a save is attempted against a stale base ETag. */
export class VersionConflictError extends Error {
  /**
   * @param expectedEtag The ETag the client based its edit on.
   * @param actualEtag The current head ETag on the server.
   */
  constructor(
    readonly expectedEtag: string | null,
    readonly actualEtag: string | null,
  ) {
    super(`version conflict: expected ${expectedEtag}, actual ${actualEtag}`);
    this.name = 'VersionConflictError';
  }
}

/**
 * Computes a stable content hash of a book document (canonical JSON, sha256).
 *
 * @param document The book document to hash.
 * @returns A hex-encoded sha256 digest of the document.
 */
export function computeAstHash(document: BookDocument): string {
  return createHash('sha256').update(JSON.stringify(document)).digest('hex');
}

/**
 * Derives the concurrency ETag for a version number (weak validator form).
 *
 * @param versionNumber The version's sequential number.
 * @returns The ETag string, e.g. `W/"3"`.
 */
export function etagForVersion(versionNumber: number): string {
  return `W/"${versionNumber}"`;
}
