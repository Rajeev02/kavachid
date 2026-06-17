import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../../src/modules/auth/auth.guard';
import { PermissionsGuard } from '../../../src/modules/auth/permissions.guard';
import { TenantGuard } from '../../../src/modules/tenant/tenant.guard';
import { RequirePermissions } from '../../../src/modules/auth/permissions.decorator';
import { Audit } from '../../../src/modules/audit-log/audit.decorator';

@Controller('resource')
@UseGuards(TenantGuard, AuthGuard, PermissionsGuard)
export class ResourceController {

  @Get('public-info')
  async getPublicInfo() {
    return {
      message: 'This endpoint requires a valid tenant and session context, but no specific permission.',
      status: 'authenticated',
    };
  }

  @Get('sensitive-data')
  @RequirePermissions({ resource: 'reports', action: 'view' })
  @Audit({ action: 'resource.view_sensitive', resourceType: 'reports' })
  async getSensitiveData() {
    return {
      message: 'Access granted! You possess the required reports:view permission.',
      data: [
        { id: 1, metric: 'SSO Sign-Ins', value: 1450 },
        { id: 2, metric: 'Threat blocks', value: 89 }
      ]
    };
  }
}
