import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { KseController } from './src/modules/kse/kse.controller';
import { PrismaService } from './src/modules/database/prisma.service';
import { EvaluateRequestDto } from './src/modules/kse/dto/evaluate.dto';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const kseController = app.get(KseController);
  const db = app.get(PrismaService);

  console.log('--- Setting up Mock Data ---');
  // Create a mock tenant and user for testing
  let tenant = await db.tenant.findFirst();
  if (!tenant) {
      tenant = await db.tenant.create({ data: { name: 'Test Tenant' } });
  }

  let user = await db.user.findFirst();
  if (!user) {
      user = await db.user.create({ data: { tenantId: tenant.id, email: 'test@kavach.com' } });
  }

  // 1. Setup Global Policy Level 3
  const policy = await db.policyRule.create({
      data: {
          tenantId: tenant.id,
          securityLevel: 3,
          minRiskScore: 0,
          maxRiskScore: 50,
          requiredControls: ['jwt', 'otp'],
          isActive: true
      }
  });

  // 2. Setup Product Override (e.g. Travel is less strict)
  await db.productConfigOverride.create({
      data: {
          tenantId: tenant.id,
          policyRuleId: policy.id,
          productName: 'Kavach Travel',
          featureName: 'Browse',
          downgradedControls: ['jwt'],
          justification: 'Browsing flights needs low friction',
          isActive: true
      }
  });

  console.log('--- Running Tests ---');

  // Test 1: Level 3 action with VPN (Should enforce step-up regardless of override, because of the strict VPN logic in DecisionService)
  console.log('\n[Test 1] Financial Action over VPN (Level 3)');
  const req1: EvaluateRequestDto = {
      requestId: 'req_1',
      tenantId: tenant.id,
      userId: user.id,
      sessionId: 'sess_1',
      targetSecurityLevel: 3,
      actionType: 'transfer',
      productName: 'Kavach Wallet',
      deviceFingerprint: 'mock_fingerprint',
      network: { ipAddress: 'VPN_IP', userAgent: 'test' } // Trigger VPN
  };
  const res1 = await kseController.evaluate(req1);
  console.log(res1);

  // Test 2: Level 3 action, normal IP, but Kavach Travel override applies
  console.log('\n[Test 2] Travel Action (Level 3) with Product Override');
  const req2: EvaluateRequestDto = {
      requestId: 'req_2',
      tenantId: tenant.id,
      userId: user.id,
      sessionId: 'sess_1',
      targetSecurityLevel: 3,
      actionType: 'browse_flight',
      productName: 'Kavach Travel', // Trigger Override
      featureName: 'Browse',
      deviceFingerprint: 'mock_fingerprint',
      network: { ipAddress: '8.8.8.8', userAgent: 'test' } // Normal IP
  };
  const res2 = await kseController.evaluate(req2);
  console.log(res2);

  await app.close();
}

bootstrap().catch(err => {
  console.error(err);
  process.exit(1);
});
