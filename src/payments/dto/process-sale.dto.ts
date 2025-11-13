import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  IsOptional,
  Min,
  Length,
  Matches,
} from 'class-validator';

export class ProcessSaleDto {
  @ApiProperty({ description: 'Sale amount', example: 100.0, minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Country code (BR, US, etc.)', example: 'BR' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 2)
  country: string;

  @ApiProperty({
    description: 'Producer user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  producerId: string;

  @ApiPropertyOptional({
    description: 'Affiliate user ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsUUID()
  affiliateId?: string;

  @ApiPropertyOptional({
    description: 'Coproducer user ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsOptional()
  @IsUUID()
  coproducerId?: string;

  // Card payment simulation fields
  @ApiProperty({
    description: 'Card number (simulation only, not stored)',
    example: '4111111111111111',
    minLength: 13,
    maxLength: 19,
  })
  @IsString()
  @Length(13, 19)
  @Matches(/^[0-9]+$/, {
    message: 'Card number must contain only digits',
  })
  cardNumber: string;

  @ApiProperty({
    description: 'Cardholder name',
    example: 'JOHN DOE',
    minLength: 3,
  })
  @IsString()
  @Length(3, 100)
  cardHolderName: string;

  @ApiProperty({
    description: 'Expiry month (MM)',
    example: '12',
  })
  @IsString()
  @Matches(/^(0[1-9]|1[0-2])$/, {
    message: 'Expiry month must be between 01 and 12',
  })
  expiryMonth: string;

  @ApiProperty({
    description: 'Expiry year (YYYY)',
    example: '2025',
  })
  @IsString()
  @Matches(/^20[2-9][0-9]$/, {
    message: 'Expiry year must be a valid year (2020-2099)',
  })
  expiryYear: string;

  @ApiProperty({
    description: 'CVV (not stored)',
    example: '123',
    minLength: 3,
    maxLength: 4,
  })
  @IsString()
  @Length(3, 4)
  @Matches(/^[0-9]+$/, {
    message: 'CVV must contain only digits',
  })
  cvv: string;

  @ApiProperty({
    description: 'Number of installments (1-12)',
    example: 1,
    minimum: 1,
    maximum: 12,
  })
  @IsNumber()
  @Min(1)
  installments: number;
}
