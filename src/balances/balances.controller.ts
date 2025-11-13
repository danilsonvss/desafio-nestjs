import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { BalancesService } from './balances.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../auth/dto/register.dto.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@ApiTags('balances')
@Controller('balances')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BalancesController {
  constructor(private readonly balancesService: BalancesService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PLATFORM)
  @ApiOperation({ summary: 'Get all user balances (platform only)' })
  @ApiResponse({
    status: 200,
    description: 'List of all balances ordered by amount',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires PLATFORM role' })
  async findAll() {
    const balances = await this.balancesService.findAll();
    return balances.map((balance) => ({
      id: balance.id,
      amount: Number(balance.amount),
      updatedAt: balance.updatedAt,
      user: balance.user,
    }));
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user balance' })
  @ApiResponse({
    status: 200,
    description: 'Current user balance',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Balance not found' })
  async getMyBalance(@CurrentUser() user: any) {
    const balance = await this.balancesService.findByUserId(user.id);
    return {
      id: balance.id,
      amount: Number(balance.amount),
      updatedAt: balance.updatedAt,
      user: balance.user,
    };
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get balance by user ID' })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'User balance details',
  })
  @ApiResponse({ status: 404, description: 'Balance not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findByUserId(@Param('userId') userId: string) {
    const balance = await this.balancesService.findByUserId(userId);
    return {
      id: balance.id,
      amount: Number(balance.amount),
      updatedAt: balance.updatedAt,
      user: balance.user,
    };
  }
}

