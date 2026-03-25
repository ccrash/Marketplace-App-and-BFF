import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  @HttpCode(201)
  createCart() {
    return this.cartService.createCart();
  }

  @Get(':cartId')
  getCart(@Param('cartId') cartId: string) {
    return this.cartService.getCartView(cartId);
  }

  @Post(':cartId/items')
  @HttpCode(201)
  addItem(@Param('cartId') cartId: string, @Body() dto: AddItemDto) {
    return this.cartService.addItem(cartId, dto.productId, dto.quantity);
  }

  @Patch(':cartId/items/:productId')
  updateItem(
    @Param('cartId') cartId: string,
    @Param('productId') productId: string,
    @Body() dto: UpdateItemDto,
  ) {
    return this.cartService.updateItem(cartId, productId, dto.quantity);
  }

  @Delete(':cartId/items/:productId')
  removeItem(
    @Param('cartId') cartId: string,
    @Param('productId') productId: string,
  ) {
    return this.cartService.removeItem(cartId, productId);
  }

  @Delete(':cartId')
  @HttpCode(204)
  abandonCart(@Param('cartId') cartId: string) {
    this.cartService.abandonCart(cartId);
  }
}
