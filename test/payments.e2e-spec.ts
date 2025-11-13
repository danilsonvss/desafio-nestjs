import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('Payments (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let producer: any;
  let affiliate: any;
  let coproducer: any;
  let platform: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);

    await app.init();

    // Setup test data
    await prisma.db.taxConfig.upsert({
      where: { country: 'BR' },
      update: {},
      create: {
        country: 'BR',
        rate: 0.20,
        fixedFee: 2.0,
      },
    });

    await prisma.db.taxConfig.upsert({
      where: { country: 'US' },
      update: {},
      create: {
        country: 'US',
        rate: 0.15,
        fixedFee: 1.5,
      },
    });

    producer = await prisma.db.user.create({
      data: {
        email: 'producer-payment@test.com',
        name: 'Producer',
        role: 'PRODUCER',
        balance: { create: { amount: 0 } },
      },
    });

    affiliate = await prisma.db.user.create({
      data: {
        email: 'affiliate-payment@test.com',
        name: 'Affiliate',
        role: 'AFFILIATE',
        balance: { create: { amount: 0 } },
      },
    });

    coproducer = await prisma.db.user.create({
      data: {
        email: 'coproducer-payment@test.com',
        name: 'Coproducer',
        role: 'COPRODUCER',
        balance: { create: { amount: 0 } },
      },
    });

    platform = await prisma.db.user.create({
      data: {
        email: 'platform-payment@test.com',
        name: 'Platform',
        role: 'PLATFORM',
        balance: { create: { amount: 0 } },
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.db.commission.deleteMany({});
    await prisma.db.transaction.deleteMany({});
    await prisma.db.balance.deleteMany({
      where: {
        userId: {
          in: [producer.id, affiliate.id, coproducer.id, platform.id],
        },
      },
    });
    await prisma.db.user.deleteMany({
      where: {
        id: { in: [producer.id, affiliate.id, coproducer.id, platform.id] },
      },
    });

    await app.close();
  });

  it('should process sale with producer only (BR)', async () => {
    const response = await request(app.getHttpServer())
      .post('/payments')
      .send({
        amount: 100,
        country: 'BR',
        producerId: producer.id,
        cardNumber: '4111111111111111',
        cardHolderName: 'JOHN DOE',
        expiryMonth: '12',
        expiryYear: '2025',
        cvv: '123',
        installments: 1,
      })
      .expect(201);

    expect(response.body).toHaveProperty('transactionId');
    expect(response.body.grossAmount).toBe(100);
    expect(response.body.taxAmount).toBe(22); // 20% + R$2 fixed
    expect(response.body.netAmount).toBe(78);
    expect(response.body.commissions).toHaveLength(2);

    // Verify payment info
    expect(response.body.payment).toMatchObject({
      approved: true,
      cardBrand: 'VISA',
      last4Digits: '1111',
      installments: 1,
    });

    // Verify balances were updated
    const updatedProducer = await prisma.db.balance.findUnique({
      where: { userId: producer.id },
    });
    expect(Number(updatedProducer?.amount)).toBeGreaterThan(0);
  });

  it('should process sale with producer and affiliate (US)', async () => {
    const response = await request(app.getHttpServer())
      .post('/payments')
      .send({
        amount: 200,
        country: 'US',
        producerId: producer.id,
        affiliateId: affiliate.id,
        cardNumber: '5555555555554444',
        cardHolderName: 'JANE DOE',
        expiryMonth: '06',
        expiryYear: '2026',
        cvv: '456',
        installments: 1,
      })
      .expect(201);

    expect(response.body).toHaveProperty('transactionId');
    expect(response.body.grossAmount).toBe(200);
    expect(response.body.taxAmount).toBe(31.5); // 15% + $1.50 fixed
    expect(response.body.netAmount).toBe(168.5);
    expect(response.body.commissions).toHaveLength(3); // producer, affiliate, platform

    // Verify Mastercard payment
    expect(response.body.payment).toMatchObject({
      approved: true,
      cardBrand: 'MASTERCARD',
      last4Digits: '4444',
    });

    // Verify affiliate balance was updated
    const updatedAffiliate = await prisma.db.balance.findUnique({
      where: { userId: affiliate.id },
    });
    expect(Number(updatedAffiliate?.amount)).toBeGreaterThan(0);
  });

  it('should process sale with all participants', async () => {
    const response = await request(app.getHttpServer())
      .post('/payments')
      .send({
        amount: 500,
        country: 'BR',
        producerId: producer.id,
        affiliateId: affiliate.id,
        coproducerId: coproducer.id,
        cardNumber: '4111111111111111',
        cardHolderName: 'JOHN DOE',
        expiryMonth: '12',
        expiryYear: '2025',
        cvv: '123',
        installments: 3,
      })
      .expect(201);

    expect(response.body).toHaveProperty('transactionId');
    expect(response.body.grossAmount).toBe(500);
    expect(response.body.commissions).toHaveLength(4); // all participants

    // Verify payment with installments
    expect(response.body.payment.installments).toBe(3);

    // Verify all balances were updated
    const balances = await prisma.db.balance.findMany({
      where: {
        userId: {
          in: [producer.id, affiliate.id, coproducer.id, platform.id],
        },
      },
    });

    balances.forEach((balance) => {
      expect(Number(balance.amount)).toBeGreaterThan(0);
    });
  });

  it('should fail for unknown country', async () => {
    await request(app.getHttpServer())
      .post('/payments')
      .send({
        amount: 100,
        country: 'UNKNOWN',
        producerId: producer.id,
        cardNumber: '4111111111111111',
        cardHolderName: 'JOHN DOE',
        expiryMonth: '12',
        expiryYear: '2025',
        cvv: '123',
        installments: 1,
      })
      .expect(500);
  });

  it('should reject invalid card number', async () => {
    await request(app.getHttpServer())
      .post('/payments')
      .send({
        amount: 100,
        country: 'BR',
        producerId: producer.id,
        cardNumber: '4111111111111112', // Invalid Luhn
        cardHolderName: 'JOHN DOE',
        expiryMonth: '12',
        expiryYear: '2025',
        cvv: '123',
        installments: 1,
      })
      .expect(400);
  });

  it('should reject expired card', async () => {
    await request(app.getHttpServer())
      .post('/payments')
      .send({
        amount: 100,
        country: 'BR',
        producerId: producer.id,
        cardNumber: '4111111111111111',
        cardHolderName: 'JOHN DOE',
        expiryMonth: '01',
        expiryYear: '2020',
        cvv: '123',
        installments: 1,
      })
      .expect(400);
  });

  it('should simulate insufficient funds', async () => {
    await request(app.getHttpServer())
      .post('/payments')
      .send({
        amount: 100,
        country: 'BR',
        producerId: producer.id,
        cardNumber: '4111111111110001',
        cardHolderName: 'JOHN DOE',
        expiryMonth: '12',
        expiryYear: '2025',
        cvv: '123',
        installments: 1,
      })
      .expect(400);
  });

  it('should create transaction and commission records', async () => {
    const response = await request(app.getHttpServer())
      .post('/payments')
      .send({
        amount: 300,
        country: 'US',
        producerId: producer.id,
        cardNumber: '4111111111111111',
        cardHolderName: 'JOHN DOE',
        expiryMonth: '12',
        expiryYear: '2025',
        cvv: '123',
        installments: 1,
      })
      .expect(201);

    const transactionId = response.body.transactionId;

    // Verify transaction exists
    const transaction = await prisma.db.transaction.findUnique({
      where: { id: transactionId },
      include: { commissions: true },
    });

    expect(transaction).toBeDefined();
    expect(Number(transaction?.amount)).toBe(300);
    expect(transaction?.country).toBe('US');
    expect(transaction?.commissions.length).toBeGreaterThan(0);
  });
});
