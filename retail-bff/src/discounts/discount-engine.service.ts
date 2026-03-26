import { Injectable } from '@nestjs/common';
import {
  Discount,
  AppliedDiscount,
  PercentageOffDiscount,
  FixedAmountOffDiscount,
  BuyXGetYFreeDiscount,
  BasketThresholdDiscount,
  MultiBuyFixedDiscount,
} from '../common/interfaces/discount.interface';
import { CartItem } from '../common/interfaces/cart.interface';

export interface DiscountEngineResult {
  appliedDiscounts: AppliedDiscount[];
  discountTotal: number;
}

@Injectable()
export class DiscountEngineService {
  /**
   * Pure, stateless computation. Evaluates all active discounts against the
   * given cart items and returns the applied discounts and total savings.
   *
   * Rules:
   * - One product-level discount per product (first match wins per productId).
   * - BASKET_THRESHOLD discounts are evaluated last against the pre-discount subtotal.
   * - MULTI_BUY_FIXED spans multiple products in a category.
   */
  applyAll(cartItems: CartItem[], discounts: Discount[]): DiscountEngineResult {
    if (cartItems.length === 0) {
      return { appliedDiscounts: [], discountTotal: 0 };
    }

    const applied: AppliedDiscount[] = [];
    // Track which productIds have already had a product-level discount applied
    const discountedProductIds = new Set<string>();

    const now = new Date();
    const activeDiscounts = discounts.filter(
      (d) => d.isActive && d.validFrom <= now && d.validTo >= now,
    );

    // Separate basket-level from product-level so basket discounts run last
    const productDiscounts = activeDiscounts.filter((d) => d.type !== 'BASKET_THRESHOLD');
    const basketDiscounts = activeDiscounts.filter((d) => d.type === 'BASKET_THRESHOLD');

    for (const discount of [...productDiscounts, ...basketDiscounts]) {
      let result: AppliedDiscount | null = null;

      switch (discount.type) {
        case 'PERCENTAGE_OFF':
          result = this.applyPercentageOff(discount, cartItems, discountedProductIds);
          break;
        case 'FIXED_AMOUNT_OFF':
          result = this.applyFixedAmountOff(discount, cartItems, discountedProductIds);
          break;
        case 'BUY_X_GET_Y_FREE':
          result = this.applyBuyXGetYFree(discount, cartItems, discountedProductIds);
          break;
        case 'MULTI_BUY_FIXED':
          result = this.applyMultiBuyFixed(discount, cartItems, discountedProductIds);
          break;
        case 'BASKET_THRESHOLD':
          result = this.applyBasketThreshold(discount, cartItems);
          break;
      }

      if (result && result.savingAmount > 0) {
        applied.push(result);
      }
    }

    const discountTotal = applied.reduce((sum, d) => sum + d.savingAmount, 0);
    return { appliedDiscounts: applied, discountTotal };
  }

  private applyPercentageOff(
    discount: PercentageOffDiscount,
    items: CartItem[],
    discountedIds: Set<string>,
  ): AppliedDiscount | null {
    if (discountedIds.has(discount.productId)) return null;
    const item = items.find((i) => i.productId === discount.productId);
    if (!item) return null;

    const savingAmount = Math.round(item.lineTotal * (discount.percentage / 100));
    discountedIds.add(discount.productId);
    return { discountId: discount.id, code: discount.code, description: discount.description, savingAmount };
  }

  private applyFixedAmountOff(
    discount: FixedAmountOffDiscount,
    items: CartItem[],
    discountedIds: Set<string>,
  ): AppliedDiscount | null {
    if (discountedIds.has(discount.productId)) return null;
    const item = items.find((i) => i.productId === discount.productId);
    if (!item) return null;

    // Cannot save more than the line total
    const savingAmount = Math.min(discount.amountOff, item.lineTotal);
    discountedIds.add(discount.productId);
    return { discountId: discount.id, code: discount.code, description: discount.description, savingAmount };
  }

  private applyBuyXGetYFree(
    discount: BuyXGetYFreeDiscount,
    items: CartItem[],
    discountedIds: Set<string>,
  ): AppliedDiscount | null {
    if (discountedIds.has(discount.productId)) return null;
    const item = items.find((i) => i.productId === discount.productId);
    if (!item) return null;

    const { buyQuantity, getFreeQuantity } = discount;
    const groupSize = buyQuantity + getFreeQuantity;
    const freeUnits = Math.floor(item.quantity / groupSize) * getFreeQuantity;
    if (freeUnits === 0) return null;

    const savingAmount = freeUnits * item.unitPrice;
    discountedIds.add(discount.productId);
    return { discountId: discount.id, code: discount.code, description: discount.description, savingAmount };
  }

  private applyBasketThreshold(
    discount: BasketThresholdDiscount,
    items: CartItem[],
  ): AppliedDiscount | null {
    const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
    if (subtotal < discount.thresholdAmount) return null;

    return {
      discountId: discount.id,
      code: discount.code,
      description: discount.description,
      savingAmount: discount.amountOff,
    };
  }

  private applyMultiBuyFixed(
    discount: MultiBuyFixedDiscount,
    items: CartItem[],
    discountedIds: Set<string>,
  ): AppliedDiscount | null {
    // discount.category is a comma-separated list of categories, e.g. 'beauty,food'
    const categories = discount.category.split(',').map((c) => c.trim());

    // Gather qualifying items that haven't already been discounted at the product level
    const qualifyingItems = items.filter(
      (i) => categories.includes(i.category) && !discountedIds.has(i.productId),
    );

    if (qualifyingItems.length === 0) return null;

    // Total qualifying units across all qualifying items
    const totalUnits = qualifyingItems.reduce((sum, i) => sum + i.quantity, 0);
    const bundles = Math.floor(totalUnits / discount.requiredQuantity);
    if (bundles === 0) return null;

    // Normal cost of the units consumed in bundles (taken proportionally from cheapest first)
    const unitsInBundles = bundles * discount.requiredQuantity;
    // Expand into individual unit prices sorted ascending (cheapest first = most saving)
    const unitPrices: number[] = [];
    for (const item of qualifyingItems) {
      for (let j = 0; j < item.quantity; j++) {
        unitPrices.push(item.unitPrice);
      }
    }
    unitPrices.sort((a, b) => a - b);
    const normalCost = unitPrices.slice(0, unitsInBundles).reduce((s, p) => s + p, 0);
    const savingAmount = normalCost - bundles * discount.fixedPrice;
    if (savingAmount <= 0) return null;

    // Mark all participating product IDs as discounted
    for (const item of qualifyingItems) {
      discountedIds.add(item.productId);
    }

    return { discountId: discount.id, code: discount.code, description: discount.description, savingAmount };
  }
}
