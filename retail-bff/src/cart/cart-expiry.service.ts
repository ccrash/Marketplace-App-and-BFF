import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { CartService } from './cart.service';
import { StockService } from '../stock/stock.service';

@Injectable()
export class CartExpiryService implements OnModuleInit, OnModuleDestroy {
  static readonly CHECK_INTERVAL_MS = 15_000; // check every 15 seconds

  private intervalHandle: NodeJS.Timeout | null = null;

  constructor(
    private readonly cartService: CartService,
    private readonly stockService: StockService,
  ) {}

  onModuleInit(): void {
    this.intervalHandle = setInterval(
      () => this.releaseExpiredCarts(),
      CartExpiryService.CHECK_INTERVAL_MS,
    );
  }

  onModuleDestroy(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  /**
   * Public so tests can call it directly without waiting for the timer.
   */
  releaseExpiredCarts(): void {
    const now = new Date();
    const expiredCarts = this.cartService.getExpiredCarts(now);
    for (const cart of expiredCarts) {
      this.stockService.releaseAllReservations(cart.id);
      this.cartService.markExpired(cart.id);
    }
  }
}
