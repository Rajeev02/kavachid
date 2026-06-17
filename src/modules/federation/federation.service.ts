import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SessionService } from '../session/session.service';
import { TenantContext } from '../tenant/tenant.context';
import axios from 'axios';

@Injectable()
export class FederationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionService: SessionService,
    private readonly tenantContext: TenantContext,
  ) {}

  async getAuthorizationUrl(provider: string, redirectUri: string): Promise<string> {
    // In a real application, you'd pull these from environment variables or Tenant DB configs.
    // We encode the original redirectUri in the state so we know where to send them back.
    const state = Buffer.from(JSON.stringify({ redirectUri })).toString('base64');
    
    if (provider === 'google') {
      const clientId = process.env.GOOGLE_CLIENT_ID || 'dummy-google-client-id';
      const scope = 'openid email profile';
      const authEndpoint = 'https://accounts.google.com/o/oauth2/v2/auth';
      const callbackUri = 'http://localhost:3000/auth/federation/google/callback'; // System callback
      
      return `${authEndpoint}?client_id=${clientId}&redirect_uri=${callbackUri}&response_type=code&scope=${scope}&state=${state}`;
    }

    if (provider === 'microsoft') {
      const clientId = process.env.MS_CLIENT_ID || 'dummy-ms-client-id';
      const scope = 'openid email profile';
      const authEndpoint = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
      const callbackUri = 'http://localhost:3000/auth/federation/microsoft/callback';
      
      return `${authEndpoint}?client_id=${clientId}&redirect_uri=${callbackUri}&response_type=code&scope=${scope}&state=${state}`;
    }

    throw new BadRequestException('Provider not supported');
  }

  async handleCallback(provider: string, code: string, stateBase64: string, ipAddress: string, userAgent: string) {
    const tenantId = this.tenantContext.getRequiredTenantId();
    
    let redirectUri = 'http://localhost:8080/';
    try {
      const stateObj = JSON.parse(Buffer.from(stateBase64, 'base64').toString('utf8'));
      if (stateObj.redirectUri) redirectUri = stateObj.redirectUri;
    } catch (e) {
      // fallback
    }

    // 1. Exchange Code for Profile (Mocked out HTTP request for this implementation plan unless configured)
    // Normally you'd POST to provider's token endpoint, then GET /userinfo
    // We'll mock the resulting profile here so the system works out-of-the-box locally.
    
    let profile: any;
    if (code === 'mock-code-google') {
        profile = { id: 'g-12345', email: 'federated@google.com', name: 'Google User' };
    } else {
        // Mock default for demo
        profile = { id: `ext-${Math.random().toString(36).slice(2)}`, email: 'demo-federated@example.com', name: 'Federated User' };
    }

    // 2. Link or Create User
    let federation = await this.prisma.userFederation.findUnique({
      where: {
        tenantId_provider_providerSubject: {
          tenantId,
          provider,
          providerSubject: profile.id,
        }
      },
      include: { user: true }
    });

    let user;

    if (federation) {
      user = federation.user;
    } else {
      // JIT Provisioning
      // Check if user with email already exists
      user = await this.prisma.user.findFirst({
        where: { tenantId, email: profile.email }
      });

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            tenantId,
            email: profile.email,
            username: profile.email.split('@')[0],
            status: 'active', // Federated is pre-verified
          }
        });
      }

      // Create the Federation Link
      await this.prisma.userFederation.create({
        data: {
          tenantId,
          userId: user.id,
          provider,
          providerSubject: profile.id,
        }
      });
    }

    // 3. Issue KavachID Session
    const sessionData = await this.sessionService.createSessionForUser(user, undefined, ipAddress, userAgent);

    return {
      accessToken: sessionData.accessToken,
      refreshToken: sessionData.refreshToken,
      redirectUri,
    };
  }
}
