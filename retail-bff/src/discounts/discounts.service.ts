import { Injectable, NotFoundException } from '@nestjs/common';
import { Discount } from '../common/interfaces/discount.interface';
import { DISCOUNTS_SEED } from './discounts.seed';

@Injectable()
export class DiscountsService {
  private readonly discounts = new Map<string, Discount>();

  constructor() {
    for (const discount of DISCOUNTS_SEED) {
      this.discounts.set(discount.id, discount);
    }
  }

  findAll(): Discount[] {
    const now = new Date();
    return Array.from(this.discounts.values()).filter(
      (d) => d.isActive && d.validTo >= now,
    );
  }

  findOne(id: string): Discount {
    const discount = this.discounts.get(id);
    if (!discount) {
      throw new NotFoundException({ message: 'Discount not found', discountId: id });
    }
    return discount;
  }

  // Return all active discounts for engine use (same as findAll but named for clarity)
  getActiveDiscounts(): Discount[] {
    return this.findAll();
  }
}
