import { Global, Module } from '@nestjs/common';
import { CryptoService } from './crypto.service';
import { KavachConfigModule } from '../kavach-config.module';

@Global()
@Module({
  imports: [KavachConfigModule],
  providers: [CryptoService],
  exports: [CryptoService],
})
export class CryptoModule {}
