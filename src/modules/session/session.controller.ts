import { Controller, Post, Get, Body, Req, Query, UseGuards, ValidationPipe, UsePipes, Headers, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { SessionService } from './session.service';
import { LoginDto, RefreshDto } from './dto/session.dto';
import { TenantGuard } from '../tenant/tenant.guard';
import { CryptoService } from '../crypto/crypto.service';
import { KeyPairService } from '../keypair/keypair.service';

@Controller('auth')
@UseGuards(TenantGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class SessionController {
  constructor(
    private readonly sessionService: SessionService,
    private readonly crypto: CryptoService,
    private readonly keyPairService: KeyPairService,
  ) {}

  @Post('login')
  async login(
    @Req() req: Request,
    @Body() dto: LoginDto,
    @Headers('dpop') dpopHeader?: string
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const dpopMethod = req.method;
    
    // Construct request URL for DPoP check (can use req.url or full path)
    const protocol = req.secure ? 'https' : 'http';
    const dpopUrl = `${protocol}://${req.headers.host}${req.originalUrl}`;

    return this.sessionService.login(
      dto.identifier,
      dto.password,
      ipAddress,
      userAgent,
      dto.fingerprint,
      dpopHeader,
      dpopMethod,
      dpopUrl
    );
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Body() dto: RefreshDto,
    @Headers('dpop') dpopHeader?: string
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const dpopMethod = req.method;
    
    const protocol = req.secure ? 'https' : 'http';
    const dpopUrl = `${protocol}://${req.headers.host}${req.originalUrl}`;

    return this.sessionService.refresh(
      dto.refreshToken,
      ipAddress,
      userAgent,
      dpopHeader,
      dpopMethod,
      dpopUrl
    );
  }

  @Post('logout')
  async logout(@Body() dto: RefreshDto) {
    return this.sessionService.revoke(dto.refreshToken);
  }

  @Get('sessions')
  async getSessions(
    @Req() req: Request,
    @Query('userId') queryUserId?: string
  ) {
    let userId = queryUserId;

    // Resolve userId from Bearer token if present
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const activeKey = await this.keyPairService.getActiveKeyPair('RS256');
        const { payload } = await this.crypto.verifyJwt(token, activeKey.publicKeyPem);
        userId = payload.sub as string;
      } catch (err) {
        throw new UnauthorizedException('Invalid access token');
      }
    }

    if (!userId) {
      throw new UnauthorizedException('Authentication token or userId query parameter is required');
    }

    const sessions = await this.sessionService.getActiveSessions(userId);
    return { sessions };
  }
}
