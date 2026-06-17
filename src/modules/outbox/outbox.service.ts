import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import axios from 'axios';
import { KavachConfigService } from '../kavach-config.service';

@Injectable()
export class OutboxService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxService.name);
  private isPolling = false;
  private pollInterval: NodeJS.Timeout | undefined;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: KavachConfigService,
  ) {}

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
   * Poll and process pending events with exponential backoff.
   */
  async processOutbox() {
    if (this.isPolling) return;
    this.isPolling = true;

    try {
      // Fetch up to 20 pending events that haven't failed completely
      const events = await this.prisma.outboxEvent.findMany({
        where: {
          status: 'pending',
          retryCount: { lt: 5 },
        },
        take: 20,
        orderBy: { createdAt: 'asc' },
      });

      if (events.length === 0) return;

      const now = new Date();
      // Filter events by backoff: wait 2^retryCount seconds between retries
      const eligibleEvents = events.filter((event) => {
        if (event.retryCount === 0) return true;
        const backoffMs = Math.pow(2, event.retryCount) * 1000;
        const elapsedMs = now.getTime() - event.createdAt.getTime();
        return elapsedMs >= backoffMs;
      });

      if (eligibleEvents.length === 0) return;

      this.logger.log(`Found ${eligibleEvents.length} eligible outbox events to process.`);

      const webhookUrl = this.config.webhookUrl;

      for (const event of eligibleEvents) {
        try {
          this.logger.debug(
            `Dispatching event: ${event.eventType} (ID: ${event.id}) for tenant: ${event.tenantId} to ${webhookUrl}`
          );

          await axios.post(
            webhookUrl,
            {
              id: event.id,
              tenantId: event.tenantId,
              eventType: event.eventType,
              payload: event.payload,
              createdAt: event.createdAt,
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'X-KavachID-Event': event.eventType,
              },
              timeout: 5000,
            },
          );

          await this.prisma.outboxEvent.update({
            where: { id: event.id },
            data: {
              status: 'processed',
              processedAt: new Date(),
            },
          });
        } catch (error) {
          const nextRetryCount = event.retryCount + 1;
          const status = nextRetryCount >= 5 ? 'failed' : 'pending';
          this.logger.error(
            `Failed to dispatch outbox event ${event.id} (attempt ${nextRetryCount}/5): ${error.message}`
          );

          await this.prisma.outboxEvent.update({
            where: { id: event.id },
            data: {
              status,
              retryCount: nextRetryCount,
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
