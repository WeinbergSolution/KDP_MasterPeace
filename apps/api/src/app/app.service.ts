import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  /**
   * Placeholder for getData; replaced by its work package
   * (see docs/roadmap/production-roadmap.md).
   *
   * @returns The value produced by this placeholder.
   */
  getData(): { message: string } {
    return { message: 'Hello API' };
  }
}
