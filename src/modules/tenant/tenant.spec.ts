import { Test, TestingModule } from '@nestjs/testing';
import { TenantContext } from './tenant.context';
import { TenantGuard } from './tenant.guard';
import { BadRequestException, ExecutionContext } from '@nestjs/common';

describe('TenantContext & Guard', () => {
  let contextService: TenantContext;
  let tenantGuard: TenantGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantContext, TenantGuard],
    }).compile();

    contextService = module.get<TenantContext>(TenantContext);
    tenantGuard = module.get<TenantGuard>(TenantGuard);
  });

  describe('AsyncLocalStorage context tracking', () => {
    it('should maintain distinct tenant contexts across concurrent async executions', async () => {
      const runWithDelay = (tenantId: string, delay: number) => {
        return contextService.run(tenantId, async () => {
          expect(contextService.getTenantId()).toBe(tenantId);
          await new Promise((r) => setTimeout(r, delay));
          expect(contextService.getTenantId()).toBe(tenantId);
          return contextService.getRequiredTenantId();
        });
      };

      const results = await Promise.all([
        runWithDelay('tenant-A', 50),
        runWithDelay('tenant-B', 10),
      ]);

      expect(results).toEqual(['tenant-A', 'tenant-B']);
    });
  });

  describe('TenantGuard', () => {
    it('should throw BadRequestException if tenant context is missing', () => {
      const mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => ({}),
        }),
      } as unknown as ExecutionContext;

      expect(() => tenantGuard.canActivate(mockExecutionContext)).toThrow(BadRequestException);
    });

    it('should allow activation if tenant context is successfully established', () => {
      const mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => ({}),
        }),
      } as unknown as ExecutionContext;

      const result = contextService.run('tenant-active', () => {
        return tenantGuard.canActivate(mockExecutionContext);
      });

      expect(result).toBe(true);
    });
  });
});
