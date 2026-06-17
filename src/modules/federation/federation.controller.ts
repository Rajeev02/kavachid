import { Controller, Get, Param, Query, Req, Res, UseGuards, BadRequestException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { FederationService } from './federation.service';
import { TenantGuard } from '../tenant/tenant.guard';

@Controller('auth/federation')
@UseGuards(TenantGuard)
export class FederationController {
  constructor(private readonly federationService: FederationService) {}

  @Get(':provider/login')
  async login(
    @Param('provider') provider: string,
    @Query('redirect_uri') redirectUri: string,
    @Res() res: Response
  ) {
    if (!['google', 'microsoft'].includes(provider)) {
      throw new BadRequestException('Unsupported provider');
    }

    const authUrl = await this.federationService.getAuthorizationUrl(provider, redirectUri);
    // Redirect the user to the provider's consent screen
    res.redirect(authUrl);
  }

  @Get(':provider/callback')
  async callback(
    @Param('provider') provider: string,
    @Query('code') code: string,
    @Query('state') state: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    if (!code) {
      throw new BadRequestException('Authorization code is missing');
    }

    const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // State could contain the original redirectUri, we'll extract it in service
    const { accessToken, refreshToken, redirectUri } = await this.federationService.handleCallback(
      provider,
      code,
      state,
      ipAddress,
      userAgent
    );

    // Redirect back to the frontend application with the tokens
    // E.g. http://localhost:8080/callback?access_token=...&refresh_token=...
    const url = new URL(redirectUri);
    url.searchParams.set('access_token', accessToken);
    url.searchParams.set('refresh_token', refreshToken);

    res.redirect(url.toString());
  }
}
