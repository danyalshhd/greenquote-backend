import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaClient } from '@prisma/client';
import configuration from '../config/configuration';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { AuthController } from './auth.controller';

const config = configuration();

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || config.jwt.secret,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || config.jwt.expiresIn }
    })
  ],
  providers: [
    AuthService,
    {
      provide: 'PRISMA',
      useValue: new PrismaClient()
    },
    JwtStrategy,
  ],
  controllers: [AuthController],
  exports: [AuthService]
})
export class AuthModule {}
