import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import EmbeddedPostgres from 'embedded-postgres';
import { PrismaClient } from '@prisma/client';
import type { BookDocument } from '@kdp/contracts';
import {
  PersistenceError,
  ProjectService,
  TenantIsolationError,
  VersionConflictError,
} from '@kdp/projects';
import { PrismaProjectRepository } from './prisma-project.repository.js';

// Real PostgreSQL integration test (WP-B5 / DEV-007). Uses the CI-provided
// DATABASE_URL when present, otherwise spins up a disposable embedded Postgres.
// It never falls back to the in-memory adapter: if the DB is unavailable the
// beforeAll hook throws and the suite fails.

const repoRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../..',
);
const schemaPath = join(repoRoot, 'apps/api/prisma/schema.prisma');
const dbDir = join(tmpdir(), 'kdp-pg-integration');

let embedded: EmbeddedPostgres | undefined;
let prisma: PrismaClient;

const bookWith = (title: string): BookDocument => ({
  schemaVersion: 1,
  language: 'de',
  root: {
    id: 'root',
    type: 'book',
    children: [{ id: 'c1', type: 'chapter', attrs: { title } }],
  },
});

async function startEmbedded(): Promise<string> {
  rmSync(dbDir, { recursive: true, force: true });
  embedded = new EmbeddedPostgres({
    databaseDir: dbDir,
    user: 'postgres',
    password: 'postgres',
    port: 5433,
    persistent: false,
  });
  await embedded.initialise();
  await embedded.start();
  await embedded.createDatabase('kdp_test');
  return 'postgresql://postgres:postgres@127.0.0.1:5433/kdp_test';
}

async function provisionDatabase(): Promise<string> {
  const url = process.env['DATABASE_URL'] ?? (await startEmbedded());
  process.env['DATABASE_URL'] = url;
  execSync(`npx prisma migrate deploy --schema "${schemaPath}"`, {
    cwd: repoRoot,
    env: process.env,
    stdio: 'pipe',
  });
  return url;
}

beforeAll(async () => {
  const url = await provisionDatabase();
  prisma = new PrismaClient({ datasources: { db: { url } } });
  await prisma.$connect();
  await prisma.organization.createMany({
    data: [
      { id: 'org-a', name: 'Org A', kind: 'personal' },
      { id: 'org-b', name: 'Org B', kind: 'personal' },
    ],
  });
}, 240000);

afterAll(async () => {
  await prisma?.$disconnect();
  await embedded?.stop();
}, 60000);

describe('PrismaProjectRepository (real PostgreSQL)', () => {
  const repoA = () => new PrismaProjectRepository(prisma, 'org-a');
  const serviceA = () => new ProjectService(repoA());

  it('creates a project and loads it back (assertions 1 + 2)', async () => {
    await repoA().createProject({
      id: 'p1',
      name: 'Demo',
      contentLocale: 'de',
      marketLocale: 'de',
    });
    const loaded = await repoA().getProject('p1');
    expect(loaded?.id).toBe('p1');
    expect(loaded?.orgId).toBe('org-a');
  });

  it('saves consecutive versions with a valid ETag (assertion 3)', async () => {
    const v1 = await serviceA().saveVersion('p1', bookWith('A'), null);
    const v2 = await serviceA().saveVersion(
      'p1',
      bookWith('B'),
      v1.etag,
      'snapshot',
    );
    expect(v1.versionNumber).toBe(1);
    expect(v2.versionNumber).toBe(2);
  });

  it('rejects a stale ETag with a version conflict (assertions 4 + 5)', async () => {
    await expect(
      serviceA().saveVersion('p1', bookWith('C'), 'W/"1"'),
    ).rejects.toBeInstanceOf(VersionConflictError);
  });

  it('reloads persisted data through a fresh repository instance (assertion 6)', async () => {
    const head = await new PrismaProjectRepository(prisma, 'org-a').loadHead(
      'p1',
    );
    expect(head?.versionNumber).toBe(2);
    expect(head?.document.root.children?.[0]?.attrs?.['title']).toBe('B');
    expect(head?.astHash).toHaveLength(64);
  });

  it('enforces the organization boundary (assertion 7)', async () => {
    const repoB = new PrismaProjectRepository(prisma, 'org-b');
    expect(await repoB.getProject('p1')).toBeNull();
    expect(await repoB.loadHead('p1')).toBeNull();
    await expect(
      repoB.append({
        projectId: 'p1',
        versionNumber: 3,
        etag: 'W/"3"',
        astHash: 'x',
        label: 'autosave',
        document: bookWith('X'),
      }),
    ).rejects.toBeInstanceOf(TenantIsolationError);
  });

  it('rolls back a failed create transaction (assertion 8)', async () => {
    await repoA().createProject({
      id: 'owner',
      name: 'Owner',
      contentLocale: 'de',
      marketLocale: 'de',
    });
    // Pre-occupy the deterministic book id `book_rollback` so the second write fails.
    await prisma.book.create({
      data: {
        id: 'book_rollback',
        projectId: 'owner',
        workingTitle: 'squat',
        formatProfile: 'workbook',
      },
    });
    await expect(
      repoA().createProject({
        id: 'rollback',
        name: 'R',
        contentLocale: 'de',
        marketLocale: 'de',
      }),
    ).rejects.toBeInstanceOf(PersistenceError);
    expect(
      await prisma.project.findUnique({ where: { id: 'rollback' } }),
    ).toBeNull();
  });
});
