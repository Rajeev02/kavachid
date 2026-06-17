import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { SessionService } from './session.service';
import { SessionModule } from './session.module';
import { DatabaseModule } from '../database/database.module';
import { CryptoModule } from '../crypto/crypto.module';
import { TenantModule } from '../tenant/tenant.module';
import { OutboxModule } from '../outbox/outbox.module';
import { KeyPairModule } from '../keypair/keypair.module';
import { UserModule } from '../user/user.module';
import { UserService } from '../user/user.service';
import { TenantContext } from '../tenant/tenant.context';
import { PrismaService } from '../database/prisma.service';
import { UnauthorizedException } from '@nestjs/common';
import * as jose from 'jose';
import { createHash } from 'crypto';

describe('SessionService (Integration Tests)', () => {
  let service: SessionService;
  let userService: UserService;
  let prisma: PrismaService;
  let tenantContext: TenantContext;
  let tenantId: string;
  let userId: string;
  const password = 'UserPassword123!';

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        CryptoModule,
        TenantModule,
        OutboxModule,
        KeyPairModule,
        UserModule,
        SessionModule,
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
    userService = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
    tenantContext = module.get<TenantContext>(TenantContext);

    // Create a dummy tenant and user for testing sessions
    const tenant = await prisma.tenant.create({
      data: { name: 'Session Integration Tenant' },
    });
    tenantId = tenant.id;

    await tenantContext.run(tenantId, async () => {
      const email = `session-test-${Date.now()}@kavachid.local`;
      const user = await userService.registerUser(email, password, 'session_tester');
      userId = user.id;
    });
  });

  afterAll(async () => {
    // Cascade deletes everything (sessions, devices, users, etc.)
    if (tenantId) {
      await prisma.tenant.delete({
        where: { id: tenantId },
      });
    }
    await prisma.$disconnect();
  });

  describe('Login & Token Generation', () => {
    it('should authenticate user and return access and refresh tokens', async () => {
      await tenantContext.run(tenantId, async () => {
        const tokens = await service.login(
          'session_tester',
          password,
          '127.0.0.1',
          'Jest Agent'
        );

        expect(tokens).toBeDefined();
        expect(tokens.accessToken).toBeDefined();
        expect(tokens.refreshToken).toBeDefined();
        expect(tokens.refreshToken).toContain(':'); // sessionId:tokenValue format

        // Check if session record was created in DB
        const sessionId = tokens.refreshToken.split(':')[0];
        const dbSession = await prisma.session.findUnique({
          where: { tenantId_id: { tenantId, id: sessionId } },
        });
        expect(dbSession).toBeDefined();
        expect(dbSession!.revokedAt).toBeNull();
      });
    });

    it('should bind access token to client DPoP public key thumbprint', async () => {
      await tenantContext.run(tenantId, async () => {
        // Generate an ephemeral EC key pair representing a client
        const clientKeyPair = await jose.generateKeyPair('ES256');
        const clientJwk = await jose.exportJWK(clientKeyPair.publicKey);
        
        const htm = 'POST';
        const htu = 'https://kavachid.local/auth/login';

        // Sign the DPoP proof
        const dpopProof = await new jose.SignJWT({ htm, htu, jti: 'nonce-1' })
          .setProtectedHeader({ alg: 'ES256', typ: 'dpop+jwt', jwk: clientJwk })
          .setIssuedAt()
          .sign(clientKeyPair.privateKey);

        const tokens = await service.login(
          'session_tester',
          password,
          '127.0.0.1',
          'Jest Agent',
          undefined,
          dpopProof,
          htm,
          htu
        );

        // Decode the generated JWT and verify `cnf.jkt` matches thumbprint
        const expectedJkt = await jose.calculateJwkThumbprint(clientJwk);
        const decoded = jose.decodeJwt(tokens.accessToken);
        
        expect((decoded as any).cnf).toBeDefined();
        expect((decoded as any).cnf.jkt).toBe(expectedJkt);
      });
    });
  });

  describe('Refresh Token Rotation (RTR)', () => {
    it('should rotate tokens and update presented token hash in DB', async () => {
      await tenantContext.run(tenantId, async () => {
        const tokens = await service.login('session_tester', password, '127.0.0.1', 'Jest Agent');

        const rotated = await service.refresh(tokens.refreshToken, '127.0.0.1', 'Jest Agent');
        expect(rotated.refreshToken).toBeDefined();
        expect(rotated.refreshToken).not.toBe(tokens.refreshToken);

        const [sessionId, tokenValue] = rotated.refreshToken.split(':');
        const dbSession = await prisma.session.findUnique({
          where: { tenantId_id: { tenantId, id: sessionId } },
        });
        
        // Stored hash should be updated to matches new token value
        const expectedHash = createHash('sha256').update(tokenValue).digest('hex');
        expect(dbSession!.refreshVerHash).toBe(expectedHash);
      });
    });

    it('should revoke all active user sessions upon detecting refresh token reuse', async () => {
      await tenantContext.run(tenantId, async () => {
        // Issue session
        const tokens = await service.login('session_tester', password, '127.0.0.1', 'Jest Agent');

        // First refresh succeeds and rotates the token
        const rotated1 = await service.refresh(tokens.refreshToken, '127.0.0.1', 'Jest Agent');

        // Attacking client attempts to use the original (already used) refresh token
        await expect(service.refresh(tokens.refreshToken, '127.0.0.1', 'Jest Hijacker'))
          .rejects.toThrow(UnauthorizedException);

        // Check that the session has been revoked
        const sessionId = tokens.refreshToken.split(':')[0];
        const dbSession = await prisma.session.findUnique({
          where: { tenantId_id: { tenantId, id: sessionId } },
        });
        expect(dbSession!.revokedAt).toBeDefined();
        expect(dbSession!.revokedAt).not.toBeNull();

        // Check that any concurrent active sessions are also terminated
        const activeSessions = await service.getActiveSessions(userId);
        expect(activeSessions.length).toBe(0);

        // Hijack event should exist in Outbox
        const hijacks = await prisma.outboxEvent.findMany({
          where: { tenantId, eventType: 'SessionHijackDetected' },
        });
        expect(hijacks.length).toBeGreaterThanOrEqual(1);
      });
    });
  });
});
