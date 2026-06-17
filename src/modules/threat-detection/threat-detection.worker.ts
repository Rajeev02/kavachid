import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';
import { OutboxService } from '../outbox/outbox.service';

@Injectable()
export class ThreatDetectionWorker {
  private readonly logger = new Logger(ThreatDetectionWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCredentialStuffingDetection() {
    // We want to find identifiers or IPs that have failed > maxFailedLogins in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    try {
      // Find all failed login attempts in the last 5 minutes
      const recentFailures = await this.prisma.loginAttempt.findMany({
        where: {
          success: false,
          createdAt: { gte: fiveMinutesAgo },
        },
        include: { tenant: true },
      });

      if (recentFailures.length === 0) return;

      // Group by tenant and identifier
      const groups = new Map<string, typeof recentFailures>();
      
      for (const attempt of recentFailures) {
        const key = `${attempt.tenantId}:${attempt.identifier}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(attempt);
      }

      for (const [key, attempts] of groups.entries()) {
        const tenantId = attempts[0].tenantId;
        const identifier = attempts[0].identifier;
        const tenant = attempts[0].tenant;
        const maxFailures = tenant.maxFailedLogins || 5;

        if (attempts.length >= maxFailures) {
          // Lock the user
          const user = await this.prisma.user.findFirst({
            where: {
              tenantId,
              OR: [{ email: identifier }, { username: identifier }],
              status: { not: 'LOCKED' },
            },
          });

          if (user) {
            this.logger.warn(`Locking user ${user.id} in tenant ${tenantId} due to ${attempts.length} failed attempts (Credential Stuffing detected)`);
            
            await this.prisma.user.update({
              where: { tenantId_id: { tenantId, id: user.id } },
              data: { status: 'LOCKED' },
            });

            await this.outbox.createEvent(tenantId, 'UserLocked', {
              userId: user.id,
              reason: 'CREDENTIAL_STUFFING_DETECTED',
              failedAttempts: attempts.length,
            });
            
            // Record an AuditLog directly if outbox is async
            await this.prisma.auditLog.create({
              data: {
                tenantId,
                action: 'THREAT_DETECTION.USER_LOCKED',
                resourceType: 'user',
                resourceId: user.id,
                metadata: { reason: 'credential_stuffing', threshold: maxFailures, attempts: attempts.length }
              }
            });
          }
        }
      }
    } catch (err) {
      this.logger.error('Error during threat detection analysis', err);
    }
  }
}
