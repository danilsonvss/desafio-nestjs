import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../database/prisma.service';
import { CardGatewayService } from './card-gateway.service';
import { BadRequestException } from '@nestjs/common';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: PrismaService;
  let cardGateway: CardGatewayService;

  const mockPrismaService = {
    db: {
      taxConfig: { findUnique: jest.fn() },
      user: { findFirst: jest.fn() },
      balance: { update: jest.fn() },
      transaction: { create: jest.fn() },
      $transaction: jest.fn(),
    },
  };

  const mockCardGatewayService = {
    processPayment: jest.fn(),
    maskCardNumber: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CardGatewayService,
          useValue: mockCardGatewayService,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    prisma = module.get<PrismaService>(PrismaService);
    cardGateway = module.get<CardGatewayService>(CardGatewayService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have processSale method', () => {
    expect(service.processSale).toBeDefined();
  });

  describe('processSale', () => {
    const validDto = {
      amount: 100,
      country: 'BR',
      producerId: 'producer-uuid',
      affiliateId: 'affiliate-uuid',
      coproducerId: 'coproducer-uuid',
      cardNumber: '4111111111111111',
      cardHolderName: 'JOHN DOE',
      expiryMonth: '12',
      expiryYear: '2025',
      cvv: '123',
      installments: 1,
    };

    it('should process payment with card gateway', async () => {
      mockCardGatewayService.processPayment.mockResolvedValue({
        approved: true,
        authorizationCode: 'ABC123',
        transactionId: 'TXN123',
        cardBrand: 'VISA',
        last4Digits: '1111',
      });

      mockPrismaService.db.taxConfig.findUnique.mockResolvedValue({
        country: 'BR',
        rate: 0.065,
        fixedFee: 0.39,
      });

      mockPrismaService.db.user.findFirst.mockResolvedValue({
        id: 'platform-uuid',
        role: 'PLATFORM',
      });

      mockPrismaService.db.$transaction.mockImplementation((callback) =>
        callback(mockPrismaService.db),
      );

      mockPrismaService.db.transaction.create.mockResolvedValue({
        id: 'transaction-uuid',
        amount: 100,
        country: 'BR',
        commissions: [
          { type: 'PRODUCER', amount: 66.3375 },
          { type: 'PLATFORM', amount: 11.55 }, // Tax (6.89) + commission (4.66)
          { type: 'AFFILIATE', amount: 8.845 },
          { type: 'COPRODUCER', amount: 13.2675 },
        ],
      });

      const result = await service.processSale(validDto);

      expect(cardGateway.processPayment).toHaveBeenCalledWith({
        cardNumber: validDto.cardNumber,
        cardHolderName: validDto.cardHolderName,
        expiryMonth: validDto.expiryMonth,
        expiryYear: validDto.expiryYear,
        cvv: validDto.cvv,
        amount: validDto.amount,
        installments: validDto.installments,
      });

      expect(result).toHaveProperty('payment');
      expect(result.payment).toMatchObject({
        approved: true,
        authorizationCode: 'ABC123',
        cardBrand: 'VISA',
        last4Digits: '1111',
        installments: 1,
      });
    });

    it('should throw error if tax config not found', async () => {
      mockCardGatewayService.processPayment.mockResolvedValue({
        approved: true,
        authorizationCode: 'ABC123',
        transactionId: 'TXN123',
        cardBrand: 'VISA',
        last4Digits: '1111',
      });

      mockPrismaService.db.taxConfig.findUnique.mockResolvedValue(null);

      await expect(service.processSale(validDto)).rejects.toThrow(
        'Tax configuration not found for country: BR',
      );
    });

    it('should throw error if platform user not found', async () => {
      mockCardGatewayService.processPayment.mockResolvedValue({
        approved: true,
        authorizationCode: 'ABC123',
        transactionId: 'TXN123',
        cardBrand: 'VISA',
        last4Digits: '1111',
      });

      mockPrismaService.db.taxConfig.findUnique.mockResolvedValue({
        country: 'BR',
        rate: 0.065,
        fixedFee: 0.39,
      });

      mockPrismaService.db.user.findFirst.mockResolvedValue(null);

      await expect(service.processSale(validDto)).rejects.toThrow(
        'Platform user not found',
      );
    });

    it('should throw error if card payment fails', async () => {
      mockCardGatewayService.processPayment.mockRejectedValue(
        new BadRequestException('Insufficient funds'),
      );

      await expect(service.processSale(validDto)).rejects.toThrow(
        'Insufficient funds',
      );
    });
  });
});
