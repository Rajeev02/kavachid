import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { KeyPairService } from './keypair.service';
import { TenantGuard } from '../tenant/tenant.guard';

@Controller()
export class KeyPairController {
  constructor(private readonly keyPairService: KeyPairService) {}

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
