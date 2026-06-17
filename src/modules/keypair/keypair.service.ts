import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CryptoService } from '../crypto/crypto.service';

@Injectable()
export class KeyPairService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {}

  /**
   * Fetch the currently active KeyPair from the database, or generate one if none exists.
   */
  async getActiveKeyPair(algorithm: 'RS256' | 'ES256' = 'RS256'): Promise<{
    kid: string;
    publicKeyPem: string;
    privateKeyPem: string;
    algorithm: string;
  }> {
    const now = new Date();
    
    // Find an active keypair that is valid right now
    let activeKey = await this.prisma.keyPair.findFirst({
      where: {
        status: 'active',
        algorithm,
        activeFrom: { lte: now },
        activeTo: { gte: now },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeKey) {
      // Generate and save a new key pair since none is currently active
      activeKey = await this.generateAndSaveKeyPair(algorithm);
    }

    try {
      const privateKeyPem = this.crypto.decryptPrivateKey(activeKey.encryptedPrivateKey);
      return {
        kid: activeKey.kid,
        publicKeyPem: activeKey.publicKeyPem,
        privateKeyPem,
        algorithm: activeKey.algorithm,
      };
    } catch (err) {
      throw new InternalServerErrorException('Failed to decrypt active signing key');
    }
  }

  /**
   * Force key rotation: marks all existing active keys of specified algorithm as expired,
   * then generates and saves a new active key pair.
   */
  async rotateKeys(algorithm: 'RS256' | 'ES256' = 'RS256'): Promise<{ kid: string; publicKeyPem: string }> {
    const now = new Date();

    // Deactivate existing active keys by setting status to expired and activeTo to now
    await this.prisma.keyPair.updateMany({
      where: {
        status: 'active',
        algorithm,
      },
      data: {
        status: 'expired',
        activeTo: now,
      },
    });

    const newKey = await this.generateAndSaveKeyPair(algorithm);
    return {
      kid: newKey.kid,
      publicKeyPem: newKey.publicKeyPem,
    };
  }

  /**
   * Returns a standard JSON Web Key Set (JWKS) list of public keys.
   */
  async getPublicJwks(algorithm: 'RS256' | 'ES256' = 'RS256'): Promise<{ keys: any[] }> {
    // Fetch all active or recently expired key pairs to allow clients to verify active or recently issued tokens
    const keys = await this.prisma.keyPair.findMany({
      where: {
        status: { in: ['active', 'expired'] },
        algorithm,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const jwks = await Promise.all(
      keys.map(async (key) => {
        try {
          return await this.crypto.pemToJwk(key.publicKeyPem, key.kid, key.algorithm);
        } catch (err) {
          // Skip keys that fail JWK translation to avoid breaking the entire endpoint
          return null;
        }
      })
    );

    return {
      keys: jwks.filter((k) => k !== null),
    };
  }

  /**
   * Helper to generate a new key pair and store it encrypted in the DB
   */
  private async generateAndSaveKeyPair(algorithm: 'RS256' | 'ES256') {
    const { publicKeyPem, privateKeyPem } = this.crypto.generateKeyPair(algorithm);
    const kid = `kid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const encryptedPrivateKey = this.crypto.encryptPrivateKey(privateKeyPem);
    const activeFrom = new Date();
    // Valid for 30 days
    const activeTo = new Date();
    activeTo.setDate(activeTo.getDate() + 30);

    return this.prisma.keyPair.create({
      data: {
        kid,
        publicKeyPem,
        encryptedPrivateKey,
        algorithm,
        status: 'active',
        activeFrom,
        activeTo,
      },
    });
  }
}
