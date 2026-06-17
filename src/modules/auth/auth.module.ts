import { Global, Module } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { PermissionsGuard } from './permissions.guard';

@Global()
@Module({
  providers: [AuthGuard, PermissionsGuard],
  exports: [AuthGuard, PermissionsGuard],
})
export class AuthModule {}
