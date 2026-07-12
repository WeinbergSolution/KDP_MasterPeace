import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { PersistenceModule } from './persistence/persistence.module';
import { ProjectsModule } from './projects/projects.module';

/** Root API module: health probes, persistence and project endpoints. */
@Module({
  imports: [PersistenceModule.forRoot(), ProjectsModule],
  controllers: [HealthController],
})
export class AppModule {}
