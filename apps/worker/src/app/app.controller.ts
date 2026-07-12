import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Placeholder for getData; replaced by its work package
   * (see docs/roadmap/production-roadmap.md).
   *
   * @returns The value produced by this placeholder.
   */
  @Get()
  getData() {
    return this.appService.getData();
  }
}
