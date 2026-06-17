import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CryptoService } from '../crypto/crypto.service';
import * as jose from 'jose';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header (expected Bearer token)');
    }

    const token = authHeader.substring(7);
    
    try {
      // Decode JWT header to extract the kid
      const header = jose.decodeProtectedHeader(token);
      const kid = header.kid;
      if (!kid) {
        throw new UnauthorizedException('Invalid token structure (missing kid)');
      }

      // Fetch the public key from DB using kid
      const keyPair = await this.prisma.keyPair.findUnique({
        where: { kid },
      });
      if (!keyPair) {
        throw new UnauthorizedException('Token signed by an unknown key identifier');
      }

      // Verify the JWT signature and expiration
      const { payload } = await this.crypto.verifyJwt(token, keyPair.publicKeyPem, {
        issuer: 'https://kavachid.local',
      });

      // Strict FAPI 2.0 / RFC 9449 check: If token is DPoP-bound, verify the DPoP signature proof
      const cnf = (payload as any).cnf;
      if (cnf?.jkt) {
        const dpopHeader = request.headers['dpop'] as string;
        if (!dpopHeader) {
          throw new UnauthorizedException('Missing required dpop header for DPoP-bound token');
        }

        const protocol = request.secure ? 'https' : 'http';
        // Construct the expected full HTTP URL for DPoP verification
        const dpopUrl = `${protocol}://${request.headers.host}${request.originalUrl}`;
        const dpopMethod = request.method;

        const { jkt } = await this.crypto.verifyDpop(dpopHeader, dpopMethod, dpopUrl);

        if (cnf.jkt !== jkt) {
          throw new UnauthorizedException('DPoP thumbprint mismatch (token binding validation failed)');
        }
      }

      // Bind the validated user payload to the request object
      request.user = {
        sub: payload.sub,
        tenantId: payload.tenantId,
        email: payload.email,
        username: payload.username,
      };

      return true;
    } catch (err) {
      throw new UnauthorizedException(`Unauthorized: ${err.message}`);
    }
  }
}
