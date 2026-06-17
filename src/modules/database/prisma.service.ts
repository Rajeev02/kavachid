import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private static pool: Pool;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!PrismaService.pool) {
      PrismaService.pool = new Pool({ connectionString });
    }
    const adapter = new PrismaPg(PrismaService.pool);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    // Do not end pool if other instances might still use it in watch mode,
    // but in standard NestJS lifecycle, destroying modules shuts down the app.
    // If pool is ended, subsequent tests using a new instance of PrismaService
    // will need a new pool, which we handle by setting pool = null after end()
    if (PrismaService.pool) {
      await PrismaService.pool.end();
      PrismaService.pool = null as any;
    }
  }
}
