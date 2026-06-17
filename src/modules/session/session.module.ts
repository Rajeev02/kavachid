import { Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { SessionController } from './session.controller';
import { WebauthnService } from './webauthn.service';
import { WebauthnController } from './webauthn.controller';

@Module({
  controllers: [SessionController, WebauthnController],
  providers: [SessionService, WebauthnService],
})
export class SessionModule {}
