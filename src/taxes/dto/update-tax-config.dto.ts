import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateTaxConfigDto } from './create-tax-config.dto.js';

export class UpdateTaxConfigDto extends PartialType(CreateTaxConfigDto) {}
