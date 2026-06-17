import { Module } from '@nestjs/common';
import { FederationController } from './federation.controller';
import { FederationService } from './federation.service';
import { DatabaseModule } from '../database/database.module';
import { SessionModule } from '../session/session.module';

@Module({
  imports: [DatabaseModule, SessionModule],
  controllers: [FederationController],
  providers: [FederationService],
})
export class FederationModule {}
