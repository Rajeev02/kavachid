import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogService } from './audit-log.service';
import { AuditLogModule } from './audit-log.module';
import { DatabaseModule } from '../database/database.module';
import { PrismaService } from '../database/prisma.service';
import { AuditLogInterceptor } from './audit-log.interceptor';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

describe('AuditLogModule (Integration & Unit Tests)', () => {
  let service: AuditLogService;
  let prisma: PrismaService;
  let tenantId: string;
  let userId: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule, AuditLogModule],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
    prisma = module.get<PrismaService>(PrismaService);

    // Set up testing tenant
    const tenant = await prisma.tenant.create({
      data: { name: 'Audit Test Tenant' },
    });
    tenantId = tenant.id;

    // Create a dummy user
    const user = await prisma.user.create({
      data: {
        tenantId,
        email: `audit-user-${Date.now()}@kavachid.local`,
        status: 'active',
      },
    });
    userId = user.id;
  });

  afterAll(async () => {
    if (tenantId) {
      await prisma.tenant.delete({
        where: { id: tenantId },
      });
    }
    await prisma.$disconnect();
  });

  describe('AuditLogService', () => {
    it('should create an audit log entry in the database', async () => {
      const logEntry = await service.log({
        tenantId,
        actorId: userId,
        action: 'user.test_action',
        resourceType: 'user',
        resourceId: userId,
        metadata: { ip: '127.0.0.1' },
      });

      expect(logEntry).toBeDefined();
      expect(logEntry.action).toBe('user.test_action');
      expect(logEntry.tenantId).toBe(tenantId);
      expect(logEntry.actorId).toBe(userId);

      // Verify database record
      const dbEntry = await prisma.auditLog.findUnique({
        where: {
          tenantId_id: {
            tenantId,
            id: logEntry.id,
          },
        },
      });

      expect(dbEntry).toBeDefined();
      expect(dbEntry?.action).toBe('user.test_action');
    });
  });

  describe('AuditLogInterceptor', () => {
    let interceptor: AuditLogInterceptor;
    let reflector: Reflector;

    beforeEach(() => {
      reflector = new Reflector();
      interceptor = new AuditLogInterceptor(reflector, service);
    });

    it('should intercept and log audited endpoints', async () => {
      // Mock reflector to return audit options
      jest.spyOn(reflector, 'get').mockReturnValue({
        action: 'user.test_intercept',
        resourceType: 'user',
      });

      // Mock request and response context
      const requestMock = {
        headers: {
          'x-tenant-id': tenantId,
        },
        user: {
          userId,
          tenantId,
        },
        body: {
          name: 'some-name',
          password: 'sensitive-password-should-be-removed',
        },
        params: {
          id: userId,
        },
      };

      const contextMock = {
        getHandler: () => {},
        getClass: () => {},
        switchToHttp: () => ({
          getRequest: () => requestMock,
          getResponse: () => ({}),
        }),
      } as unknown as ExecutionContext;

      const responseData = { id: userId, email: 'test@domain.com' };
      const nextMock = {
        handle: () => of(responseData),
      } as CallHandler;

      // Call interceptor
      const resultObservable = interceptor.intercept(contextMock, nextMock);

      await new Promise<void>((resolve) => {
        resultObservable.subscribe(async (data) => {
          expect(data).toEqual(responseData);

          // Allow async DB write to complete
          await new Promise((r) => setTimeout(r, 150));

          // Query the db to see if interceptor wrote the log
          const logs = await prisma.auditLog.findMany({
            where: {
              tenantId,
              action: 'user.test_intercept',
            },
          });

          expect(logs.length).toBeGreaterThanOrEqual(1);
          const loggedMeta = logs[0].metadata as any;
          expect(loggedMeta.name).toBe('some-name');
          expect(loggedMeta.password).toBeUndefined(); // Verify password was deleted
          resolve();
        });
      });
    });
  });
});
