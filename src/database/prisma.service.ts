import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private client: any;

  get db(): any {
    return this.client;
  }

  async onModuleInit() {
    // Lazy-load Prisma client to avoid build-time dependency on generated path
    const mod =
      // @ts-ignore - dynamic import path resolved at runtime
      (await import('generated/prisma').catch(() => null)) ||
      (await import('@prisma/client'));
    this.client = new (mod as any).PrismaClient();
    await this.client.$connect();
  }

  async onModuleDestroy() {
    if (this.client?.$disconnect) {
      await this.client.$disconnect();
    }
  }
}
