import { generateCodeVerifier, generateCodeChallenge } from '../src/pkce';
import { DPoPKeyManager } from '../src/dpop';
import { KavachClient } from '../src/index';
import { MemoryStorageProvider } from '../src/storage';

describe('KavachClient SDK Suite', () => {
  describe('PKCE Helper functions', () => {
    it('should generate code verifier of specified length', () => {
      const verifier = generateCodeVerifier(43);
      expect(verifier).toHaveLength(43);
      expect(verifier).toMatch(/^[A-Za-z0-9\-\._~]+$/);
    });

    it('should compute base64url SHA-256 challenge correctly', async () => {
      // test vector: challenge of verifier 'test_verifier_value_for_pkce_challenge_vector'
      // SHA-256 hash of this verifier base64url encoded
      const verifier = 'test_verifier_value_for_pkce_challenge_vector';
      const challenge = await generateCodeChallenge(verifier);
      expect(challenge).toBeDefined();
      expect(challenge).not.toContain('+');
      expect(challenge).not.toContain('/');
      expect(challenge).not.toContain('=');
    });
  });

  describe('DPoP Key Manager', () => {
    let keyManager: DPoPKeyManager;

    beforeEach(() => {
      keyManager = new DPoPKeyManager();
    });

    it('should generate ECDSA keys and export JWK', async () => {
      const jwk = await keyManager.getJwk();
      expect(jwk).toBeDefined();
      expect(jwk.kty).toBe('EC');
      expect(jwk.crv).toBe('P-256');
      expect(jwk.x).toBeDefined();
      expect(jwk.y).toBeDefined();
    });

    it('should generate unique thumbprint (jkt)', async () => {
      const thumbprint = await keyManager.getThumbprint();
      expect(thumbprint).toBeDefined();
      expect(thumbprint.length).toBeGreaterThan(10);
    });

    it('should sign request and create three-part JWT proof', async () => {
      const proof = await keyManager.createProof('GET', 'http://localhost:3000/auth/sessions');
      expect(proof).toBeDefined();
      const parts = proof.split('.');
      expect(parts).toHaveLength(3);

      // Verify header contents
      const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
      expect(header.typ).toBe('dpop+jwt');
      expect(header.alg).toBe('ES256');
      expect(header.jwk).toBeDefined();

      // Verify payload contents
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      expect(payload.htm).toBe('GET');
      expect(payload.htu).toBe('http://localhost:3000/auth/sessions');
      expect(payload.iat).toBeLessThanOrEqual(Math.floor(Date.now() / 1000));
      expect(payload.jti).toBeDefined();
    });
  });

  describe('KavachClient Session & Auth Flow', () => {
    let client: KavachClient;
    let storage: MemoryStorageProvider;
    let globalFetchBackup: typeof globalThis.fetch;

    beforeEach(() => {
      storage = new MemoryStorageProvider();
      client = new KavachClient({
        serverUrl: 'http://localhost:3000',
        tenantId: '123e4567-e89b-12d3-a456-426614174000',
        storage,
      });
      globalFetchBackup = globalThis.fetch;
    });

    afterEach(() => {
      globalThis.fetch = globalFetchBackup;
    });

    it('should login, receive tokens, and save to storage', async () => {
      const mockLoginResponse = {
        accessToken: 'access-jwt-mock',
        refreshToken: 'refresh-jwt-mock:token',
        user: { id: 'user-uuid' },
      };

      globalThis.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          status: 201,
          json: () => Promise.resolve(mockLoginResponse),
        })
      );

      const data = await client.login('admin@kavachid.local', 'SuperSecretPass!');
      expect(data.accessToken).toBe('access-jwt-mock');
      expect(data.refreshToken).toBe('refresh-jwt-mock:token');

      // Verify saved in storage
      expect(await client.getAccessToken()).toBe('access-jwt-mock');
      expect(await client.getRefreshToken()).toBe('refresh-jwt-mock:token');
    });

    it('should refresh tokens, rotating session values', async () => {
      await storage.setItem('kavach_refresh_token', 'old-refresh-token:value');

      const mockRefreshResponse = {
        accessToken: 'new-access-jwt-mock',
        refreshToken: 'new-refresh-token:value',
      };

      globalThis.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          status: 201,
          json: () => Promise.resolve(mockRefreshResponse),
        })
      );

      const data = await client.refresh();
      expect(data.accessToken).toBe('new-access-jwt-mock');
      expect(data.refreshToken).toBe('new-refresh-token:value');

      expect(await client.getAccessToken()).toBe('new-access-jwt-mock');
      expect(await client.getRefreshToken()).toBe('new-refresh-token:value');
    });

    it('should perform authenticatedFetch and handle auto token refresh on 401', async () => {
      await storage.setItem('kavach_access_token', 'expired-access-token');
      await storage.setItem('kavach_refresh_token', 'refresh-token');

      const mockRefreshResponse = {
        accessToken: 'valid-access-token',
        refreshToken: 'rotated-refresh-token',
      };

      // Mock fetch to fail with 401 first, then succeed on retry, and mock refresh call
      const fetchMock = jest.fn();
      fetchMock
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: false,
            status: 401,
          })
        ) // Initial call fails
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            status: 201,
            json: () => Promise.resolve(mockRefreshResponse),
          })
        ) // Silent refresh succeeds
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ success: true, payload: 'data' }),
          })
        ); // Retried call succeeds

      globalThis.fetch = fetchMock;

      const res = await client.authenticatedFetch('/auth/sessions');
      const resData = await res.json();

      expect(resData.success).toBe(true);
      expect(resData.payload).toBe('data');

      // Verify that tokens were updated in storage
      expect(await client.getAccessToken()).toBe('valid-access-token');
      expect(await client.getRefreshToken()).toBe('rotated-refresh-token');

      // 3 calls total: 1st fetch (fail), refresh, retry fetch (success)
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
  });
});
