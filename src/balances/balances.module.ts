import { Module } from '@nestjs/common';
import { BalancesController } from './balances.controller.js';
import { BalancesService } from './balances.service.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [DatabaseModule],
  controllers: [BalancesController],
  providers: [BalancesService],
})
export class BalancesModule {}
