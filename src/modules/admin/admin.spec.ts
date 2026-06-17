import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { AdminModule } from './admin.module';
import { DatabaseModule } from '../database/database.module';
import { PrismaService } from '../database/prisma.service';
import { CryptoModule } from '../crypto/crypto.module';
import { KeyPairModule } from '../keypair/keypair.module';
import { TenantModule } from '../tenant/tenant.module';
import { AuthModule } from '../auth/auth.module';

describe('AdminService (Integration Tests)', () => {
  let service: AdminService;
  let prisma: PrismaService;
  let tenantId: string;
  let userId: string;
  let sessionId: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        CryptoModule,
        KeyPairModule,
        TenantModule,
        AuthModule,
        AdminModule,
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    prisma = module.get<PrismaService>(PrismaService);

    // Set up testing tenant
    const tenant = await prisma.tenant.create({
      data: { name: 'Admin Test Tenant' },
    });
    tenantId = tenant.id;

    // Create a dummy user
    const user = await prisma.user.create({
      data: {
        tenantId,
        email: `admin-test-user-${Date.now()}@kavachid.local`,
        status: 'active',
      },
    });
    userId = user.id;

    // Create a dummy session
    const session = await prisma.session.create({
      data: {
        tenantId,
        userId,
        refreshVerHash: 'dummyhash',
        ipAddress: '127.0.0.1',
        userAgent: 'Jest Test Agent',
        riskScore: 1.0,
      },
    });
    sessionId = session.id;

    // Create a dummy audit log
    await prisma.auditLog.create({
      data: {
        tenantId,
        actorId: userId,
        action: 'admin.test_action',
        resourceType: 'system',
      },
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

  it('should list tenant users with pagination', async () => {
    const result = await service.listUsers(tenantId, 1, 10);
    expect(result).toBeDefined();
    expect(result.users.length).toBeGreaterThanOrEqual(1);
    expect(result.total).toBeGreaterThanOrEqual(1);
    expect(result.users[0].email).toBeDefined();
  });

  it('should list active tenant sessions with pagination', async () => {
    const result = await service.listSessions(tenantId, 1, 10);
    expect(result).toBeDefined();
    expect(result.sessions.length).toBe(1);
    expect(result.total).toBe(1);
    expect(result.sessions[0].ipAddress).toBe('127.0.0.1');
  });

  it('should list audit logs with pagination and action search', async () => {
    const result = await service.listAuditLogs(tenantId, 1, 10, 'admin.test_action');
    expect(result).toBeDefined();
    expect(result.logs.length).toBe(1);
    expect(result.logs[0].action).toBe('admin.test_action');
  });

  it('should revoke an active session', async () => {
    const revoked = await service.revokeSession(tenantId, sessionId);
    expect(revoked).toBeDefined();
    expect(revoked.revokedAt).toBeDefined();

    const activeList = await service.listSessions(tenantId, 1, 10);
    expect(activeList.sessions.length).toBe(0);
    expect(activeList.total).toBe(0);
  });
});
