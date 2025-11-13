import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        balance: {
          select: {
            amount: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        balance: {
          select: {
            amount: true,
            updatedAt: true,
          },
        },
        commissions: {
          select: {
            id: true,
            type: true,
            amount: true,
            transaction: {
              select: {
                id: true,
                amount: true,
                country: true,
                createdAt: true,
              },
            },
          },
          orderBy: {
            transaction: {
              createdAt: 'desc',
            },
          },
          take: 10,
        },
      },
    });
  }
}
