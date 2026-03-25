import { Module } from '@nestjs/common';
import { DiscountsController } from './discounts.controller';
import { DiscountsService } from './discounts.service';
import { DiscountEngineService } from './discount-engine.service';

@Module({
  controllers: [DiscountsController],
  providers: [DiscountsService, DiscountEngineService],
  exports: [DiscountsService, DiscountEngineService],
})
export class DiscountsModule {}
