import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TaxesModule } from './taxes/taxes.module';
import { AffiliatesModule } from './affiliates/affiliates.module';
import { PaymentsModule } from './payments/payments.module';
import { BalancesModule } from './balances/balances.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [DatabaseModule, AuthModule, UsersModule, TaxesModule, AffiliatesModule, PaymentsModule, BalancesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
