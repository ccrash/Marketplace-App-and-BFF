import { Injectable, BadRequestException } from '@nestjs/common';
import { StockLevel } from '../common/interfaces/stock.interface';

// Initial stock levels keyed by productId — seeded here so StockService
// is self-contained and doesn't depend on ProductsService at startup.
const INITIAL_STOCK: Record<string, number> = {
  prod_001: 15,
  prod_002: 40,
  prod_003: 100,
  prod_004: 8,
  prod_005: 60,
};

@Injectable()
export class StockService {
  // Free units: not reserved and not sold
  private readonly stockLevels = new Map<string, number>();
  // cartId -> (productId -> reservedQty)
  private readonly reservations = new Map<string, Map<string, number>>();
  // Audit trail of units sold since startup
  private readonly soldCounts = new Map<string, number>();

  constructor() {
    for (const [productId, qty] of Object.entries(INITIAL_STOCK)) {
      this.stockLevels.set(productId, qty);
      this.soldCounts.set(productId, 0);
    }
  }

  getStockLevel(productId: string): StockLevel {
    const available = this.stockLevels.get(productId) ?? 0;
    const reserved = this.getTotalReserved(productId);
    const sold = this.soldCounts.get(productId) ?? 0;
    return { productId, available, reserved, sold };
  }

  getAllStockLevels(): Map<string, StockLevel> {
    const result = new Map<string, StockLevel>();
    for (const productId of this.stockLevels.keys()) {
      result.set(productId, this.getStockLevel(productId));
    }
    return result;
  }

  /**
   * Reserve units for a cart item. Deducts from available stockLevels.
   * Throws BadRequestException if insufficient stock.
   */
  reserve(cartId: string, productId: string, quantity: number): void {
    const available = this.stockLevels.get(productId) ?? 0;
    if (available < quantity) {
      throw new BadRequestException({
        message: 'Insufficient stock',
        productId,
        requested: quantity,
        available,
      });
    }
    this.stockLevels.set(productId, available - quantity);
    if (!this.reservations.has(cartId)) {
      this.reservations.set(cartId, new Map());
    }
    const cartReservations = this.reservations.get(cartId)!;
    const current = cartReservations.get(productId) ?? 0;
    cartReservations.set(productId, current + quantity);
  }

  /**
   * Adjust the total reservation for a product in a cart to newQuantity.
   * Delta can be positive (need more stock) or negative (returning stock).
   * Throws BadRequestException if increasing and insufficient stock.
   */
  adjustReservation(cartId: string, productId: string, newQuantity: number): void {
    const cartReservations = this.reservations.get(cartId) ?? new Map<string, number>();
    const current = cartReservations.get(productId) ?? 0;
    const delta = newQuantity - current;

    if (delta === 0) return;

    if (delta > 0) {
      // Need more stock
      const available = this.stockLevels.get(productId) ?? 0;
      if (available < delta) {
        throw new BadRequestException({
          message: 'Insufficient stock',
          productId,
          requested: newQuantity,
          available: available + current, // total visible to customer
        });
      }
      this.stockLevels.set(productId, available - delta);
    } else {
      // Returning stock
      const available = this.stockLevels.get(productId) ?? 0;
      this.stockLevels.set(productId, available + Math.abs(delta));
    }

    if (!this.reservations.has(cartId)) {
      this.reservations.set(cartId, new Map());
    }
    const cartRes = this.reservations.get(cartId)!;
    if (newQuantity === 0) {
      cartRes.delete(productId);
    } else {
      cartRes.set(productId, newQuantity);
    }
  }

  /**
   * Release all reservations for a cart back to available stock.
   * Called on cart expiry or cart abandonment.
   */
  releaseAllReservations(cartId: string): void {
    const cartReservations = this.reservations.get(cartId);
    if (!cartReservations) return;

    for (const [productId, qty] of cartReservations.entries()) {
      const available = this.stockLevels.get(productId) ?? 0;
      this.stockLevels.set(productId, available + qty);
    }
    this.reservations.delete(cartId);
  }

  /**
   * Commit reservations on successful checkout.
   * Removes reservations WITHOUT returning stock (sale is final).
   */
  commitReservations(cartId: string): void {
    const cartReservations = this.reservations.get(cartId);
    if (!cartReservations) return;

    for (const [productId, qty] of cartReservations.entries()) {
      const sold = this.soldCounts.get(productId) ?? 0;
      this.soldCounts.set(productId, sold + qty);
    }
    this.reservations.delete(cartId);
  }

  getCartReservations(cartId: string): Map<string, number> {
    return this.reservations.get(cartId) ?? new Map();
  }

  private getTotalReserved(productId: string): number {
    let total = 0;
    for (const cartReservations of this.reservations.values()) {
      total += cartReservations.get(productId) ?? 0;
    }
    return total;
  }
}
