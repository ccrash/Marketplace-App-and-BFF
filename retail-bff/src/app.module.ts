import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ProductsModule } from './products/products.module';
import { DiscountsModule } from './discounts/discounts.module';
import { StockModule } from './stock/stock.module';
import { CartModule } from './cart/cart.module';
import { CheckoutModule } from './checkout/checkout.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';

@Module({
  imports: [
    StockModule,
    ProductsModule,
    DiscountsModule,
    CartModule,
    CheckoutModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
