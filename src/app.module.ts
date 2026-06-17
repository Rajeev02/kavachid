import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './modules/database/database.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { CryptoModule } from './modules/crypto/crypto.module';
import { OutboxModule } from './modules/outbox/outbox.module';
import { UserModule } from './modules/user/user.module';
import { KeyPairModule } from './modules/keypair/keypair.module';
import { SessionModule } from './modules/session/session.module';
import { AuthModule } from './modules/auth/auth.module';
import { RoleModule } from './modules/role/role.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    TenantModule,
    CryptoModule,
    OutboxModule,
    UserModule,
    KeyPairModule,
    SessionModule,
    AuthModule,
    RoleModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
