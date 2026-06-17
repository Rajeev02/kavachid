import { Controller, Post, Body, Req, UseGuards, Get } from '@nestjs/common';
import { WebauthnService } from './webauthn.service';
import type { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { TenantContext } from '../tenant/tenant.context';
import { Audit } from '../audit-log/audit.decorator';

@Controller('auth/webauthn')
export class WebauthnController {
  constructor(
    private readonly webauthnService: WebauthnService,
    private readonly tenantContext: TenantContext
  ) {}

  @Post('register-options')
  @UseGuards(AuthGuard)
  @Audit({ action: 'WEBAUTHN_REGISTER_OPTIONS', resourceType: 'session' })
  async generateRegistrationOptions(@Req() req: Request) {
    const tenantId = this.tenantContext.getRequiredTenantId();
    const userId = (req as any).user.sub;
    return this.webauthnService.generateRegistrationOptions(tenantId, userId);
  }

  @Post('register-verify')
  @UseGuards(AuthGuard)
  @Audit({ action: 'WEBAUTHN_REGISTER_VERIFY', resourceType: 'session' })
  async verifyRegistrationResponse(@Req() req: Request, @Body() body: any) {
    const tenantId = this.tenantContext.getRequiredTenantId();
    const userId = (req as any).user.sub;
    return this.webauthnService.verifyRegistrationResponse(tenantId, userId, body);
  }

  @Post('login-options')
  @Audit({ action: 'WEBAUTHN_LOGIN_OPTIONS', resourceType: 'session' })
  async generateAuthenticationOptions(@Body('identifier') identifier: string) {
    const tenantId = this.tenantContext.getRequiredTenantId();
    return this.webauthnService.generateAuthenticationOptions(tenantId, identifier);
  }

  @Post('login-verify')
  @Audit({ action: 'WEBAUTHN_LOGIN_VERIFY', resourceType: 'session' })
  async verifyAuthenticationResponse(@Req() req: Request, @Body() body: any) {
    const tenantId = this.tenantContext.getRequiredTenantId();
    const identifier = body.identifier;
    const responseBody = body.response;
    const clientId = body.clientId;
    
    const ipAddress = req.ip || '0.0.0.0';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const dpopHeader = req.headers['dpop'] as string | undefined;

    return this.webauthnService.verifyAuthenticationResponse(
      tenantId,
      identifier,
      responseBody,
      dpopHeader,
      ipAddress,
      userAgent,
      clientId
    );
  }
}
