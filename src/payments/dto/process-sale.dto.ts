import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsUUID, IsOptional, Min } from 'class-validator';

export class ProcessSaleDto {
  @ApiProperty({ description: 'Sale amount', example: 100.0, minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Country code (BR, US, etc.)', example: 'BR' })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({ description: 'Producer user ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  producerId: string;

  @ApiPropertyOptional({ description: 'Affiliate user ID', example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsOptional()
  @IsUUID()
  affiliateId?: string;

  @ApiPropertyOptional({ description: 'Coproducer user ID', example: '123e4567-e89b-12d3-a456-426614174002' })
  @IsOptional()
  @IsUUID()
  coproducerId?: string;
}
