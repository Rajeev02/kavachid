import { Controller, Post, Get, Body, Param, UseGuards, ValidationPipe, UsePipes } from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto, CreatePermissionDto, AssignPermissionDto, AssignRoleDto } from './dto/role.dto';
import { TenantGuard } from '../tenant/tenant.guard';
import { AuthGuard } from '../auth/auth.guard';

@Controller()
@UseGuards(TenantGuard, AuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post('roles')
  async createRole(@Body() dto: CreateRoleDto) {
    const role = await this.roleService.createRole(dto.name, dto.description);
    return {
      message: 'Role created successfully',
      role,
    };
  }

  @Post('permissions')
  async createPermission(@Body() dto: CreatePermissionDto) {
    const permission = await this.roleService.createPermission(dto.resource, dto.action);
    return {
      message: 'Permission created successfully',
      permission,
    };
  }

  @Post('roles/:roleId/permissions')
  async assignPermission(
    @Param('roleId') roleId: string,
    @Body() dto: AssignPermissionDto
  ) {
    await this.roleService.assignPermissionToRole(roleId, dto.permissionId);
    return {
      message: 'Permission assigned to role successfully',
    };
  }

  @Post('users/:userId/roles')
  async assignRole(
    @Param('userId') userId: string,
    @Body() dto: AssignRoleDto
  ) {
    await this.roleService.assignRoleToUser(userId, dto.roleId);
    return {
      message: 'Role assigned to user successfully',
    };
  }

  @Get('roles')
  async listRoles() {
    const roles = await this.roleService.listRoles();
    return { roles };
  }

  @Get('permissions')
  async listPermissions() {
    const permissions = await this.roleService.listPermissions();
    return { permissions };
  }
}
