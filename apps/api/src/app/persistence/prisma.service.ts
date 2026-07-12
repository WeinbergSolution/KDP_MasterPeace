import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/** Nest-managed Prisma client that connects on init and disconnects on destroy. */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * Opens the database connection when the module starts.
   *
   * @returns A promise that resolves once connected.
   */
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  /**
   * Closes the database connection when the module shuts down.
   *
   * @returns A promise that resolves once disconnected.
   */
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
