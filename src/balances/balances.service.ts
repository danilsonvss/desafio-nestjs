import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class BalancesService {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string) {
    const balance = await this.prisma.db.balance.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!balance) {
      throw new NotFoundException('Balance not found for this user');
    }

    return balance;
  }

  async findAll() {
    return this.prisma.db.balance.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        amount: 'desc',
      },
    });
  }
}
