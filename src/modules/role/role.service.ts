import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { TenantContext } from '../tenant/tenant.context';

@Injectable()
export class RoleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
  ) {}

  /**
   * Create a new role under the active tenant context
   */
  async createRole(name: string, description?: string, isSystem = false) {
    const tenantId = this.tenantContext.getRequiredTenantId();

    const existing = await this.prisma.role.findUnique({
      where: { tenantId_name: { tenantId, name } },
    });
    if (existing) {
      throw new ConflictException(`Role '${name}' already exists for this tenant`);
    }

    return this.prisma.role.create({
      data: {
        tenantId,
        name,
        description,
        isSystem,
      },
    });
  }

  /**
   * Create a new permission under the active tenant context
   */
  async createPermission(resource: string, action: string) {
    const tenantId = this.tenantContext.getRequiredTenantId();

    const existing = await this.prisma.permission.findUnique({
      where: { tenantId_resource_action: { tenantId, resource, action } },
    });
    if (existing) {
      throw new ConflictException(`Permission on '${resource}:${action}' already exists for this tenant`);
    }

    return this.prisma.permission.create({
      data: {
        tenantId,
        resource,
        action,
      },
    });
  }

  /**
   * Link a permission to a role
   */
  async assignPermissionToRole(roleId: string, permissionId: string) {
    const tenantId = this.tenantContext.getRequiredTenantId();

    // Verify role exists
    const role = await this.prisma.role.findUnique({
      where: { tenantId_id: { tenantId, id: roleId } },
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Verify permission exists
    const permission = await this.prisma.permission.findUnique({
      where: { tenantId_id: { tenantId, id: permissionId } },
    });
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    // Link role and permission
    try {
      return await this.prisma.rolePermission.create({
        data: {
          tenantId,
          roleId,
          permissionId,
        },
      });
    } catch (err) {
      // Handle duplicate link
      throw new ConflictException('Permission is already assigned to this role');
    }
  }

  /**
   * Assign a role to a user
   */
  async assignRoleToUser(userId: string, roleId: string) {
    const tenantId = this.tenantContext.getRequiredTenantId();

    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { tenantId_id: { tenantId, id: userId } },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify role exists
    const role = await this.prisma.role.findUnique({
      where: { tenantId_id: { tenantId, id: roleId } },
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Link user and role
    try {
      return await this.prisma.userRole.create({
        data: {
          tenantId,
          userId,
          roleId,
        },
      });
    } catch (err) {
      throw new ConflictException('Role is already assigned to this user');
    }
  }

  /**
   * List all roles under active tenant
   */
  async listRoles() {
    const tenantId = this.tenantContext.getRequiredTenantId();
    return this.prisma.role.findMany({
      where: { tenantId },
    });
  }

  /**
   * List all permissions under active tenant
   */
  async listPermissions() {
    const tenantId = this.tenantContext.getRequiredTenantId();
    return this.prisma.permission.findMany({
      where: { tenantId },
    });
  }
}
