import { Controller, Post, Get, Delete, Param, Body, Req, Query, UseGuards, ValidationPipe, UsePipes, Headers, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { SessionService } from './session.service';
import { LoginDto, RefreshDto } from './dto/session.dto';
import { TenantGuard } from '../tenant/tenant.guard';
import { CryptoService } from '../crypto/crypto.service';
import { KeyPairService } from '../keypair/keypair.service';
import { Audit } from '../audit-log/audit.decorator';

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
  @Audit({ action: 'auth.login', resourceType: 'session' })
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
  @Audit({ action: 'auth.refresh', resourceType: 'session' })
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
  @Audit({ action: 'auth.logout', resourceType: 'session' })
  async logout(@Body() dto: RefreshDto) {
    return this.sessionService.revoke(dto.refreshToken);
  }

  @Get('sessions')
  async getSessions(
    @Req() req: Request,
    @Query('userId') queryUserId?: string
  ) {
    const userId = await this.resolveUserId(req, queryUserId);
    const sessions = await this.sessionService.getActiveSessions(userId);
    return { sessions };
  }

  @Get('devices')
  async getDevices(
    @Req() req: Request,
    @Query('userId') queryUserId?: string
  ) {
    const userId = await this.resolveUserId(req, queryUserId);
    const devices = await this.sessionService.getActiveDevices(userId);
    return { devices };
  }

  @Get('me')
  async getProfile(
    @Req() req: Request,
  ) {
    const userId = await this.resolveUserId(req);
    // Fetch user details from DB using Prisma via CryptoService is hacky, but SessionService can fetch user.
    // Wait, let's inject PrismaService directly into SessionController to fetch the user profile, 
    // or just rely on the sessionService fetching it. Let's just decode it.
    // The access token already contains email, username, sub. We just return it.
    const authHeader = req.headers['authorization'];
    if (!authHeader) throw new UnauthorizedException();
    const token = authHeader.substring(7);
    const activeKey = await this.keyPairService.getActiveKeyPair('RS256');
    const { payload } = await this.crypto.verifyJwt(token, activeKey.publicKeyPem);
    return {
      user: {
        id: payload.sub,
        email: payload.email,
        username: payload.username,
        tenantId: payload.tenantId,
        joinedAt: payload.iat, // fallback
      }
    };
  }

  @Delete('sessions/all')
  @Audit({ action: 'auth.revokeAllSessions', resourceType: 'session' })
  async revokeAllSessions(
    @Req() req: Request,
  ) {
    const userId = await this.resolveUserId(req);
    await this.sessionService.revokeAllUserSessions(userId);
    return { success: true };
  }

  @Delete('sessions/:id')
  @Audit({ action: 'auth.revokeSession', resourceType: 'session' })
  async revokeSpecificSession(
    @Req() req: Request,
    @Param('id') sessionId: string
  ) {
    const userId = await this.resolveUserId(req);
    return this.sessionService.revokeSpecificSession(userId, sessionId);
  }

  private async resolveUserId(req: Request, queryUserId?: string): Promise<string> {
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
    return userId;
  }
}
