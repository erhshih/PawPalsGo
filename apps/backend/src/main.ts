import * as dotenv from 'dotenv';
const nodeEnv = process.env.NODE_ENV ?? 'dev';
dotenv.config({ path: `.env.${nodeEnv}` }); // 環境特定設定（優先）
dotenv.config({ path: '.env' });             // 基礎預設值（fallback）
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { join } from 'path';
import { mkdirSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  app.enableCors({ origin: true, credentials: true });

  mkdirSync(join(process.cwd(), 'uploads', 'avatars'), { recursive: true });
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`Backend running on http://localhost:${port}`);
}
bootstrap();
