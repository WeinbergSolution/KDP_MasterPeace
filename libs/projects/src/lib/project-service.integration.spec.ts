import { describe, expect, it } from 'vitest';
import type { BookDocument } from '@kdp/contracts';
import { ProjectService } from './project-service.js';
import { InMemoryProjectVersionRepository } from './project-repository.js';
import { VersionConflictError } from './project-version.js';

/**
 * Builds a minimal valid book document for persistence tests.
 *
 * @param title The chapter title to embed (varies content/hash).
 * @returns A book document with a single chapter.
 */
function bookWith(title: string): BookDocument {
  return {
    schemaVersion: 1,
    language: 'de',
    root: {
      id: 'root',
      type: 'book',
      children: [{ id: 'c1', type: 'chapter', attrs: { title } }],
    },
  };
}

describe('ProjectService persistence (integration)', () => {
  it('saves the first version, then loads it back', async () => {
    const service = new ProjectService(new InMemoryProjectVersionRepository());
    const saved = await service.saveVersion('p1', bookWith('Intro'), null);
    const head = await service.loadHead('p1');
    expect(saved.versionNumber).toBe(1);
    expect(head?.etag).toBe(saved.etag);
    expect(head?.astHash).toHaveLength(64);
  });

  it('increments the version and ETag on a valid consecutive save', async () => {
    const service = new ProjectService(new InMemoryProjectVersionRepository());
    const v1 = await service.saveVersion('p1', bookWith('A'), null);
    const v2 = await service.saveVersion(
      'p1',
      bookWith('B'),
      v1.etag,
      'snapshot',
    );
    expect(v2.versionNumber).toBe(2);
    expect(v2.etag).not.toBe(v1.etag);
  });

  it('rejects a stale save (two-tab conflict) with VersionConflictError', async () => {
    const service = new ProjectService(new InMemoryProjectVersionRepository());
    const v1 = await service.saveVersion('p1', bookWith('A'), null);
    await service.saveVersion('p1', bookWith('B'), v1.etag); // tab 1 wins
    // tab 2 still holds v1.etag as its base -> must conflict, not overwrite.
    await expect(
      service.saveVersion('p1', bookWith('C'), v1.etag),
    ).rejects.toBeInstanceOf(VersionConflictError);
  });

  it('rejects a first save that claims a non-null base ETag', async () => {
    const service = new ProjectService(new InMemoryProjectVersionRepository());
    await expect(
      service.saveVersion('p1', bookWith('A'), 'W/"1"'),
    ).rejects.toBeInstanceOf(VersionConflictError);
  });
});
