import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject('PRISMA') private readonly prisma: PrismaClient,
  ) {}

  async register(fullName: string, email: string, password: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new BadRequestException('Email already registered');

    const hash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { fullName, email, password: hash },
    });
    return { id: user.id, email: user.email, fullName: user.fullName };
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    const matched = await bcrypt.compare(password, user.password);
    if (!matched) return null;
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      isAdmin: user.isAdmin,
    };
  }

  login(user: { id: string; email: string; isAdmin: boolean }) {
    const payload = { sub: user.id, email: user.email, isAdmin: user.isAdmin };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
