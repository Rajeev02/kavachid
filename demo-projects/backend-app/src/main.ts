import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('KavachID_Demo_Backend');
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend clients
  app.enableCors();
  
  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`KavachID Demo Backend is running on: http://localhost:${port}`);
}
bootstrap();
