import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips any properties not in the DTO
      forbidNonWhitelisted: true, // throws error if extra properties are sent
      transform: true, // automatically transforms payloads to DTO instances
    }),
  );

  app.enableCors({
    origin: process.env.FRONTEND_URL, // use your frontend URL from .env
    credentials: true, // if you want to allow cookies/auth
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`Server running on port ${port}, CORS allowed for ${process.env.FRONTEND_URL}`);
}

bootstrap();
