import { SetMetadata } from '@nestjs/common';

export interface RequiredPermission {
  resource: string;
  action: string;
}

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to enforce fine-grained permissions on NestJS controller methods.
 * Example: @RequirePermissions({ resource: 'users', action: 'write' })
 */
export const RequirePermissions = (...permissions: RequiredPermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
