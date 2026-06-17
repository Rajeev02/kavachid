import { Global, Module } from '@nestjs/common';
import { OutboxService } from './outbox.service';
import { KavachConfigModule } from '../kavach-config.module';

@Global()
@Module({
  imports: [KavachConfigModule],
  providers: [OutboxService],
  exports: [OutboxService],
})
export class OutboxModule {}
