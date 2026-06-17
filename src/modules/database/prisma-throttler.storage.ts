import { Injectable } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaThrottlerStorage implements ThrottlerStorage {
  constructor(private readonly prisma: PrismaService) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<{ totalHits: number; timeToExpire: number; isBlocked: boolean; timeToBlockExpire: number }> {
    const expiresAt = new Date(Date.now() + ttl);

    // Clean up expired records occasionally or directly
    await this.prisma.rateLimit.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    const record = await this.prisma.rateLimit.upsert({
      where: { key },
      update: {
        hits: { increment: 1 },
      },
      create: {
        key,
        hits: 1,
        expiresAt,
      },
    });

    // If the record was just updated, but it was supposed to be expired, the cleanup might have missed it if they happened in same ms,
    // but UPSERT will increment. To be strictly accurate we should reset if expired.
    let hits = record.hits;
    let timeToExpire = Math.max(0, Math.floor((record.expiresAt.getTime() - Date.now()) / 1000));

    if (record.expiresAt.getTime() < Date.now()) {
      // It was expired, reset it
      await this.prisma.rateLimit.update({
        where: { key },
        data: { hits: 1, expiresAt },
      });
      hits = 1;
      timeToExpire = Math.floor(ttl / 1000);
    }

    const isBlocked = hits > limit;
    const timeToBlockExpire = isBlocked ? timeToExpire : 0;

    return {
      totalHits: hits,
      timeToExpire,
      isBlocked,
      timeToBlockExpire,
    };
  }
}
