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
