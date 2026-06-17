import { Inject, Injectable, Optional } from '@nestjs/common';
import { KAVACH_CORE_OPTIONS, KavachCoreModuleOptions } from './kavach-core.options';

@Injectable()
export class KavachConfigService {
  constructor(
    @Optional()
    @Inject(KAVACH_CORE_OPTIONS)
    private readonly options: KavachCoreModuleOptions | null,
  ) {}

  get databaseUrl(): string {
    return this.options?.databaseUrl || process.env.DATABASE_URL || '';
  }

  get masterKey(): string {
    return this.options?.masterKey || process.env.KAVACHID_MASTER_KEY || 'default-kavachid-master-key-must-change-32bytes';
  }

  get webhookUrl(): string {
    return this.options?.webhookUrl || process.env.WEBHOOK_URL || 'http://localhost:3000/webhook';
  }

  get accessTokenExpiresIn(): string {
    return this.options?.accessTokenExpiresIn || process.env.JWT_ACCESS_EXPIRES_IN || '15m';
  }

  get refreshTokenExpiresIn(): string {
    return this.options?.refreshTokenExpiresIn || process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  }
}
