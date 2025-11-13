import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { TaxesService } from './taxes.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../auth/dto/register.dto.js';
import { CreateTaxConfigDto } from './dto/create-tax-config.dto.js';
import { UpdateTaxConfigDto } from './dto/update-tax-config.dto.js';

@ApiTags('taxes')
@Controller('taxes')
export class TaxesController {
  constructor(private readonly taxesService: TaxesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tax configurations' })
  @ApiResponse({
    status: 200,
    description: 'List of all tax configurations',
  })
  async findAll() {
    const configs = await this.taxesService.findAll();
    return configs.map((config) => ({
      id: config.id,
      country: config.country,
      rate: Number(config.rate),
      fixedFee: config.fixedFee ? Number(config.fixedFee) : null,
      updatedAt: config.updatedAt,
    }));
  }

  @Get('country/:country')
  @ApiOperation({ summary: 'Get tax configuration by country code' })
  @ApiParam({
    name: 'country',
    description: 'Country code (ISO 3166-1 alpha-2)',
    example: 'BR',
  })
  @ApiResponse({
    status: 200,
    description: 'Tax configuration for the specified country',
  })
  @ApiResponse({ status: 404, description: 'Tax configuration not found' })
  async findByCountry(@Param('country') country: string) {
    const config = await this.taxesService.findByCountry(country);
    return {
      id: config.id,
      country: config.country,
      rate: Number(config.rate),
      fixedFee: config.fixedFee ? Number(config.fixedFee) : null,
      updatedAt: config.updatedAt,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tax configuration by ID' })
  @ApiParam({
    name: 'id',
    description: 'Tax configuration ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Tax configuration details',
  })
  @ApiResponse({ status: 404, description: 'Tax configuration not found' })
  async findOne(@Param('id') id: string) {
    const config = await this.taxesService.findOne(id);
    return {
      id: config.id,
      country: config.country,
      rate: Number(config.rate),
      fixedFee: config.fixedFee ? Number(config.fixedFee) : null,
      updatedAt: config.updatedAt,
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PLATFORM)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new tax configuration (platform only)' })
  @ApiResponse({
    status: 201,
    description: 'Tax configuration created successfully',
  })
  @ApiResponse({ status: 409, description: 'Tax configuration already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires PLATFORM role' })
  async create(@Body() dto: CreateTaxConfigDto) {
    const config = await this.taxesService.create(dto);
    return {
      id: config.id,
      country: config.country,
      rate: Number(config.rate),
      fixedFee: config.fixedFee ? Number(config.fixedFee) : null,
      updatedAt: config.updatedAt,
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PLATFORM)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update tax configuration (platform only)' })
  @ApiParam({
    name: 'id',
    description: 'Tax configuration ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Tax configuration updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Tax configuration not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires PLATFORM role' })
  async update(@Param('id') id: string, @Body() dto: UpdateTaxConfigDto) {
    const config = await this.taxesService.update(id, dto);
    return {
      id: config.id,
      country: config.country,
      rate: Number(config.rate),
      fixedFee: config.fixedFee ? Number(config.fixedFee) : null,
      updatedAt: config.updatedAt,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PLATFORM)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete tax configuration (platform only)' })
  @ApiParam({
    name: 'id',
    description: 'Tax configuration ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Tax configuration deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Tax configuration not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires PLATFORM role' })
  async remove(@Param('id') id: string) {
    await this.taxesService.remove(id);
    return { message: 'Tax configuration deleted successfully' };
  }
}

