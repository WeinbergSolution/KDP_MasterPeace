import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { parseEnv } from '@kdp/contracts';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const env = parseEnv(process.env);
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  const config = new DocumentBuilder()
    .setTitle('KDP MasterPeace API')
    .setVersion('1.0')
    .build();
  SwaggerModule.setup(
    'api/docs',
    app,
    SwaggerModule.createDocument(app, config),
  );
  await app.listen(env.PORT);
  Logger.log(`API running on http://localhost:${env.PORT}/api`);
}

bootstrap();
