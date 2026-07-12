import { randomUUID } from 'node:crypto';
import { Prisma, PrismaClient } from '@prisma/client';
import type { BookDocument } from '@kdp/contracts';
import {
  PersistenceError,
  TenantIsolationError,
  VersionConflictError,
  type NewProject,
  type ProjectStore,
  type ProjectVersionRepository,
  type StoredProject,
  type StoredProjectVersion,
} from '@kdp/projects';
import { fromPrismaLabel, toPrismaLabel } from './label-mapping.js';

// Prisma-backed persistence adapter (ADR-0003). Organization-scoped for tenant
// isolation; writes run in transactions; the (bookId, versionNumber) unique
// constraint is the ultimate concurrency guard (P2002 -> VersionConflictError).
// No Prisma detail leaks past this file (domain sees only its own errors).

/** Organization-scoped Prisma implementation of the project persistence ports. */
export class PrismaProjectRepository
  implements ProjectVersionRepository, ProjectStore
{
  /**
   * @param prisma The Prisma client (or a transaction client).
   * @param orgId The organization scope enforced on every operation.
   */
  constructor(
    private readonly prisma: PrismaClient,
    private readonly orgId: string,
  ) {}

  /**
   * Creates a project and its book in a single transaction, within this org.
   *
   * @param input The new project fields (id generated when omitted).
   * @returns The stored project.
   */
  async createProject(input: NewProject): Promise<StoredProject> {
    const id = input.id ?? randomUUID();
    try {
      return await this.prisma.$transaction(async (tx) => {
        const project = await tx.project.create({
          data: this.projectData(id, input),
        });
        await tx.book.create({ data: this.bookData(id, input.name) });
        return this.toStoredProject(project);
      });
    } catch (error) {
      throw new PersistenceError('failed to create project', error);
    }
  }

  /**
   * Loads a project by id, but only when it belongs to this organization.
   *
   * @param projectId The project id.
   * @returns The stored project, or null when absent or out of scope.
   */
  async getProject(projectId: string): Promise<StoredProject | null> {
    const row = await this.prisma.project.findFirst({
      where: { id: projectId, orgId: this.orgId },
    });
    return row ? this.toStoredProject(row) : null;
  }

  /**
   * Loads the latest version (with its document) of a project in this org.
   *
   * @param projectId The project id.
   * @returns The head version, or null when none exists in scope.
   */
  async loadHead(projectId: string): Promise<StoredProjectVersion | null> {
    const book = await this.prisma.book.findFirst({
      where: { projectId, project: { orgId: this.orgId } },
    });
    if (!book) return null;
    const version = await this.prisma.bookVersion.findFirst({
      where: { bookId: book.id },
      orderBy: { versionNumber: 'desc' },
      include: { document: true },
    });
    if (!version || !version.document) return null;
    return this.toStoredVersion(
      projectId,
      version as unknown as VersionWithDocument,
    );
  }

  /**
   * Appends an immutable version and its document in one transaction. A unique
   * violation on (bookId, versionNumber) is translated to a version conflict.
   *
   * @param version The version to persist.
   * @throws {VersionConflictError} On a concurrent version-number collision.
   * @throws {TenantIsolationError} When the project is not in this org.
   * @throws {PersistenceError} On any other database failure.
   */
  async append(version: StoredProjectVersion): Promise<void> {
    const book = await this.requireBookInOrg(version.projectId);
    try {
      await this.prisma.$transaction(async (tx) => {
        const created = await tx.bookVersion.create({
          data: this.versionData(book.id, version),
        });
        await tx.bookDocument.create({
          data: this.documentData(created.id, version),
        });
      });
    } catch (error) {
      this.translateWriteError(error, version);
    }
  }

  /**
   * Deterministic book id derived from a project id (one book per project v1).
   *
   * @param projectId The owning project id.
   * @returns The derived book id.
   */
  private bookId(projectId: string): string {
    return `book_${projectId}`;
  }

  /**
   * Loads the book of a project scoped to this org, or fails with isolation.
   *
   * @param projectId The project id.
   * @returns The book row (id).
   * @throws {TenantIsolationError} When no in-scope book exists.
   */
  private async requireBookInOrg(projectId: string): Promise<{ id: string }> {
    const book = await this.prisma.book.findFirst({
      where: { projectId, project: { orgId: this.orgId } },
      select: { id: true },
    });
    if (!book) throw new TenantIsolationError(projectId);
    return book;
  }

  /**
   * Builds the Prisma create input for a project.
   *
   * @param id The project id.
   * @param input The new project fields.
   * @returns The Prisma project create data.
   */
  private projectData(
    id: string,
    input: NewProject,
  ): Prisma.ProjectUncheckedCreateInput {
    return {
      id,
      orgId: this.orgId,
      name: input.name,
      contentLocale: input.contentLocale,
      marketLocale: input.marketLocale,
      demoMode: input.demoMode ?? false,
    };
  }

  /**
   * Builds the Prisma create input for a project's book.
   *
   * @param projectId The owning project id.
   * @param title The working title.
   * @returns The Prisma book create data.
   */
  private bookData(
    projectId: string,
    title: string,
  ): Prisma.BookUncheckedCreateInput {
    return {
      id: this.bookId(projectId),
      projectId,
      workingTitle: title,
      formatProfile: 'workbook',
    };
  }

  /**
   * Builds the Prisma create input for a book version.
   *
   * @param bookId The owning book id.
   * @param version The domain version.
   * @returns The Prisma book-version create data.
   */
  private versionData(
    bookId: string,
    version: StoredProjectVersion,
  ): Prisma.BookVersionUncheckedCreateInput {
    return {
      bookId,
      versionNumber: version.versionNumber,
      label: toPrismaLabel(version.label),
      etag: version.etag,
      createdBy: 'api',
    };
  }

  /**
   * Builds the Prisma create input for a version's document.
   *
   * @param bookVersionId The owning book-version id.
   * @param version The domain version carrying the document.
   * @returns The Prisma book-document create data.
   */
  private documentData(
    bookVersionId: string,
    version: StoredProjectVersion,
  ): Prisma.BookDocumentUncheckedCreateInput {
    return {
      bookVersionId,
      schemaVersion: version.document.schemaVersion,
      astHash: version.astHash,
      ast: version.document as unknown as Prisma.InputJsonValue,
    };
  }

  /**
   * Maps a persisted project row to the domain shape.
   *
   * @param row The Prisma project row.
   * @returns The stored project.
   */
  private toStoredProject(row: {
    id: string;
    orgId: string;
    name: string;
    contentLocale: string;
    marketLocale: string;
    demoMode: boolean;
  }): StoredProject {
    return {
      id: row.id,
      orgId: row.orgId,
      name: row.name,
      contentLocale: row.contentLocale,
      marketLocale: row.marketLocale,
      demoMode: row.demoMode,
    };
  }

  /**
   * Maps a persisted version row (with document) to the domain shape.
   *
   * @param projectId The owning project id.
   * @param version The Prisma version row including its document.
   * @returns The stored project version.
   */
  private toStoredVersion(
    projectId: string,
    version: VersionWithDocument,
  ): StoredProjectVersion {
    return {
      projectId,
      versionNumber: version.versionNumber,
      etag: version.etag,
      astHash: version.document.astHash,
      label: fromPrismaLabel(version.label as never),
      document: version.document.ast as unknown as BookDocument,
    };
  }

  /**
   * Translates a write-path database error into a domain error.
   *
   * @param error The caught error.
   * @param version The version whose write failed.
   * @throws {VersionConflictError} On a unique-constraint (P2002) violation.
   * @throws {PersistenceError} On any other failure.
   */
  private translateWriteError(
    error: unknown,
    version: StoredProjectVersion,
  ): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new VersionConflictError(null, version.etag);
    }
    throw new PersistenceError('failed to append project version', error);
  }
}

/** A Prisma book-version row guaranteed to include its document. */
interface VersionWithDocument {
  versionNumber: number;
  etag: string;
  label: string;
  document: { astHash: string; ast: unknown };
}
