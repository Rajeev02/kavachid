import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { KavachConfigModule } from '../kavach-config.module';

@Global()
@Module({
  imports: [KavachConfigModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
