import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createPrismaClient } from './prisma-client.factory.js';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private client: any;

  get db(): any {
    return this.client;
  }

  async onModuleInit() {
    this.client = await createPrismaClient();
    await this.client.$connect();
  }

  async onModuleDestroy() {
    if (this.client?.$disconnect) {
      await this.client.$disconnect();
    }
  }
}
