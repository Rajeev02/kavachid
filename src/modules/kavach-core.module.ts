import { Module, DynamicModule } from '@nestjs/common';
import { KAVACH_CORE_OPTIONS, KavachCoreModuleOptions } from './kavach-core.options';
import { KavachConfigModule } from './kavach-config.module';
import { DatabaseModule } from './database/database.module';
import { TenantModule } from './tenant/tenant.module';
import { CryptoModule } from './crypto/crypto.module';
import { OutboxModule } from './outbox/outbox.module';
import { UserModule } from './user/user.module';
import { KeyPairModule } from './keypair/keypair.module';
import { SessionModule } from './session/session.module';
import { AuthModule } from './auth/auth.module';
import { RoleModule } from './role/role.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { AdminModule } from './admin/admin.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaThrottlerStorage } from './database/prisma-throttler.storage';
import { PrismaService } from './database/prisma.service';
import { ThreatDetectionModule } from './threat-detection/threat-detection.module';
import { FederationModule } from './federation/federation.module';

@Module({})
export class KavachCoreModule {
  static forRoot(options?: KavachCoreModuleOptions): DynamicModule {
    const optionsProvider = {
      provide: KAVACH_CORE_OPTIONS,
      useValue: options || null,
    };

    return {
      module: KavachCoreModule,
      imports: [
        KavachConfigModule,
        DatabaseModule,
        TenantModule,
        CryptoModule,
        OutboxModule,
        UserModule,
        KeyPairModule,
        SessionModule,
        AuthModule,
        RoleModule,
        AuditLogModule,
        AdminModule,
        ThreatDetectionModule,
        FederationModule,
        ScheduleModule.forRoot(),
        ThrottlerModule.forRootAsync({
          imports: [DatabaseModule],
          inject: [PrismaService],
          useFactory: (prisma: PrismaService) => ({
            throttlers: [{ ttl: 60000, limit: 5 }],
            storage: new PrismaThrottlerStorage(prisma),
          }),
        }),
      ],
      providers: [optionsProvider],
      exports: [
        KavachConfigModule,
        DatabaseModule,
        TenantModule,
        CryptoModule,
        OutboxModule,
        UserModule,
        KeyPairModule,
        SessionModule,
        AuthModule,
        RoleModule,
        AuditLogModule,
        AdminModule,
        ThreatDetectionModule,
        FederationModule,
        ThrottlerModule,
      ],
    };
  }
}
