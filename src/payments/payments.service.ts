import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ProcessSaleDto } from './dto/process-sale.dto';
import { CardGatewayService } from './card-gateway.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cardGateway: CardGatewayService,
  ) {}

  async processSale(dto: ProcessSaleDto) {
    const {
      amount,
      country,
      producerId,
      affiliateId,
      coproducerId,
      cardNumber,
      cardHolderName,
      expiryMonth,
      expiryYear,
      cvv,
      installments,
    } = dto;

    // Step 1: Process card payment (simulation)
    const paymentResult = await this.cardGateway.processPayment({
      cardNumber,
      cardHolderName,
      expiryMonth,
      expiryYear,
      cvv,
      amount,
      installments,
    });

    // Step 2: Get tax config for country
    const taxConfig = await this.prisma.db.taxConfig.findUnique({
      where: { country },
    });

    if (!taxConfig) {
      throw new Error(`Tax configuration not found for country: ${country}`);
    }

    // Step 3: Calculate tax
    const taxRate = Number(taxConfig.rate);
    const fixedFee = Number(taxConfig.fixedFee || 0);
    const taxAmount = amount * taxRate + fixedFee;
    const netAmount = amount - taxAmount;

    // Step 4: Calculate commissions (simple commission split)
    const platformCommission = netAmount * 0.05; // 5% platform fee
    const remainingAmount = netAmount - platformCommission;

    let producerAmount = remainingAmount;
    let affiliateAmount = 0;
    let coproducerAmount = 0;

    if (affiliateId) {
      affiliateAmount = remainingAmount * 0.1; // 10% to affiliate
      producerAmount -= affiliateAmount;
    }

    if (coproducerId) {
      coproducerAmount = remainingAmount * 0.15; // 15% to coproducer
      producerAmount -= coproducerAmount;
    }

    // Step 5: Get platform user
    const platform = await this.prisma.db.user.findFirst({
      where: { role: 'PLATFORM' },
    });

    if (!platform) {
      throw new Error('Platform user not found');
    }

    // Step 6: Create transaction with commissions and update balances atomically
    const result = await this.prisma.db.$transaction(async (tx) => {
      // Create transaction
      const transaction = await tx.transaction.create({
        data: {
          amount,
          country,
          commissions: {
            create: [
              {
                userId: producerId,
                type: 'PRODUCER',
                amount: producerAmount,
              },
              {
                userId: platform.id,
                type: 'PLATFORM',
                amount: platformCommission,
              },
              ...(affiliateId
                ? [
                    {
                      userId: affiliateId,
                      type: 'AFFILIATE' as const,
                      amount: affiliateAmount,
                    },
                  ]
                : []),
              ...(coproducerId
                ? [
                    {
                      userId: coproducerId,
                      type: 'COPRODUCER' as const,
                      amount: coproducerAmount,
                    },
                  ]
                : []),
            ],
          },
        },
        include: {
          commissions: true,
        },
      });

      // Update balances
      await tx.balance.update({
        where: { userId: producerId },
        data: { amount: { increment: producerAmount } },
      });

      await tx.balance.update({
        where: { userId: platform.id },
        data: { amount: { increment: platformCommission } },
      });

      if (affiliateId) {
        await tx.balance.update({
          where: { userId: affiliateId },
          data: { amount: { increment: affiliateAmount } },
        });
      }

      if (coproducerId) {
        await tx.balance.update({
          where: { userId: coproducerId },
          data: { amount: { increment: coproducerAmount } },
        });
      }

      return transaction;
    });

    return {
      transactionId: result.id,
      grossAmount: amount,
      taxAmount,
      netAmount,
      commissions: result.commissions.map((c) => ({
        type: c.type,
        amount: Number(c.amount),
      })),
      payment: {
        approved: paymentResult.approved,
        authorizationCode: paymentResult.authorizationCode,
        cardBrand: paymentResult.cardBrand,
        last4Digits: paymentResult.last4Digits,
        installments,
      },
    };
  }
}
