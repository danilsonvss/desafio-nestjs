import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min, Max, IsOptional } from 'class-validator';

export class CreateTaxConfigDto {
  @ApiProperty({
    description: 'Country code (ISO 3166-1 alpha-2)',
    example: 'BR',
  })
  @IsString()
  country: string;

  @ApiProperty({
    description: 'Tax rate (percentage as decimal, e.g., 0.20 for 20%)',
    example: 0.20,
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  rate: number;

  @ApiProperty({
    description: 'Fixed fee per transaction',
    example: 2.0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fixedFee?: number;
}
