import { Request, Response, NextFunction } from 'express';
import * as jose from 'jose';

export interface KavachExpressOptions {
  serverUrl: string; // The KavachID server url (e.g. http://localhost:3000)
  requiredTenantId?: string; // If set, enforces that requests match this tenant
}

export interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    tenantId: string;
    email?: string;
    username?: string;
    [key: string]: any;
  };
  tenantId?: string;
}

/**
 * Express middleware to authenticate requests locally using KavachID JWKS.
 */
export function kavachAuth(options: KavachExpressOptions) {
  const jwksUrl = `${options.serverUrl.endsWith('/') ? options.serverUrl.slice(0, -1) : options.serverUrl}/oauth/jwks`;
  
  // Initialize standard JWKS remote keyset resolver (jose caches results automatically)
  const JWKS = jose.createRemoteJWKSet(new URL(jwksUrl));

  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or invalid Authorization header (expected Bearer token)' });
    }

    const token = authHeader.substring(7);
    const tenantHeader = req.headers['x-tenant-id'] as string;

    try {
      // 1. Verify the JWT signature against the remote JWKS
      const { payload } = await jose.jwtVerify(token, JWKS);
      
      const sub = payload.sub;
      const tenantId = payload.tenantId as string;

      if (!sub || !tenantId) {
        return res.status(401).json({ message: 'Invalid token claims (missing sub or tenantId)' });
      }

      // 2. Validate tenant context consistency
      if (options.requiredTenantId && options.requiredTenantId !== tenantId) {
        return res.status(403).json({ message: 'Forbidden: Tenant context mismatch' });
      }

      if (tenantHeader && tenantHeader !== tenantId) {
        return res.status(403).json({ message: 'Forbidden: Request tenant header does not match token context' });
      }

      // 3. Strict DPoP validation (RFC 9449): If token is bound, verify the dpop proof
      const cnf = (payload as any).cnf;
      if (cnf?.jkt) {
        const dpopHeader = req.headers['dpop'] as string;
        if (!dpopHeader) {
          return res.status(401).json({ message: 'Missing required dpop signature header' });
        }

        // Parse and verify DPoP proof signature using client's public JWK sent in proof header
        const dpopHeaderDecoded = jose.decodeProtectedHeader(dpopHeader);
        if (dpopHeaderDecoded.typ !== 'dpop+jwt' || !dpopHeaderDecoded.jwk) {
          return res.status(401).json({ message: 'Invalid DPoP header structure' });
        }

        const clientPublicKey = await jose.importJWK(dpopHeaderDecoded.jwk, dpopHeaderDecoded.alg);
        const { payload: dpopPayload } = await jose.jwtVerify(dpopHeader, clientPublicKey);

        // Validate htm (HTTP Method) and htu (HTTP URL)
        const expectedMethod = req.method;
        const protocol = req.secure ? 'https' : 'http';
        const expectedUrl = `${protocol}://${req.headers.host}${req.originalUrl}`.split('?')[0].split('#')[0];
        const dpopUrl = (dpopPayload.htu as string).split('?')[0].split('#')[0];

        if (dpopPayload.htm !== expectedMethod) {
          return res.status(401).json({ message: 'DPoP proof HTTP method mismatch' });
        }
        if (expectedUrl !== dpopUrl) {
          return res.status(401).json({ message: 'DPoP proof HTTP URL mismatch' });
        }

        // Validate thumbprint (jkt)
        const jkt = await jose.calculateJwkThumbprint(dpopHeaderDecoded.jwk);
        if (cnf.jkt !== jkt) {
          return res.status(401).json({ message: 'DPoP thumbprint verification failed' });
        }
      }

      // Bind context to request
      req.user = {
        sub,
        tenantId,
        email: payload.email as string,
        username: payload.username as string,
      };
      req.tenantId = tenantId;

      return next();
    } catch (err: any) {
      return res.status(401).json({ message: `Authentication failed: ${err.message}` });
    }
  };
}
