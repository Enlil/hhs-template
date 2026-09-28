import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import type { AppConfig } from './config/configuration';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<AppConfig, true>);

  app.setGlobalPrefix('api');
  app.enableCors({ origin: configService.get('corsOrigin', { infer: true }) });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new AllExceptionsFilter());

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder().setTitle('{{projectName}} API').setVersion('0.1.0').build(),
  );
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get('port', { infer: true });
  await app.listen(port);
  console.log(`API listening on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/api/docs`);
}

void bootstrap();
