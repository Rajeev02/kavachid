import { Injectable, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CryptoService } from '../crypto/crypto.service';
import { TenantContext } from '../tenant/tenant.context';
import { OutboxService } from '../outbox/outbox.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly tenantContext: TenantContext,
    private readonly outbox: OutboxService,
  ) {}

  /**
   * Register a new user in the active tenant context
   */
  async registerUser(email: string, password?: string, username?: string, metadata?: any) {
    const tenantId = this.tenantContext.getRequiredTenantId();

    // Check if user already exists
    if (email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { tenantId_email: { tenantId, email } },
      });
      if (existingEmail) {
        throw new ConflictException('Email is already registered for this tenant');
      }
    }

    if (username) {
      const existingUsername = await this.prisma.user.findUnique({
        where: { tenantId_username: { tenantId, username } },
      });
      if (existingUsername) {
        throw new ConflictException('Username is already registered for this tenant');
      }
    }

    const passwordHash = password ? await this.crypto.hashPassword(password) : null;

    // Use Prisma transaction to create both User and OutboxEvent
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          tenantId,
          email,
          username,
          passwordHash,
          status: 'active',
          migrationStatus: 'active', // default active (no migration needed)
          metadata: metadata || {},
        },
      });

      // Write OutboxEvent
      await this.outbox.createEvent(
        tenantId,
        'UserCreated',
        {
          userId: user.id,
          email: user.email,
          username: user.username,
        },
        tx
      );

      return user;
    });
  }

  /**
   * Verify user credentials, implementing Just-In-Time (JIT) legacy migrations
   */
  async verifyCredentials(identifier: string, password: string): Promise<{ success: boolean; userId: string }> {
    const tenantId = this.tenantContext.getRequiredTenantId();

    // Find user by email or username under tenant context
    const user = await this.prisma.user.findFirst({
      where: {
        tenantId,
        OR: [
          { email: identifier },
          { username: identifier }
        ]
      }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Just-In-Time Legacy Migration handling
    if (user.migrationStatus === 'legacy') {
      // Simulate external API/Webhook verification call
      const isLegacyValid = await this.simulateLegacyMigrationWebhook(user.email || user.username || '', password);
      
      if (!isLegacyValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Hash legacy password on-the-fly and update user record
      const newHash = await this.crypto.hashPassword(password);
      await this.prisma.user.update({
        where: { tenantId_id: { tenantId, id: user.id } },
        data: {
          passwordHash: newHash,
          migrationStatus: 'migrated',
        }
      });

      // Write OutboxEvent
      await this.outbox.createEvent(tenantId, 'UserMigrated', {
        userId: user.id,
        email: user.email,
        username: user.username,
      });

      return { success: true, userId: user.id };
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('User does not have a password set');
    }

    // Standard credential verification using thread-pooled Argon2id
    const isMatch = await this.crypto.verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return { success: true, userId: user.id };
  }

  /**
   * Fetch a user by id
   */
  async getUserById(id: string) {
    const tenantId = this.tenantContext.getRequiredTenantId();
    const user = await this.prisma.user.findUnique({
      where: { tenantId_id: { tenantId, id } }
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  /**
   * Mock simulation of a legacy migration webhook check
   */
  private async simulateLegacyMigrationWebhook(identifier: string, secret: string): Promise<boolean> {
    // In actual implementation, we might call Axios POST to external system.
    // For demo/validation: match passwords ending in "_legacy" or if secret equals "legacyPass123"
    return secret === 'legacyPass123' || secret.endsWith('_legacy');
  }
}
