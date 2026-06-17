import { kavachAuth, AuthenticatedRequest } from '../src/index';
import { Response, NextFunction } from 'express';
import * as jose from 'jose';

// Mock the jose library functions to prevent real HTTP remote JWKS calls
jest.mock('jose', () => {
  const original = jest.requireActual('jose');
  return {
    ...original,
    jwtVerify: jest.fn(),
    createRemoteJWKSet: jest.fn(() => () => Promise.resolve({})),
    importJWK: jest.fn(),
    calculateJwkThumbprint: jest.fn(),
    decodeProtectedHeader: jest.fn(),
  };
});

describe('KavachID Express Middleware', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let nextFunction: NextFunction = jest.fn();

  beforeEach(() => {
    mockReq = {
      headers: {},
      method: 'GET',
      secure: false,
      originalUrl: '/api/v1/resource',
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  it('should return 401 if Authorization header is missing', async () => {
    const middleware = kavachAuth({ serverUrl: 'http://localhost:3000' });
    await middleware(mockReq as AuthenticatedRequest, mockRes as Response, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Missing or invalid Authorization header (expected Bearer token)',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 401 if Authorization header does not start with Bearer', async () => {
    mockReq.headers = { authorization: 'Basic dXNlcjpwYXNz' };
    const middleware = kavachAuth({ serverUrl: 'http://localhost:3000' });
    await middleware(mockReq as AuthenticatedRequest, mockRes as Response, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 401 if sub or tenantId is missing in token payload', async () => {
    mockReq.headers = { authorization: 'Bearer some-invalid-token' };
    (jose.jwtVerify as jest.Mock).mockResolvedValueOnce({
      payload: { email: 'user@kavach.local' }, // Missing sub and tenantId
    });

    const middleware = kavachAuth({ serverUrl: 'http://localhost:3000' });
    await middleware(mockReq as AuthenticatedRequest, mockRes as Response, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Invalid token claims (missing sub or tenantId)',
    });
  });

  it('should return 403 on tenantId mismatch with requiredTenantId config', async () => {
    mockReq.headers = { authorization: 'Bearer token-val' };
    (jose.jwtVerify as jest.Mock).mockResolvedValueOnce({
      payload: { sub: 'user-uuid', tenantId: 'tenant-1' },
    });

    const middleware = kavachAuth({
      serverUrl: 'http://localhost:3000',
      requiredTenantId: 'tenant-2', // Mismatch
    });
    await middleware(mockReq as AuthenticatedRequest, mockRes as Response, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Forbidden: Tenant context mismatch',
    });
  });

  it('should return 403 on x-tenant-id header mismatch with token tenantId', async () => {
    mockReq.headers = {
      authorization: 'Bearer token-val',
      'x-tenant-id': 'tenant-mismatch',
    };
    (jose.jwtVerify as jest.Mock).mockResolvedValueOnce({
      payload: { sub: 'user-uuid', tenantId: 'tenant-1' },
    });

    const middleware = kavachAuth({ serverUrl: 'http://localhost:3000' });
    await middleware(mockReq as AuthenticatedRequest, mockRes as Response, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Forbidden: Request tenant header does not match token context',
    });
  });

  it('should proceed to next() and populate req.user on valid token verification', async () => {
    mockReq.headers = { authorization: 'Bearer valid-token' };
    (jose.jwtVerify as jest.Mock).mockResolvedValueOnce({
      payload: { sub: 'user-uuid', tenantId: 'tenant-1', email: 'user@kavach.local' },
    });

    const middleware = kavachAuth({ serverUrl: 'http://localhost:3000' });
    await middleware(mockReq as AuthenticatedRequest, mockRes as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(mockReq.user).toEqual({
      sub: 'user-uuid',
      tenantId: 'tenant-1',
      email: 'user@kavach.local',
      username: undefined,
    });
    expect(mockReq.tenantId).toBe('tenant-1');
  });

  it('should validate DPoP claims successfully if cnf.jkt is present', async () => {
    mockReq.headers = {
      authorization: 'Bearer valid-token',
      dpop: 'dpop-header-proof',
      host: 'localhost:3000',
    };
    (jose.jwtVerify as jest.Mock)
      .mockResolvedValueOnce({
        payload: {
          sub: 'user-uuid',
          tenantId: 'tenant-1',
          cnf: { jkt: 'valid-thumbprint' },
        },
      }) // jwtVerify for auth token
      .mockResolvedValueOnce({
        payload: {
          htm: 'GET',
          htu: 'http://localhost:3000/api/v1/resource',
        },
      }); // jwtVerify for DPoP proof

    (jose.decodeProtectedHeader as jest.Mock).mockReturnValue({
      typ: 'dpop+jwt',
      jwk: { kty: 'EC' },
    });
    (jose.importJWK as jest.Mock).mockResolvedValue({});
    (jose.calculateJwkThumbprint as jest.Mock).mockResolvedValue('valid-thumbprint');

    const middleware = kavachAuth({ serverUrl: 'http://localhost:3000' });
    await middleware(mockReq as AuthenticatedRequest, mockRes as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
  });

  it('should return 401 if cnf.jkt is present but dpop signature header is missing', async () => {
    mockReq.headers = {
      authorization: 'Bearer valid-token',
    };
    (jose.jwtVerify as jest.Mock).mockResolvedValueOnce({
      payload: {
        sub: 'user-uuid',
        tenantId: 'tenant-1',
        cnf: { jkt: 'thumbprint' },
      },
    });

    const middleware = kavachAuth({ serverUrl: 'http://localhost:3000' });
    await middleware(mockReq as AuthenticatedRequest, mockRes as Response, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Missing required dpop signature header',
    });
  });
});
