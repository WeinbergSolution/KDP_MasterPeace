import { DynamicModule, Module, Provider } from '@nestjs/common';
import { parseEnv } from '@kdp/contracts';
import {
  InMemoryProjectVersionRepository,
  ProjectService,
} from '@kdp/projects';
import { PrismaProjectRepository } from '@kdp/projects-prisma';
import { PrismaService } from './prisma.service.js';

// Selects the persistence adapter once, by configuration (DATABASE_URL), instead
// of scattering conditionals: Prisma for integration/production, in-memory for
// fast unit runs and the demo. Request-scoped org wiring lands with auth; until
// then the API operates within the demo organization.
const DEMO_ORG_ID = 'org-demo-personal';

/**
 * Provider that backs ProjectService with the org-scoped Prisma adapter.
 *
 * @returns A Nest provider building the Prisma-backed ProjectService.
 */
function prismaProjectService(): Provider {
  return {
    provide: ProjectService,
    inject: [PrismaService],
    useFactory: (prisma: PrismaService) =>
      new ProjectService(new PrismaProjectRepository(prisma, DEMO_ORG_ID)),
  };
}

/**
 * Provider that backs ProjectService with the in-memory adapter.
 *
 * @returns A Nest provider building the in-memory ProjectService.
 */
function inMemoryProjectService(): Provider {
  return {
    provide: ProjectService,
    useFactory: () =>
      new ProjectService(new InMemoryProjectVersionRepository()),
  };
}

/** Configures project persistence and exports a ready-to-use ProjectService. */
@Module({})
export class PersistenceModule {
  /**
   * Builds a global persistence module, choosing the adapter from configuration.
   *
   * @returns A dynamic module exporting the configured ProjectService.
   */
  static forRoot(): DynamicModule {
    const usePrisma = Boolean(parseEnv(process.env).DATABASE_URL);
    const providers = usePrisma
      ? [PrismaService, prismaProjectService()]
      : [inMemoryProjectService()];
    return {
      global: true,
      module: PersistenceModule,
      providers,
      exports: [ProjectService],
    };
  }
}
