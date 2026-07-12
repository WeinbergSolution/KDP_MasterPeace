import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';

// ProjectService is provided globally by PersistenceModule.forRoot() (adapter
// chosen by configuration), so this module only wires the HTTP surface.

/** Exposes the project persistence endpoints. */
@Module({
  controllers: [ProjectsController],
})
export class ProjectsModule {}
