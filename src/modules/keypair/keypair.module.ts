import { Global, Module } from '@nestjs/common';
import { KeyPairService } from './keypair.service';
import { KeyPairController } from './keypair.controller';

@Global()
@Module({
  controllers: [KeyPairController],
  providers: [KeyPairService],
  exports: [KeyPairService],
})
export class KeyPairModule {}
