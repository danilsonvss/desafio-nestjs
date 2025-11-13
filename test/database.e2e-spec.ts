import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    
    await app.init();
  });

  afterAll(async () => {
    // Clean up test data
    if (prisma?.db) {
      await prisma.db.commission.deleteMany({});
      await prisma.db.transaction.deleteMany({});
      await prisma.db.balance.deleteMany({});
      await prisma.db.user.deleteMany({});
      await prisma.db.taxConfig.deleteMany({});
    }
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  describe('Database Integration', () => {
    it('should connect to database', async () => {
      expect(prisma.db).toBeDefined();
    });

    it('should create and retrieve tax config', async () => {
      const taxConfig = await prisma.db.taxConfig.create({
        data: {
          country: 'TEST',
          rate: 0.10,
          fixedFee: 1.0,
        },
      });

      expect(taxConfig).toBeDefined();
      expect(taxConfig.country).toBe('TEST');
      expect(Number(taxConfig.rate)).toBe(0.10);

      const retrieved = await prisma.db.taxConfig.findUnique({
        where: { country: 'TEST' },
      });

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(taxConfig.id);

      // Cleanup
      await prisma.db.taxConfig.delete({
        where: { country: 'TEST' },
      });
    });

    it('should create user with balance', async () => {
      const user = await prisma.db.user.create({
        data: {
          email: 'test-e2e@example.com',
          name: 'Test User E2E',
          role: 'PRODUCER',
          balance: {
            create: {
              amount: 100.0,
            },
          },
        },
        include: {
          balance: true,
        },
      });

      expect(user).toBeDefined();
      expect(user.email).toBe('test-e2e@example.com');
      expect(user.balance).toBeDefined();
      expect(Number(user.balance?.amount)).toBe(100.0);

      // Cleanup
      await prisma.db.balance.delete({
        where: { userId: user.id },
      });
      await prisma.db.user.delete({
        where: { id: user.id },
      });
    });

    it('should create transaction with commissions', async () => {
      // Setup: create users
      const producer = await prisma.db.user.create({
        data: {
          email: 'producer-e2e@test.com',
          name: 'Producer E2E',
          role: 'PRODUCER',
          balance: { create: { amount: 0 } },
        },
      });

      const platform = await prisma.db.user.create({
        data: {
          email: 'platform-e2e@test.com',
          name: 'Platform E2E',
          role: 'PLATFORM',
          balance: { create: { amount: 0 } },
        },
      });

      // Create transaction with commissions
      const transaction = await prisma.db.transaction.create({
        data: {
          amount: 100.0,
          country: 'BR',
          commissions: {
            create: [
              {
                userId: producer.id,
                type: 'PRODUCER',
                amount: 70.0,
              },
              {
                userId: platform.id,
                type: 'PLATFORM',
                amount: 30.0,
              },
            ],
          },
        },
        include: {
          commissions: true,
        },
      });

      expect(transaction).toBeDefined();
      expect(transaction.commissions).toHaveLength(2);
      expect(Number(transaction.amount)).toBe(100.0);

      // Cleanup
      await prisma.db.commission.deleteMany({
        where: { transactionId: transaction.id },
      });
      await prisma.db.transaction.delete({
        where: { id: transaction.id },
      });
      await prisma.db.balance.deleteMany({
        where: { userId: { in: [producer.id, platform.id] } },
      });
      await prisma.db.user.deleteMany({
        where: { id: { in: [producer.id, platform.id] } },
      });
    });
  });
});
