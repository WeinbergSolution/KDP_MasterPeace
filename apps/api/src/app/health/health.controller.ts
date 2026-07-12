import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

/** Liveness/readiness endpoints for the API. */
@ApiTags('health')
@Controller('health')
export class HealthController {
  /**
   * Liveness probe.
   *
   * @returns The service status payload.
   */
  @Get()
  getHealth(): { status: string } {
    return { status: 'ok' };
  }
}
