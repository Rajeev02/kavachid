import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { RoleService } from './role.service';
import { RoleModule } from './role.module';
import { DatabaseModule } from '../database/database.module';
import { CryptoModule } from '../crypto/crypto.module';
import { TenantModule } from '../tenant/tenant.module';
import { AuthModule } from '../auth/auth.module';
import { TenantContext } from '../tenant/tenant.context';
import { PrismaService } from '../database/prisma.service';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException, ConflictException } from '@nestjs/common';

describe('Role & Authorization Engine (Integration Tests)', () => {
  let service: RoleService;
  let prisma: PrismaService;
  let tenantContext: TenantContext;
  let permissionsGuard: PermissionsGuard;
  let reflector: Reflector;
  let tenantId: string;
  let userId: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        CryptoModule,
        TenantModule,
        AuthModule,
        RoleModule,
      ],
    }).compile();

    service = module.get<RoleService>(RoleService);
    prisma = module.get<PrismaService>(PrismaService);
    tenantContext = module.get<TenantContext>(TenantContext);
    permissionsGuard = module.get<PermissionsGuard>(PermissionsGuard);
    reflector = module.get<Reflector>(Reflector);

    // Set up testing tenant
    const tenant = await prisma.tenant.create({
      data: { name: 'RBAC Test Tenant' },
    });
    tenantId = tenant.id;

    // Create a dummy user
    await tenantContext.run(tenantId, async () => {
      const user = await prisma.user.create({
        data: {
          tenantId,
          email: `rbac-user-${Date.now()}@kavachid.local`,
          status: 'active',
        },
      });
      userId = user.id;
    });
  });

  afterAll(async () => {
    if (tenantId) {
      await prisma.tenant.delete({
        where: { id: tenantId },
      });
    }
    await prisma.$disconnect();
  });

  describe('RBAC CRUD Operations', () => {
    it('should create roles and permissions, and link them to user', async () => {
      await tenantContext.run(tenantId, async () => {
        const role = await service.createRole('Manager', 'Manager Role');
        expect(role).toBeDefined();
        expect(role.name).toBe('Manager');

        const permission = await service.createPermission('projects', 'write');
        expect(permission).toBeDefined();
        expect(permission.resource).toBe('projects');
        expect(permission.action).toBe('write');

        const link = await service.assignPermissionToRole(role.id, permission.id);
        expect(link).toBeDefined();

        const userRole = await service.assignRoleToUser(userId, role.id);
        expect(userRole).toBeDefined();
      });
    });

    it('should throw ConflictException on duplicate roles', async () => {
      await tenantContext.run(tenantId, async () => {
        await expect(service.createRole('Manager'))
          .rejects.toThrow(ConflictException);
      });
    });
  });

  describe('PermissionsGuard Enforcement', () => {
    it('should allow activation if user has required permissions', async () => {
      // Stub Reflector to require 'projects:write' permission
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
        { resource: 'projects', action: 'write' },
      ]);

      // Mock NestJS ExecutionContext
      const mockContext = {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              sub: userId,
              tenantId: tenantId,
            },
          }),
        }),
      } as unknown as ExecutionContext;

      const canActivate = await permissionsGuard.canActivate(mockContext);
      expect(canActivate).toBe(true);
    });

    it('should throw ForbiddenException if user lacks required permissions', async () => {
      // Require 'admin:delete' permission (which user does not have)
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
        { resource: 'admin', action: 'delete' },
      ]);

      const mockContext = {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              sub: userId,
              tenantId: tenantId,
            },
          }),
        }),
      } as unknown as ExecutionContext;

      await expect(permissionsGuard.canActivate(mockContext))
        .rejects.toThrow(ForbiddenException);
    });
  });
});
