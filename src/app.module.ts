import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import configuration from './config/configuration';
import { AuthModule } from './auth/auth.module';
import { QuotesModule } from './quotes/quotes.module';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    AuthModule,
    UsersModule,
    QuotesModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'PRISMA',
      useValue: new PrismaClient(),
    },
  ],
})
export class AppModule {}
