import { Module } from '@nestjs/common';

/**
 * Root worker module. BullMQ consumers (generation, export, validation) are
 * registered here as their processors land in later work packages.
 */
@Module({})
export class AppModule {}
