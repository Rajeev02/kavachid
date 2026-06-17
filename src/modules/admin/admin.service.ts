import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(tenantId: string, page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          username: true,
          status: true,
          migrationStatus: true,
          createdAt: true,
          roles: {
            select: {
              role: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    // Flatten user roles
    const formattedUsers = users.map((u) => ({
      ...u,
      roles: u.roles.map((r) => r.role),
    }));

    return {
      users: formattedUsers,
      total,
      page,
      limit,
    };
  }

  async listSessions(tenantId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const where = { tenantId, revokedAt: null };

    const [sessions, total] = await Promise.all([
      this.prisma.session.findMany({
        where,
        skip,
        take: limit,
        orderBy: { lastSeenAt: 'desc' },
        select: {
          id: true,
          userId: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true,
          lastSeenAt: true,
          riskScore: true,
          user: {
            select: {
              email: true,
              username: true,
            },
          },
        },
      }),
      this.prisma.session.count({ where }),
    ]);

    return {
      sessions,
      total,
      page,
      limit,
    };
  }

  async revokeSession(tenantId: string, sessionId: string) {
    return this.prisma.session.update({
      where: { tenantId_id: { tenantId, id: sessionId } },
      data: { revokedAt: new Date() },
    });
  }

  async listAuditLogs(tenantId: string, page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { resourceType: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      limit,
    };
  }
}
