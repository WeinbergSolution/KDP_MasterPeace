import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { ProjectsModule } from './projects/projects.module';

/** Root API module: health probes and project persistence. */
@Module({
  imports: [ProjectsModule],
  controllers: [HealthController],
})
export class AppModule {}
