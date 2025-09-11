import { Injectable, Inject } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
}
