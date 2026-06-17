import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { AUDIT_KEY, AuditOptions } from './audit.decorator';
import { AuditLogService } from './audit-log.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditLogService: AuditLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const handler = context.getHandler();
    const options = this.reflector.get<AuditOptions>(AUDIT_KEY, handler);

    if (!options) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      tap(async (data) => {
        try {
          // Extract tenantId
          const tenantId = request.headers['x-tenant-id'] || request.user?.tenantId;
          if (!tenantId) {
            return; // Cannot log without tenantId
          }

          // Extract resourceId
          let resourceId = request.params?.id || request.params?.userId || request.params?.roleId || request.params?.permissionId;
          if (!resourceId && data) {
            // Check session ID, user ID or general ID
            resourceId = data.session?.id || data.user?.id || data.role?.id || data.permission?.id || data.id || data.userId || data.roleId || data.permissionId;
          }
          if (!resourceId && request.body?.refreshToken) {
            const parts = request.body.refreshToken.split(':');
            if (parts.length === 2) {
              resourceId = parts[0];
            }
          }

          // Extract actorId
          let actorId = request.user?.userId || request.user?.id;
          if (!actorId && data) {
            // For login, the session contains userId. For registration, the created user id is the actor.
            actorId = data.session?.userId || data.user?.id || data.userId || data.id;
          }

          // Clean up metadata to exclude sensitive fields
          const metadata = { ...request.body };
          const sensitiveFields = ['password', 'passwordHash', 'clientSecret', 'token', 'refreshToken', 'accessToken'];
          for (const field of sensitiveFields) {
            if (field in metadata) {
              delete metadata[field];
            }
          }

          await this.auditLogService.log({
            tenantId,
            actorId: actorId ? String(actorId) : null,
            action: options.action,
            resourceType: options.resourceType,
            resourceId: resourceId ? String(resourceId) : null,
            metadata: Object.keys(metadata).length > 0 ? metadata : null,
          });
        } catch (err) {
          // Gracefully handle audit logging errors so request flow isn't interrupted
          console.error('AuditLogInterceptor error:', err);
        }
      }),
    );
  }
}
