import { Injectable, BadRequestException } from '@nestjs/common';

/**
 * Card payment gateway simulator
 * Simulates credit card processing without real gateway integration
 */
@Injectable()
export class CardGatewayService {
  /**
   * Validates card using Luhn algorithm
   */
  private validateCardNumber(cardNumber: string): boolean {
    const digits = cardNumber.replace(/\s/g, '');
    let sum = 0;
    let isEven = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Validates card expiry date
   */
  private validateExpiry(month: string, year: string): boolean {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const expiryYear = parseInt(year, 10);
    const expiryMonth = parseInt(month, 10);

    if (expiryYear < currentYear) {
      return false;
    }

    if (expiryYear === currentYear && expiryMonth < currentMonth) {
      return false;
    }

    return true;
  }

  /**
   * Detects card brand from card number
   */
  private detectCardBrand(cardNumber: string): string {
    const firstDigits = cardNumber.substring(0, 6);

    // Visa
    if (cardNumber.startsWith('4')) {
      return 'VISA';
    }

    // Mastercard
    if (/^(5[1-5]|2[2-7])/.test(firstDigits)) {
      return 'MASTERCARD';
    }

    // Amex
    if (/^3[47]/.test(firstDigits)) {
      return 'AMEX';
    }

    // Elo
    if (
      /^(4011|438935|45[1-5]|401178|401179|431274|45[1-5]|50[4-5]|506699|5067[0-6]|5090|627780|636297|636368)/.test(
        firstDigits,
      )
    ) {
      return 'ELO';
    }

    // Hipercard
    if (/^(606282|3841)/.test(firstDigits)) {
      return 'HIPERCARD';
    }

    return 'UNKNOWN';
  }

  /**
   * Simulates payment processing
   * Returns authorization code if approved, throws error if declined
   */
  async processPayment(params: {
    cardNumber: string;
    cardHolderName: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    amount: number;
    installments: number;
  }): Promise<{
    approved: boolean;
    authorizationCode: string;
    transactionId: string;
    cardBrand: string;
    last4Digits: string;
  }> {
    const {
      cardNumber,
      cardHolderName,
      expiryMonth,
      expiryYear,
      cvv,
      amount,
      installments,
    } = params;

    // Validate card number (Luhn algorithm)
    if (!this.validateCardNumber(cardNumber)) {
      throw new BadRequestException('Invalid card number');
    }

    // Validate expiry date
    if (!this.validateExpiry(expiryMonth, expiryYear)) {
      throw new BadRequestException('Card expired');
    }

    // Validate CVV length
    if (cvv.length < 3 || cvv.length > 4) {
      throw new BadRequestException('Invalid CVV');
    }

    // Validate installments
    if (installments < 1 || installments > 12) {
      throw new BadRequestException('Installments must be between 1 and 12');
    }

    // Detect card brand
    const cardBrand = this.detectCardBrand(cardNumber);
    if (cardBrand === 'UNKNOWN') {
      throw new BadRequestException('Card brand not supported');
    }

    // Simulate specific test scenarios based on card number
    const last4 = cardNumber.slice(-4);

    // Test cards for different scenarios
    if (last4 === '0001') {
      throw new BadRequestException('Insufficient funds');
    }
    if (last4 === '0002') {
      throw new BadRequestException('Card blocked');
    }
    if (last4 === '0003') {
      throw new BadRequestException('Transaction limit exceeded');
    }
    if (last4 === '0004') {
      throw new BadRequestException('Invalid merchant');
    }

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Generate mock authorization data
    const authorizationCode = this.generateAuthCode();
    const transactionId = this.generateTransactionId();

    return {
      approved: true,
      authorizationCode,
      transactionId,
      cardBrand,
      last4Digits: last4,
    };
  }

  /**
   * Generates mock authorization code
   */
  private generateAuthCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  /**
   * Generates mock transaction ID
   */
  private generateTransactionId(): string {
    return `TXN${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  }

  /**
   * Masks card number for secure display
   */
  maskCardNumber(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\s/g, '');
    return `${cleaned.substring(0, 6)}${'*'.repeat(cleaned.length - 10)}${cleaned.slice(-4)}`;
  }
}
