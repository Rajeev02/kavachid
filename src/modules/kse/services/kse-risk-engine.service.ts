import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class KseRiskEngineService {
  private readonly logger = new Logger(KseRiskEngineService.name);

  constructor(private prisma: PrismaService) {}

  async calculateRiskScore(tenantId: string, userId: string, networkInfo: any, deviceFingerprint: string): Promise<{ score: number, reasons: string[] }> {
    let score = 0;
    const reasons: string[] = [];

    // 1. Device Trust
    const device = await this.prisma.device.findFirst({
        where: { tenantId, userId, fingerprint: deviceFingerprint }
    });
    if (!device) {
        score += 20;
        reasons.push('NEW_DEVICE');
    } else if (!device.isTrusted) {
        score += 10;
        reasons.push('UNTRUSTED_DEVICE');
    }

    // 2. Network Trust (VPN check)
    if (networkInfo.ipAddress.startsWith('10.') || networkInfo.ipAddress.startsWith('192.168.') || networkInfo.ipAddress === 'VPN_IP') {
        score += 40;
        reasons.push('NETWORK_VPN_DETECTED');
    }

    // 3. User Risk Profile
    const profile = await this.prisma.userRiskProfile.findUnique({
        where: { tenantId_userId: { tenantId, userId } }
    });
    
    if (profile && profile.baseRiskScore > 0) {
        score += profile.baseRiskScore;
        reasons.push('USER_BASE_RISK');
    }

    return { score: Math.min(score, 100), reasons };
  }
}
