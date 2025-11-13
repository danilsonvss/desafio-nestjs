import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../database/prisma.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: PrismaService,
          useValue: {
            db: {
              taxConfig: { findUnique: jest.fn() },
              user: { findFirst: jest.fn() },
              balance: { update: jest.fn() },
              transaction: { create: jest.fn() },
              $transaction: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have processSale method', () => {
    expect(service.processSale).toBeDefined();
  });
});
