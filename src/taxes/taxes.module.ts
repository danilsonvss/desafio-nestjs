import { Module } from '@nestjs/common';
import { TaxesController } from './taxes.controller.js';
import { TaxesService } from './taxes.service.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [DatabaseModule],
  controllers: [TaxesController],
  providers: [TaxesService],
})
export class TaxesModule {}
