import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class OutboxService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxService.name);
  private isPolling = false;
  private pollInterval: NodeJS.Timeout | undefined;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    // Poll for pending outbox events every 5 seconds
    this.pollInterval = setInterval(() => this.processOutbox(), 5000);
  }

  onModuleDestroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  /**
   * Insert a new event into the outbox. Can run within an existing Prisma transaction.
   */
  async createEvent(
    tenantId: string,
    eventType: string,
    payload: any,
    tx?: any
  ) {
    const client = tx || this.prisma;
    return client.outboxEvent.create({
      data: {
        tenantId,
        eventType,
        payload,
        status: 'pending',
      },
    });
  }

  /**
   * Poll and process pending events.
   */
  async processOutbox() {
    if (this.isPolling) return;
    this.isPolling = true;

    try {
      // Fetch up to 20 pending events
      const events = await this.prisma.outboxEvent.findMany({
        where: { status: 'pending' },
        take: 20,
        orderBy: { createdAt: 'asc' },
      });

      if (events.length === 0) return;

      this.logger.log(`Found ${events.length} pending outbox events to process.`);

      for (const event of events) {
        try {
          this.logger.debug(
            `Dispatching event: ${event.eventType} (ID: ${event.id}) for tenant: ${event.tenantId}`
          );

          // Simulated dispatch - in V1, we log and mark processed. 
          // Future implementations can add webhook HTTP triggers.
          await this.prisma.outboxEvent.update({
            where: { id: event.id },
            data: {
              status: 'processed',
              processedAt: new Date(),
            },
          });
        } catch (error) {
          this.logger.error(`Failed to process outbox event ${event.id}: ${error.message}`);
          await this.prisma.outboxEvent.update({
            where: { id: event.id },
            data: {
              status: 'failed',
              retryCount: event.retryCount + 1,
            },
          });
        }
      }
    } catch (error) {
      this.logger.error(`Error polling outbox events: ${error.message}`);
    } finally {
      this.isPolling = false;
    }
  }
}
