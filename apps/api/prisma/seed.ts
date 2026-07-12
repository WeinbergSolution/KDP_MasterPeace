import { createHash } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

// Deterministic demo seeds (WP-B5) for DE/EN/ES. Stable ids + upserts make the
// seed idempotent and safe to re-run. No real personal data (AGENTS.md §9.2).

const prisma = new PrismaClient();

const DEMO_ORG_ID = 'org-demo-personal';

interface LanguageSeed {
  readonly locale: string;
  readonly projectId: string;
  readonly bookId: string;
  readonly versionId: string;
  readonly documentId: string;
  readonly title: string;
}

const LANGUAGES: LanguageSeed[] = [
  {
    locale: 'de',
    projectId: 'proj-demo-de',
    bookId: 'book-demo-de',
    versionId: 'ver-demo-de-1',
    documentId: 'doc-demo-de',
    title: 'Wieder bei dir ankommen',
  },
  {
    locale: 'en',
    projectId: 'proj-demo-en',
    bookId: 'book-demo-en',
    versionId: 'ver-demo-en-1',
    documentId: 'doc-demo-en',
    title: 'Coming Home to Yourself',
  },
  {
    locale: 'es',
    projectId: 'proj-demo-es',
    bookId: 'book-demo-es',
    versionId: 'ver-demo-es-1',
    documentId: 'doc-demo-es',
    title: 'Volver a ti misma',
  },
];

/**
 * Builds a minimal, deterministic Book AST for a demo project.
 *
 * @param locale The book language.
 * @param title The chapter title.
 * @returns A minimal book document object.
 */
function buildDemoDocument(locale: string, title: string) {
  return {
    schemaVersion: 1,
    language: locale,
    root: {
      id: `root-${locale}`,
      type: 'book',
      children: [
        { id: `chapter-${locale}`, type: 'chapter', attrs: { title } },
      ],
    },
  };
}

/**
 * Ensures the shared demo organization exists.
 *
 * @returns A promise that resolves when the organization is upserted.
 */
async function seedOrganization(): Promise<void> {
  await prisma.organization.upsert({
    where: { id: DEMO_ORG_ID },
    update: {},
    create: { id: DEMO_ORG_ID, name: 'Demo (Personal)', kind: 'personal' },
  });
}

/**
 * Upserts the project and its book for one demo language.
 *
 * @param seed The language seed descriptor.
 * @returns A promise resolving when project and book exist.
 */
async function seedProjectAndBook(seed: LanguageSeed): Promise<void> {
  await prisma.project.upsert({
    where: { id: seed.projectId },
    update: {},
    create: {
      id: seed.projectId,
      orgId: DEMO_ORG_ID,
      name: seed.title,
      contentLocale: seed.locale,
      marketLocale: seed.locale,
      demoMode: true,
    },
  });
  await prisma.book.upsert({
    where: { id: seed.bookId },
    update: {},
    create: {
      id: seed.bookId,
      projectId: seed.projectId,
      workingTitle: seed.title,
      formatProfile: 'workbook',
    },
  });
}

/**
 * Upserts the first immutable version and its document for one language.
 *
 * @param seed The language seed descriptor.
 * @returns A promise resolving when version and document exist.
 */
async function seedVersion(seed: LanguageSeed): Promise<void> {
  const document = buildDemoDocument(seed.locale, seed.title);
  const astHash = createHash('sha256')
    .update(JSON.stringify(document))
    .digest('hex');
  await prisma.bookVersion.upsert({
    where: { id: seed.versionId },
    update: {},
    create: {
      id: seed.versionId,
      bookId: seed.bookId,
      versionNumber: 1,
      label: 'autosave',
      etag: 'W/"1"',
      createdBy: 'seed',
    },
  });
  await prisma.bookDocument.upsert({
    where: { bookVersionId: seed.versionId },
    update: { astHash, ast: document },
    create: {
      id: seed.documentId,
      bookVersionId: seed.versionId,
      schemaVersion: 1,
      astHash,
      ast: document,
    },
  });
}

/**
 * Seeds the demo organization and one project/book/version per language.
 *
 * @returns A promise resolving when all demo data is upserted.
 */
async function main(): Promise<void> {
  await seedOrganization();
  for (const seed of LANGUAGES) {
    await seedProjectAndBook(seed);
    await seedVersion(seed);
  }
  process.stdout.write(
    `seeded org + ${LANGUAGES.length} demo projects (de/en/es)\n`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    await prisma.$disconnect();
    process.exitCode = 1;
    throw error;
  });
