import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { EvaluateRequestDto } from './dto/evaluate.dto';
import { KseRiskEngineService } from './services/kse-risk-engine.service';
import { KsePolicyEngineService } from './services/kse-policy-engine.service';
import { KseDecisionService } from './services/kse-decision.service';

@Controller('v1/kse')
export class KseController {
  constructor(
    private readonly riskEngine: KseRiskEngineService,
    private readonly policyEngine: KsePolicyEngineService,
    private readonly decisionService: KseDecisionService,
  ) {}

  @Post('evaluate')
  @HttpCode(200)
  async evaluate(@Body() req: EvaluateRequestDto) {
    const { score, reasons } = await this.riskEngine.calculateRiskScore(req.tenantId, req.userId, req.network, req.deviceFingerprint);
    
    const policy = await this.policyEngine.getEffectivePolicy(req.tenantId, req.targetSecurityLevel, req.productName, req.featureName);
    
    const { decision, reasonCode, requiredControls } = this.decisionService.makeDecision(score, reasons, policy);

    this.decisionService.logDecision(
        req.tenantId, 
        req.userId, 
        null, 
        req.sessionId, 
        req.actionType, 
        score, 
        req.targetSecurityLevel, 
        decision, 
        { reasons, isOverride: policy.isOverride }
    ).catch(e => console.error('Failed to log KSE decision', e));

    return {
      decision,
      risk_score: score,
      reason_code: reasonCode,
      required_controls: requiredControls,
      evaluation_id: `eval_${Date.now()}`
    };
  }
}
