import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateTaxConfigDto } from './dto/create-tax-config.dto.js';
import { UpdateTaxConfigDto } from './dto/update-tax-config.dto.js';

@Injectable()
export class TaxesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTaxConfigDto) {
    const existing = await this.prisma.db.taxConfig.findUnique({
      where: { country: dto.country },
    });

    if (existing) {
      throw new ConflictException(
        `Tax configuration for country ${dto.country} already exists`,
      );
    }

    return this.prisma.db.taxConfig.create({
      data: dto,
    });
  }

  async findAll() {
    return this.prisma.db.taxConfig.findMany({
      orderBy: { country: 'asc' },
    });
  }

  async findOne(id: string) {
    const taxConfig = await this.prisma.db.taxConfig.findUnique({
      where: { id },
    });

    if (!taxConfig) {
      throw new NotFoundException('Tax configuration not found');
    }

    return taxConfig;
  }

  async findByCountry(country: string) {
    const taxConfig = await this.prisma.db.taxConfig.findUnique({
      where: { country },
    });

    if (!taxConfig) {
      throw new NotFoundException(
        `Tax configuration for country ${country} not found`,
      );
    }

    return taxConfig;
  }

  async update(id: string, dto: UpdateTaxConfigDto) {
    await this.findOne(id); // Check if exists

    return this.prisma.db.taxConfig.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Check if exists

    return this.prisma.db.taxConfig.delete({
      where: { id },
    });
  }
}
