import { Module } from '@nestjs/common';
import { BalancesService } from './balances.service';
import { BalancesController } from './balances.controller';

@Module({
  providers: [BalancesService],
  controllers: [BalancesController]
})
export class BalancesModule {}
