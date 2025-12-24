import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // strips any properties not in the DTO
    forbidNonWhitelisted: true, // throws error if extra properties are sent
    transform: true, // automatically transforms payloads to DTO instances

  }))
  app.enableCors();
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
