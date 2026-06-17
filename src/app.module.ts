import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { KavachCoreModule } from './modules/kavach-core.module';
import { AppController } from './app.controller';

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
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
