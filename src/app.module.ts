import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './modules/database/database.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { CryptoModule } from './modules/crypto/crypto.module';
import { OutboxModule } from './modules/outbox/outbox.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    TenantModule,
    CryptoModule,
    OutboxModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
