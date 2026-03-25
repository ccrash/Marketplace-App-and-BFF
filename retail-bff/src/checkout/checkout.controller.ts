import { Controller, Post, Param, HttpCode } from '@nestjs/common';
import { CheckoutService } from './checkout.service';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post(':cartId')
  @HttpCode(200)
  checkout(@Param('cartId') cartId: string) {
    return this.checkoutService.checkout(cartId);
  }
}
