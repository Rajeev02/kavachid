import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { UserModule } from './user.module';
import { DatabaseModule } from '../database/database.module';
import { CryptoModule } from '../crypto/crypto.module';
import { TenantModule } from '../tenant/tenant.module';
import { OutboxModule } from '../outbox/outbox.module';
import { TenantContext } from '../tenant/tenant.context';
import { PrismaService } from '../database/prisma.service';
import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';

describe('UserService (Integration Tests)', () => {
  let service: UserService;
  let prisma: PrismaService;
  let tenantContext: TenantContext;
  let tenantId: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        CryptoModule,
        TenantModule,
        OutboxModule,
        UserModule,
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
    tenantContext = module.get<TenantContext>(TenantContext);

    // Create a dummy tenant for integration testing
    const tenant = await prisma.tenant.create({
      data: { name: 'Integration Test Tenant' },
    });
    tenantId = tenant.id;
  });

  afterAll(async () => {
    // Clean up our integration tests tenant (which cascades to users, outbox, etc.)
    if (tenantId) {
      await prisma.tenant.delete({
        where: { id: tenantId },
      });
    }
    await prisma.$disconnect();
  });

  describe('User Registration', () => {
    it('should register a user successfully under the current tenant context', async () => {
      await tenantContext.run(tenantId, async () => {
        const email = `user-${Date.now()}@kavachid.local`;
        const user = await service.registerUser(email, 'Password123!', 'user_test_1');

        expect(user).toBeDefined();
        expect(user.email).toBe(email);
        expect(user.username).toBe('user_test_1');
        expect(user.passwordHash).toBeDefined();
        expect(user.migrationStatus).toBe('active');

        // Check if outbox event was created
        const outboxEvents = await prisma.outboxEvent.findMany({
          where: { tenantId, eventType: 'UserCreated' },
        });
        expect(outboxEvents.length).toBeGreaterThanOrEqual(1);
        const latestEvent = outboxEvents[outboxEvents.length - 1];
        expect((latestEvent.payload as any).userId).toBe(user.id);
      });
    });

    it('should throw ConflictException on duplicate email under same tenant', async () => {
      await tenantContext.run(tenantId, async () => {
        const email = `dup-${Date.now()}@kavachid.local`;
        await service.registerUser(email, 'Password123!');

        await expect(service.registerUser(email, 'AnotherPassword!'))
          .rejects.toThrow(ConflictException);
      });
    });
  });

  describe('Credentials Verification', () => {
    it('should verify correct credentials and reject incorrect ones', async () => {
      await tenantContext.run(tenantId, async () => {
        const email = `auth-${Date.now()}@kavachid.local`;
        await service.registerUser(email, 'my-super-secret-password');

        const result = await service.verifyCredentials(email, 'my-super-secret-password');
        expect(result.success).toBe(true);
        expect(result.userId).toBeDefined();

        await expect(service.verifyCredentials(email, 'wrong-password'))
          .rejects.toThrow(UnauthorizedException);
      });
    });

    it('should throw NotFoundException for non-existent users', async () => {
      await tenantContext.run(tenantId, async () => {
        await expect(service.verifyCredentials('doesnotexist@kavachid.local', 'somepass'))
          .rejects.toThrow(NotFoundException);
      });
    });
  });

  describe('JIT Legacy Migration', () => {
    it('should migrate legacy users on-the-fly upon successful login', async () => {
      await tenantContext.run(tenantId, async () => {
        const email = `legacy-${Date.now()}@kavachid.local`;

        // Directly insert a legacy user without a password hash in the db
        const user = await prisma.user.create({
          data: {
            tenantId,
            email,
            status: 'active',
            migrationStatus: 'legacy',
          },
        });

        // Verify that credential checks trigger legacy migration using simulated webhook
        // Valid legacy password in simulator is 'legacyPass123'
        const result = await service.verifyCredentials(email, 'legacyPass123');
        expect(result.success).toBe(true);
        expect(result.userId).toBe(user.id);

        // Fetch user from DB and check that passwordHash was written and migrationStatus updated
        const updatedUser = await service.getUserById(user.id);
        expect(updatedUser.migrationStatus).toBe('migrated');
        expect(updatedUser.passwordHash).toBeDefined();
        expect(updatedUser.passwordHash).toContain('$argon2id$');

        // Check if outbox event was created for migration
        const outboxEvents = await prisma.outboxEvent.findMany({
          where: { tenantId, eventType: 'UserMigrated' },
        });
        expect(outboxEvents.length).toBeGreaterThanOrEqual(1);

        // Standard verification should work from now on
        const secondAuth = await service.verifyCredentials(email, 'legacyPass123');
        expect(secondAuth.success).toBe(true);
      });
    });
  });
});
