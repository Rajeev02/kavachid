import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KavachCoreModule } from '../../../src/modules/kavach-core.module';
import { ResourceController } from './resource.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Dynamically register the local KavachCoreModule
    KavachCoreModule.forRoot({
      databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/kavachid?schema=public',
      masterKey: process.env.KAVACHID_MASTER_KEY || '0000000000000000000000000000000000000000000000000000000000000000',
      accessTokenExpiresIn: '15m',
      refreshTokenExpiresIn: '7d',
    }),
  ],
  controllers: [ResourceController],
})
export class AppModule {}
