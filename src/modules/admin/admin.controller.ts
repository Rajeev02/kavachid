import { Controller, Get, Delete, Query, Param, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { TenantGuard } from '../tenant/tenant.guard';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { TenantContext } from '../tenant/tenant.context';
import { Audit } from '../audit-log/audit.decorator';

@Controller('admin')
@UseGuards(TenantGuard, AuthGuard, PermissionsGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly tenantContext: TenantContext,
  ) {}

  @Get('users')
  @RequirePermissions({ resource: 'users', action: 'read' })
  async listUsers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
  ) {
    const tenantId = this.tenantContext.getRequiredTenantId();
    return this.adminService.listUsers(
      tenantId,
      parseInt(page, 10),
      parseInt(limit, 10),
      search,
    );
  }

  @Get('sessions')
  @RequirePermissions({ resource: 'sessions', action: 'read' })
  async listSessions(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const tenantId = this.tenantContext.getRequiredTenantId();
    return this.adminService.listSessions(
      tenantId,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }

  @Delete('sessions/:id')
  @RequirePermissions({ resource: 'sessions', action: 'write' })
  @Audit({ action: 'admin.revoke_session', resourceType: 'session' })
  async revokeSession(@Param('id') id: string) {
    const tenantId = this.tenantContext.getRequiredTenantId();
    await this.adminService.revokeSession(tenantId, id);
    return { message: 'Session revoked successfully' };
  }

  @Get('audit-logs')
  @RequirePermissions({ resource: 'audit_logs', action: 'read' })
  async listAuditLogs(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
  ) {
    const tenantId = this.tenantContext.getRequiredTenantId();
    return this.adminService.listAuditLogs(
      tenantId,
      parseInt(page, 10),
      parseInt(limit, 10),
      search,
    );
  }
}
