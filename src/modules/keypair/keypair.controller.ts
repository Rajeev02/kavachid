import { Controller, Get, Post, Query, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { KeyPairService } from './keypair.service';
import { TenantGuard } from '../tenant/tenant.guard';

@Controller()
export class KeyPairController {
  constructor(private readonly keyPairService: KeyPairService) {}

  @Get('.well-known/openid-configuration')
  async getOpenidConfiguration(@Req() req: Request) {
    const protocol = req.secure ? 'https' : 'http';
    const baseUrl = `${protocol}://${req.headers.host}`;
    return {
      issuer: baseUrl,
      authorization_endpoint: `${baseUrl}/oauth/authorize`,
      token_endpoint: `${baseUrl}/auth/login`,
      userinfo_endpoint: `${baseUrl}/users/profile`,
      jwks_uri: `${baseUrl}/oauth/jwks`,
      scopes_supported: ['openid', 'profile', 'email', 'offline_access'],
      response_types_supported: ['code', 'token', 'id_token'],
      subject_types_supported: ['public'],
      id_token_signing_alg_values_supported: ['RS256', 'ES256'],
      claims_supported: ['sub', 'iss', 'aud', 'exp', 'iat', 'email', 'username'],
      dpop_signing_alg_values_supported: ['ES256', 'RS256'],
    };
  }

  @Get('.well-known/jwks.json')
  async getWellKnownJwks(@Query('alg') alg: 'RS256' | 'ES256' = 'RS256') {
    return this.keyPairService.getPublicJwks(alg);
  }

  @Get('oauth/jwks')
  async getOauthJwks(@Query('alg') alg: 'RS256' | 'ES256' = 'RS256') {
    return this.keyPairService.getPublicJwks(alg);
  }

  @Post('admin/keys/rotate')
  @UseGuards(TenantGuard)
  async rotateKeys(@Query('alg') alg: 'RS256' | 'ES256' = 'RS256') {
    const result = await this.keyPairService.rotateKeys(alg);
    return {
      message: 'Signing keys rotated successfully',
      ...result,
    };
  }
}
