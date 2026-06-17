import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface CreateAuditLogDto {
  tenantId: string;
  actorId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  metadata?: any;
}

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async log(data: CreateAuditLogDto) {
    return this.prisma.auditLog.create({
      data: {
        tenantId: data.tenantId,
        actorId: data.actorId || null,
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId || null,
        metadata: data.metadata || null,
      },
    });
  }
}
