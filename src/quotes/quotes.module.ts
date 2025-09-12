import { Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';
import { RedisService } from '../services/redis.service';

@Module({
  controllers: [QuotesController],
  providers: [
    QuotesService,
    RedisService,
    {
      provide: 'PRISMA',
      useValue: new PrismaClient(),
    },
  ],
})
export class QuotesModule {}
