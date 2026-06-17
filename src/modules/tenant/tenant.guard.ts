import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import { TenantContext } from './tenant.context';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly tenantContext: TenantContext) {}

  canActivate(context: ExecutionContext): boolean {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      throw new BadRequestException('x-tenant-id header or tenant route prefix is required');
    }
    return true;
  }
}
