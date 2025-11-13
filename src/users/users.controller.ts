import { Controller, Get, Param, UseGuards, NotFoundException } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../auth/dto/register.dto.js';
import { UserResponseDto } from './dto/user-response.dto.js';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PLATFORM)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users (platform only)' })
  @ApiResponse({
    status: 200,
    description: 'List of all users',
    type: [UserResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires PLATFORM role' })
  async findAll() {
    const users = await this.usersService.findAll();
    return users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      balance: user.balance ? Number(user.balance.amount) : 0,
    }));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID with recent commissions (platform only)' })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'User details with balance and recent commissions',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires PLATFORM role' })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      balance: {
        amount: user.balance ? Number(user.balance.amount) : 0,
        updatedAt: user.balance?.updatedAt,
      },
      recentCommissions: user.commissions.map((commission) => ({
        id: commission.id,
        type: commission.type,
        amount: Number(commission.amount),
        transaction: {
          id: commission.transaction.id,
          amount: Number(commission.transaction.amount),
          country: commission.transaction.country,
          createdAt: commission.transaction.createdAt,
        },
      })),
    };
  }
}
