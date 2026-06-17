import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { 
    cors: {
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      allowedHeaders: 'Content-Type, Accept, Authorization, x-tenant-id, x-device-id, x-device-fingerprint, dpop',
    }
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
