import { Test, TestingModule } from '@nestjs/testing';
import { CardGatewayService } from './card-gateway.service';
import { BadRequestException } from '@nestjs/common';

describe('CardGatewayService', () => {
  let service: CardGatewayService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CardGatewayService],
    }).compile();

    service = module.get<CardGatewayService>(CardGatewayService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processPayment', () => {
    const validPayment = {
      cardNumber: '4111111111111111', // Valid Visa test card
      cardHolderName: 'JOHN DOE',
      expiryMonth: '12',
      expiryYear: '2025',
      cvv: '123',
      amount: 100,
      installments: 1,
    };

    it('should approve valid Visa card', async () => {
      const result = await service.processPayment(validPayment);

      expect(result.approved).toBe(true);
      expect(result.authorizationCode).toBeDefined();
      expect(result.transactionId).toBeDefined();
      expect(result.cardBrand).toBe('VISA');
      expect(result.last4Digits).toBe('1111');
    });

    it('should approve valid Mastercard', async () => {
      const result = await service.processPayment({
        ...validPayment,
        cardNumber: '5555555555554444', // Valid Mastercard test card
      });

      expect(result.approved).toBe(true);
      expect(result.cardBrand).toBe('MASTERCARD');
      expect(result.last4Digits).toBe('4444');
    });

    it('should approve valid Amex card', async () => {
      const result = await service.processPayment({
        ...validPayment,
        cardNumber: '378282246310005', // Valid Amex test card
        cvv: '1234', // Amex uses 4 digits
      });

      expect(result.approved).toBe(true);
      expect(result.cardBrand).toBe('AMEX');
      expect(result.last4Digits).toBe('0005');
    });

    it('should reject invalid card number (Luhn)', async () => {
      await expect(
        service.processPayment({
          ...validPayment,
          cardNumber: '4111111111111112', // Invalid Luhn
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject expired card', async () => {
      await expect(
        service.processPayment({
          ...validPayment,
          expiryYear: '2020',
          expiryMonth: '01',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject invalid CVV', async () => {
      await expect(
        service.processPayment({
          ...validPayment,
          cvv: '12', // Too short
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject invalid installments', async () => {
      await expect(
        service.processPayment({
          ...validPayment,
          installments: 13, // Max is 12
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject unknown card brand', async () => {
      await expect(
        service.processPayment({
          ...validPayment,
          cardNumber: '1234567890123456', // Unknown brand but valid Luhn
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('maskCardNumber', () => {
    it('should mask card number correctly', () => {
      const masked = service.maskCardNumber('4111111111111111');
      expect(masked).toBe('411111******1111');
    });

    it('should handle card with spaces', () => {
      const masked = service.maskCardNumber('4111 1111 1111 1111');
      expect(masked).toBe('411111******1111');
    });

    it('should mask Amex card correctly', () => {
      const masked = service.maskCardNumber('378282246310005');
      expect(masked).toBe('378282*****0005');
    });
  });
});
