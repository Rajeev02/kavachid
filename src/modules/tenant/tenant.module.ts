import { Global, Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TenantContext } from './tenant.context';
import { TenantMiddleware } from './tenant.middleware';
import { TenantGuard } from './tenant.guard';

@Global()
@Module({
  providers: [TenantContext, TenantGuard],
  exports: [TenantContext, TenantGuard],
})
export class TenantModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
