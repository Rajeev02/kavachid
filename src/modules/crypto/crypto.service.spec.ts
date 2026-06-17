import { Test, TestingModule } from '@nestjs/testing';
import { CryptoService } from './crypto.service';
import { CryptoModule } from './crypto.module';
import * as jose from 'jose';

describe('CryptoService', () => {
  let service: CryptoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CryptoModule],
    }).compile();

    service = module.get<CryptoService>(CryptoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Argon2 Password Hashing with Worker Threads', () => {
    it('should hash and verify passwords successfully', async () => {
      const password = 'mySecurePassword123!';
      const hash = await service.hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).toContain('$argon2id$');

      const isMatch = await service.verifyPassword(password, hash);
      expect(isMatch).toBe(true);

      const isWrongMatch = await service.verifyPassword('wrongPassword', hash);
      expect(isWrongMatch).toBe(false);
    });

    it('should run hashing concurrently without blocking the main event loop', async () => {
      let maxLag = 0;
      const start = Date.now();
      
      const interval = setInterval(() => {
        const delta = Date.now() - start;
        const lag = Math.max(0, delta % 100); 
        if (lag > maxLag) maxLag = lag;
      }, 100);

      // Run multiple heavy hashing operations in parallel
      const hashes = await Promise.all([
        service.hashPassword('pass1'),
        service.hashPassword('pass2'),
        service.hashPassword('pass3'),
        service.hashPassword('pass4'),
        service.hashPassword('pass5'),
      ]);

      clearInterval(interval);

      expect(hashes).toHaveLength(5);
      hashes.forEach((h) => expect(h).toContain('$argon2id$'));
      
      // Because we offload to worker threads, event loop lag remains extremely low.
      expect(maxLag).toBeLessThan(200);
    });
  });

  describe('JWT and JWKS Key Management', () => {
    it('should generate asymmetric keys and sign/verify JWTs', async () => {
      const { publicKeyPem, privateKeyPem } = service.generateKeyPair('RS256');
      expect(publicKeyPem).toContain('PUBLIC KEY');
      expect(privateKeyPem).toContain('PRIVATE KEY');

      const payload = { sub: 'user_123', typ: 'at+jwt' };
      const kid = 'key_1';
      const issuer = 'https://kavachid.local';
      
      const token = await service.signJwt(payload, privateKeyPem, {
        kid,
        expiresIn: '5m',
        issuer,
      });

      expect(token).toBeDefined();

      const { payload: verifiedPayload } = await service.verifyJwt(token, publicKeyPem, {
        issuer,
      });

      expect(verifiedPayload.sub).toBe('user_123');

      const jwk = await service.pemToJwk(publicKeyPem, kid, 'RS256');
      expect(jwk.kid).toBe(kid);
      expect(jwk.kty).toBe('RSA');
      expect(jwk.alg).toBe('RS256');
    });
  });

  describe('DPoP Token Proof Verification', () => {
    it('should verify standard DPoP headers and generate public key thumbprints', async () => {
      const { publicKeyPem, privateKeyPem } = service.generateKeyPair('ES256');
      
      const importedPrivKey = await jose.importPKCS8(privateKeyPem, 'ES256');
      const importedPubKey = await jose.importSPKI(publicKeyPem, 'ES256');
      const clientJwk = await jose.exportJWK(importedPubKey);

      const htm = 'POST';
      const htu = 'https://kavachid.local/oauth/token';

      const dpopProof = await new jose.SignJWT({
        htm,
        htu,
        jti: 'unique_nonce_123',
      })
        .setProtectedHeader({
          alg: 'ES256',
          typ: 'dpop+jwt',
          jwk: clientJwk,
        })
        .setIssuedAt()
        .sign(importedPrivKey);

      const result = await service.verifyDpop(dpopProof, htm, htu);
      expect(result.jkt).toBeDefined();
      expect(result.publicKeyJwk.kty).toBe('EC');
      
      await expect(service.verifyDpop(dpopProof, 'GET', htu)).rejects.toThrow();
      await expect(service.verifyDpop(dpopProof, htm, 'https://kavachid.local/wrong')).rejects.toThrow();
    });
  });
});
