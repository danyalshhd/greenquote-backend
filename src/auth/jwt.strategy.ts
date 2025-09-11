import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import configuration from '../config/configuration';
import { PrismaClient } from '@prisma/client';
import { JwtPayload } from './types/JwtAdmin.type';

const config = configuration();

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@Inject('PRISMA') private readonly prisma: PrismaClient) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || config.jwt.secret,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) throw new UnauthorizedException('Invalid token');
    return { id: user.id, email: user.email, isAdmin: user.isAdmin };
  }
}
