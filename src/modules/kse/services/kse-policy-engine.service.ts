import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class KsePolicyEngineService {
  private readonly logger = new Logger(KsePolicyEngineService.name);

  constructor(private prisma: PrismaService) {}

  async getEffectivePolicy(tenantId: string, level: number, productName: string, featureName?: string) {
    const defaultPolicy = await this.prisma.policyRule.findFirst({
        where: { tenantId, securityLevel: level, isActive: true },
        include: { overrides: true }
    });

    if (!defaultPolicy) {
        return this.getHardcodedDefault(level);
    }

    const override = defaultPolicy.overrides.find(o => 
        o.isActive && 
        o.productName === productName && 
        (o.featureName === featureName || !o.featureName)
    );

    if (override) {
        this.logger.log(`Applying config override for ${productName}`);
        return {
            securityLevel: defaultPolicy.securityLevel,
            maxRiskScore: defaultPolicy.maxRiskScore,
            requiredControls: override.downgradedControls,
            isOverride: true
        };
    }

    return {
        securityLevel: defaultPolicy.securityLevel,
        maxRiskScore: defaultPolicy.maxRiskScore,
        requiredControls: defaultPolicy.requiredControls,
        isOverride: false
    };
  }

  private getHardcodedDefault(level: number) {
      if (level >= 3) {
          return { securityLevel: level, maxRiskScore: 50, requiredControls: ['biometric_auth', 'otp'], isOverride: false };
      }
      return { securityLevel: level, maxRiskScore: 75, requiredControls: ['jwt'], isOverride: false };
  }
}
