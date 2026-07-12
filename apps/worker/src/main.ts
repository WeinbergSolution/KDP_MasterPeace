import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { parseEnv } from '@kdp/contracts';
import { AppModule } from './app/app.module';
import { buildRedisConnection } from './app/queues/redis-connection';
import { QUEUE_NAMES } from './app/queues/queue-names';

async function bootstrap() {
  const env = parseEnv(process.env);
  const redis = buildRedisConnection(env.REDIS_URL);
  await NestFactory.createApplicationContext(AppModule);
  Logger.log(
    `Worker ready — Redis ${redis.host}:${redis.port}; queues: ${QUEUE_NAMES.join(', ')}`,
  );
}

bootstrap();
