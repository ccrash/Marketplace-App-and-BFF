import { Module } from '@nestjs/common';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { CartModule } from '../cart/cart.module';
import { StockModule } from '../stock/stock.module';
import { DiscountsModule } from '../discounts/discounts.module';

@Module({
  imports: [CartModule, StockModule, DiscountsModule],
  controllers: [CheckoutController],
  providers: [CheckoutService],
})
export class CheckoutModule {}
