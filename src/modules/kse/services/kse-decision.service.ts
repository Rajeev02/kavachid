import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class KseDecisionService {
  private readonly logger = new Logger(KseDecisionService.name);

  constructor(private prisma: PrismaService) {}

  makeDecision(riskScore: number, reasons: string[], policy: any) {
    if (riskScore >= 90) {
        return { decision: 'DENY', reasonCode: 'CRITICAL_RISK', requiredControls: [] };
    }

    if (reasons.includes('NETWORK_VPN_DETECTED') && policy.securityLevel >= 3) {
        return { 
            decision: 'STEP_UP_REQUIRED', 
            reasonCode: 'NETWORK_VPN_DETECTED', 
            requiredControls: ['biometric_auth', 'otp'] 
        };
    }

    if (riskScore > policy.maxRiskScore) {
         return { 
            decision: 'STEP_UP_REQUIRED', 
            reasonCode: 'RISK_EXCEEDS_POLICY', 
            requiredControls: policy.requiredControls 
        };
    }

    return { decision: 'ALLOW', reasonCode: 'WITHIN_TOLERANCE', requiredControls: [] };
  }

  async logDecision(tenantId: string, userId: string, deviceId: string | null, sessionId: string | null, actionType: string, score: number, level: number, decision: string, metadata: any) {
      await this.prisma.auditLog.create({
          data: {
              tenantId,
              actorId: userId,
              action: `KSE_EVALUATE_${actionType}`,
              resourceType: 'KSE',
              metadata: {
                  ...metadata,
                  kse_risk_score: score,
                  kse_security_level: level,
                  kse_decision: decision
              }
          }
      });
  }
}
