import {
  Injectable,
  BadRequestException,
  NotFoundException,
  GoneException,
  ConflictException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CartService } from '../cart/cart.service';
import { StockService } from '../stock/stock.service';
import { DiscountsService } from '../discounts/discounts.service';
import { DiscountEngineService } from '../discounts/discount-engine.service';
import { OrderSummary, OrderLineItem } from '../common/interfaces/order.interface';

interface StockFailure {
  productId: string;
  productName: string;
  requested: number;
  available: number;
}

@Injectable()
export class CheckoutService {
  constructor(
    private readonly cartService: CartService,
    private readonly stockService: StockService,
    private readonly discountsService: DiscountsService,
    private readonly discountEngine: DiscountEngineService,
  ) {}

  checkout(cartId: string): OrderSummary {
    // Load and guard cart status
    const cart = this.getActiveCart(cartId);

    // Validate stock for all items (reservations already held, but validate for correctness)
    const failures: StockFailure[] = [];
    for (const item of cart.items) {
      const stock = this.stockService.getStockLevel(item.productId);
      // The reservation is already deducted from stockLevels.available,
      // so available here means additional free units beyond what's reserved.
      // We check that the cart's own reservation is still intact via getCartReservations.
      const cartReservation = this.stockService.getCartReservations(cartId).get(item.productId) ?? 0;
      if (cartReservation < item.quantity) {
        failures.push({
          productId: item.productId,
          productName: item.productName,
          requested: item.quantity,
          available: cartReservation + stock.available,
        });
      }
    }

    if (failures.length > 0) {
      // Release reservations on failure so stock is not locked
      this.stockService.releaseAllReservations(cartId);
      this.cartService.markExpired(cartId);
      throw new BadRequestException({ message: 'Checkout failed', failures });
    }

    // Apply discounts
    const activeDiscounts = this.discountsService.getActiveDiscounts();
    const { appliedDiscounts, discountTotal } = this.discountEngine.applyAll(
      cart.items,
      activeDiscounts,
    );

    // Commit — stock is already deducted (reserved), just finalise
    this.stockService.commitReservations(cartId);
    this.cartService.markCheckedOut(cartId);

    // Build order summary
    const subtotal = cart.items.reduce((sum, i) => sum + i.lineTotal, 0);
    const items: OrderLineItem[] = cart.items.map((i) => ({
      productId: i.productId,
      productName: i.productName,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      lineTotal: i.lineTotal,
    }));

    return {
      orderId: uuidv4(),
      cartId,
      createdAt: new Date(),
      items,
      subtotal,
      appliedDiscounts,
      discountTotal,
      totalPaid: subtotal - discountTotal,
      paymentStatus: 'SIMULATED_SUCCESS',
    };
  }

  private getActiveCart(cartId: string) {
    const cart = this.cartService.getCart(cartId);
    // getCart already throws appropriate errors for expired/checked-out
    return cart;
  }
}
