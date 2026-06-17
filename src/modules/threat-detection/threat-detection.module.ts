import { Module } from '@nestjs/common';
import { ThreatDetectionWorker } from './threat-detection.worker';
import { DatabaseModule } from '../database/database.module';
import { OutboxModule } from '../outbox/outbox.module';

@Module({
  imports: [DatabaseModule, OutboxModule],
  providers: [ThreatDetectionWorker],
  exports: [ThreatDetectionWorker],
})
export class ThreatDetectionModule {}
