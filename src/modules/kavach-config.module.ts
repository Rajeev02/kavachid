import { Global, Module } from '@nestjs/common';
import { KavachConfigService } from './kavach-config.service';

@Global()
@Module({
  providers: [KavachConfigService],
  exports: [KavachConfigService],
})
export class KavachConfigModule {}
