import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  Put,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BookDocumentSchema, type BookDocument } from '@kdp/contracts';
import {
  ProjectService,
  StoredProjectVersion,
  VersionConflictError,
} from '@kdp/projects';

/** REST endpoints for reading and versioning a project's head document. */
@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  /**
   * @param service The project persistence service.
   */
  constructor(private readonly service: ProjectService) {}

  /**
   * Returns the current head version of a project.
   *
   * @param id The project id.
   * @returns The head version.
   * @throws {NotFoundException} When the project has no versions.
   */
  @Get(':id/head')
  async getHead(@Param('id') id: string): Promise<StoredProjectVersion> {
    const head = await this.service.loadHead(id);
    if (!head) throw new NotFoundException('project has no versions');
    return head;
  }

  /**
   * Saves a new head version, guarded by the `If-Match` ETag.
   *
   * @param id The project id.
   * @param ifMatch The base ETag the client edited from (null for a new project).
   * @param body The new book document.
   * @returns The newly stored version.
   * @throws {ConflictException} When the ETag is stale (409).
   */
  @Put(':id/head')
  async putHead(
    @Param('id') id: string,
    @Headers('if-match') ifMatch: string | undefined,
    @Body() body: unknown,
  ): Promise<StoredProjectVersion> {
    const document = this.parseDocument(body);
    return this.saveGuarded(id, document, ifMatch ?? null);
  }

  /**
   * Validates a request body against the Book AST schema.
   *
   * @param body The raw request body.
   * @returns The validated book document.
   * @throws {BadRequestException} When the body is not a valid book document.
   */
  private parseDocument(body: unknown): BookDocument {
    const result = BookDocumentSchema.safeParse(body);
    if (!result.success) throw new BadRequestException('invalid book document');
    return result.data;
  }

  /**
   * Saves a version, translating a version conflict into HTTP 409.
   *
   * @param id The project id.
   * @param document The validated book document.
   * @param baseEtag The base ETag from the client.
   * @returns The newly stored version.
   * @throws {ConflictException} When the base ETag is stale.
   */
  private async saveGuarded(
    id: string,
    document: BookDocument,
    baseEtag: string | null,
  ): Promise<StoredProjectVersion> {
    try {
      return await this.service.saveVersion(id, document, baseEtag);
    } catch (error) {
      if (error instanceof VersionConflictError)
        throw new ConflictException(error.message);
      throw error;
    }
  }
}
