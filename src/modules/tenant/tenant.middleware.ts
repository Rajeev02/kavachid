import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContext } from './tenant.context';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly tenantContext: TenantContext) {}

  use(req: Request, res: Response, next: NextFunction) {
    let tenantId = req.headers['x-tenant-id'] as string;

    // Support extracting UUID from path patterns like /t/:tenantId/... or /tenants/:tenantId/...
    if (!tenantId) {
      const match = req.path.match(/^\/(?:t|tenants)\/([a-f0-9\-]{36})/i);
      if (match) {
        tenantId = match[1];
      }
    }

    if (!tenantId) {
      return next();
    }

    this.tenantContext.run(tenantId, () => {
      next();
    });
  }
}
