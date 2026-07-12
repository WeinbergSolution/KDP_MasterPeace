import { Module } from '@nestjs/common';
import {
  InMemoryProjectVersionRepository,
  ProjectService,
} from '@kdp/projects';
import { ProjectsController } from './projects.controller';

// Wires the ProjectService with an in-memory repository for the skeleton/demo.
// The Prisma-backed adapter (apps/api, schema.prisma) replaces the repository
// provider in a follow-up WP without touching the controller or service.

/** Provides project persistence endpoints. */
@Module({
  controllers: [ProjectsController],
  providers: [
    {
      provide: ProjectService,
      useFactory: () =>
        new ProjectService(new InMemoryProjectVersionRepository()),
    },
  ],
})
export class ProjectsModule {}
