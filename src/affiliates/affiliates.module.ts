import { Module } from '@nestjs/common';
import { AffiliatesService } from './affiliates.service';
import { AffiliatesController } from './affiliates.controller';

@Module({
  providers: [AffiliatesService],
  controllers: [AffiliatesController]
})
export class AffiliatesModule {}
