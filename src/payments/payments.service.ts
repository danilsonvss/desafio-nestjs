import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ProcessSaleDto } from './dto/process-sale.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async processSale(dto: ProcessSaleDto) {
    const { amount, country, producerId, affiliateId, coproducerId } = dto;

    // Get tax config for country
    const taxConfig = await this.prisma.db.taxConfig.findUnique({
      where: { country },
    });

    if (!taxConfig) {
      throw new Error(`Tax configuration not found for country: ${country}`);
    }

    // Calculate tax
    const taxRate = Number(taxConfig.rate);
    const fixedFee = Number(taxConfig.fixedFee || 0);
    const taxAmount = amount * taxRate + fixedFee;
    const netAmount = amount - taxAmount;

    // Simple commission split (can be made configurable)
    const platformCommission = netAmount * 0.05; // 5% platform fee
    const remainingAmount = netAmount - platformCommission;

    let producerAmount = remainingAmount;
    let affiliateAmount = 0;
    let coproducerAmount = 0;

    if (affiliateId) {
      affiliateAmount = remainingAmount * 0.10; // 10% to affiliate
      producerAmount -= affiliateAmount;
    }

    if (coproducerId) {
      coproducerAmount = remainingAmount * 0.15; // 15% to coproducer
      producerAmount -= coproducerAmount;
    }

    // Get platform user
    const platform = await this.prisma.db.user.findFirst({
      where: { role: 'PLATFORM' },
    });

    if (!platform) {
      throw new Error('Platform user not found');
    }

    // Create transaction with commissions and update balances atomically
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
    };
  }
}
