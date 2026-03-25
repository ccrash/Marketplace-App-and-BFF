import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { CartExpiryService } from './cart-expiry.service';
import { StockModule } from '../stock/stock.module';
import { ProductsModule } from '../products/products.module';
import { DiscountsModule } from '../discounts/discounts.module';

@Module({
  imports: [StockModule, ProductsModule, DiscountsModule],
  controllers: [CartController],
  providers: [CartService, CartExpiryService],
  exports: [CartService],
})
export class CartModule {}
