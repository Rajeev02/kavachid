import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { KavachCoreModule } from './modules/kavach-core.module';
import { AppController } from './app.controller';
import { KseModule } from './modules/kse/kse.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    KavachCoreModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'admin-console', 'dist'),
      serveRoot: '/admin',
    }),
    KseModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
