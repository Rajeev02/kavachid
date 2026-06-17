import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../database/prisma.service';
import { PERMISSIONS_KEY, RequiredPermission } from './permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<RequiredPermission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no permission metadata is set, route is accessible to any authenticated user
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User context is missing');
    }

    // Resolve user's permissions from database under active tenant context
    const userRoles = await this.prisma.userRole.findMany({
      where: {
        tenantId: user.tenantId,
        userId: user.sub,
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    const userPermissions = userRoles.flatMap((ur) =>
      ur.role.permissions.map((rp) => rp.permission),
    );

    // Check if the user has all required permissions for this route
    const hasPermission = requiredPermissions.every((required) =>
      userPermissions.some(
        (up) => up.resource === required.resource && up.action === required.action,
      ),
    );

    if (!hasPermission) {
      throw new ForbiddenException('You do not have the required permissions to access this resource');
    }

    return true;
  }
}
