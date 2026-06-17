import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

@Injectable()
export class TenantContext {
  private static readonly storage = new AsyncLocalStorage<{ tenantId: string }>();

  run(tenantId: string, callback: () => any) {
    return TenantContext.storage.run({ tenantId }, callback);
  }

  getTenantId(): string | undefined {
    return TenantContext.storage.getStore()?.tenantId;
  }

  getRequiredTenantId(): string {
    const tenantId = this.getTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is missing in this execution path');
    }
    return tenantId;
  }
}
