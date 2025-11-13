import { Controller, Post, Body } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { ProcessSaleDto } from './dto/process-sale.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  async processSale(@Body() dto: ProcessSaleDto) {
    return this.paymentsService.processSale(dto);
  }
}
