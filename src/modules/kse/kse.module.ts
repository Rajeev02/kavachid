import { Module } from '@nestjs/common';
import { KseController } from './kse.controller';
import { KseRiskEngineService } from './services/kse-risk-engine.service';
import { KsePolicyEngineService } from './services/kse-policy-engine.service';
import { KseDecisionService } from './services/kse-decision.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [KseController],
  providers: [KseRiskEngineService, KsePolicyEngineService, KseDecisionService],
  exports: [KseRiskEngineService, KsePolicyEngineService, KseDecisionService],
})
export class KseModule {}
