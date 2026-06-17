import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { KeyPairService } from './keypair.service';
import { KeyPairModule } from './keypair.module';
import { DatabaseModule } from '../database/database.module';
import { CryptoModule } from '../crypto/crypto.module';
import { TenantModule } from '../tenant/tenant.module';
import { PrismaService } from '../database/prisma.service';

describe('KeyPairService (Integration Tests)', () => {
  let service: KeyPairService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        CryptoModule,
        TenantModule,
        KeyPairModule,
      ],
    }).compile();

    service = module.get<KeyPairService>(KeyPairService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    // Clean up key pairs created during integration testing
    await prisma.keyPair.deleteMany({
      where: { kid: { startsWith: 'kid_integration_' } },
    });
    await prisma.$disconnect();
  });

  describe('Key Management & JWKS', () => {
    it('should generate active key pair if none exists, encrypting the private key', async () => {
      // Fetch active RS256 key pair
      const activeKey = await service.getActiveKeyPair('RS256');
      
      expect(activeKey).toBeDefined();
      expect(activeKey.kid).toBeDefined();
      expect(activeKey.publicKeyPem).toContain('PUBLIC KEY');
      expect(activeKey.privateKeyPem).toContain('PRIVATE KEY');
      
      // Verify that the record in DB has encryptedPrivateKey but NOT plaintext PEM
      const dbKey = await prisma.keyPair.findUnique({
        where: { kid: activeKey.kid },
      });
      expect(dbKey).toBeDefined();
      expect(dbKey!.encryptedPrivateKey).not.toContain('PRIVATE KEY');
      expect(dbKey!.encryptedPrivateKey).toContain(':'); // IV:Ciphertext:AuthTag format
    });

    it('should rotate active keys correctly', async () => {
      const firstKey = await service.getActiveKeyPair('RS256');
      
      // Rotate signing keys
      const rotatedResult = await service.rotateKeys('RS256');
      expect(rotatedResult.kid).not.toBe(firstKey.kid);
      
      // The rotated key must now be active
      const secondKey = await service.getActiveKeyPair('RS256');
      expect(secondKey.kid).toBe(rotatedResult.kid);

      // Verify the old key is marked as expired
      const oldDbKey = await prisma.keyPair.findUnique({
        where: { kid: firstKey.kid },
      });
      expect(oldDbKey!.status).toBe('expired');
    });

    it('should convert active keys into public JWKS format', async () => {
      const jwks = await service.getPublicJwks('RS256');
      
      expect(jwks.keys).toBeDefined();
      expect(jwks.keys.length).toBeGreaterThanOrEqual(1);
      
      const keyEntry = jwks.keys[0];
      expect(keyEntry.kty).toBe('RSA');
      expect(keyEntry.alg).toBe('RS256');
      expect(keyEntry.use).toBe('sig');
      expect(keyEntry.n).toBeDefined(); // Modulus
      expect(keyEntry.e).toBeDefined(); // Exponent
    });
  });
});
