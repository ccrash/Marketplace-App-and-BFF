import { DiscountEngineService } from './discount-engine.service';
import { CartItem } from '../common/interfaces/cart.interface';
import { Discount } from '../common/interfaces/discount.interface';

const FAR_FUTURE = new Date('2099-12-31');
const EPOCH = new Date('2024-01-01');

function makeItem(overrides: Partial<CartItem> & { category?: string }): CartItem & { category: string } {
  const item = {
    productId: 'prod_001',
    productName: 'Test Product',
    unitPrice: 1000,
    quantity: 1,
    lineTotal: 1000,
    category: 'electronics',
    ...overrides,
  } as CartItem & { category: string };
  item.lineTotal = item.unitPrice * item.quantity;
  return item;
}

describe('DiscountEngineService', () => {
  let engine: DiscountEngineService;

  beforeEach(() => {
    engine = new DiscountEngineService();
  });

  describe('empty cart', () => {
    it('returns zero discounts for an empty cart', () => {
      const result = engine.applyAll([], []);
      expect(result.appliedDiscounts).toHaveLength(0);
      expect(result.discountTotal).toBe(0);
    });
  });

  describe('PERCENTAGE_OFF', () => {
    const discount: Discount = {
      id: 'disc_001',
      code: 'PCT10',
      description: '10% off prod_001',
      type: 'PERCENTAGE_OFF',
      isActive: true,
      validFrom: EPOCH,
      validTo: FAR_FUTURE,
      productId: 'prod_001',
      percentage: 10,
    };

    it('applies 10% saving on matching product', () => {
      const item = makeItem({ productId: 'prod_001', unitPrice: 10000, quantity: 2 });
      const result = engine.applyAll([item], [discount]);
      // lineTotal = 20000, saving = 2000
      expect(result.appliedDiscounts[0].savingAmount).toBe(2000);
      expect(result.discountTotal).toBe(2000);
    });

    it('does not apply when product is not in cart', () => {
      const item = makeItem({ productId: 'prod_002' });
      const result = engine.applyAll([item], [discount]);
      expect(result.appliedDiscounts).toHaveLength(0);
    });

    it('does not double-apply to same product', () => {
      const item = makeItem({ productId: 'prod_001', unitPrice: 10000, quantity: 1 });
      const discount2: Discount = { ...discount, id: 'disc_002', code: 'PCT20', percentage: 20 };
      const result = engine.applyAll([item], [discount, discount2]);
      // Only first discount applies
      expect(result.appliedDiscounts).toHaveLength(1);
      expect(result.appliedDiscounts[0].discountId).toBe('disc_001');
    });
  });

  describe('FIXED_AMOUNT_OFF', () => {
    const discount: Discount = {
      id: 'disc_002',
      code: 'FIXED5',
      description: '£5 off prod_001',
      type: 'FIXED_AMOUNT_OFF',
      isActive: true,
      validFrom: EPOCH,
      validTo: FAR_FUTURE,
      productId: 'prod_001',
      amountOff: 500,
    };

    it('applies fixed saving', () => {
      const item = makeItem({ productId: 'prod_001', unitPrice: 1000, quantity: 1 });
      const result = engine.applyAll([item], [discount]);
      expect(result.appliedDiscounts[0].savingAmount).toBe(500);
    });

    it('is capped at line total', () => {
      const item = makeItem({ productId: 'prod_001', unitPrice: 300, quantity: 1 });
      const result = engine.applyAll([item], [discount]);
      // amountOff (500) > lineTotal (300), so saving is capped at 300
      expect(result.appliedDiscounts[0].savingAmount).toBe(300);
    });
  });

  describe('BUY_X_GET_Y_FREE', () => {
    const discount: Discount = {
      id: 'disc_003',
      code: 'B2G1',
      description: 'Buy 2 get 1 free',
      type: 'BUY_X_GET_Y_FREE',
      isActive: true,
      validFrom: EPOCH,
      validTo: FAR_FUTURE,
      productId: 'prod_001',
      buyQuantity: 2,
      getFreeQuantity: 1,
    };

    it('awards no free units for qty 1', () => {
      const item = makeItem({ productId: 'prod_001', unitPrice: 1000, quantity: 1 });
      const result = engine.applyAll([item], [discount]);
      expect(result.appliedDiscounts).toHaveLength(0);
    });

    it('awards no free units for qty 2', () => {
      const item = makeItem({ productId: 'prod_001', unitPrice: 1000, quantity: 2 });
      const result = engine.applyAll([item], [discount]);
      expect(result.appliedDiscounts).toHaveLength(0);
    });

    it('awards 1 free unit for qty 3 (buy 2 + 1 free)', () => {
      const item = makeItem({ productId: 'prod_001', unitPrice: 1000, quantity: 3 });
      const result = engine.applyAll([item], [discount]);
      expect(result.appliedDiscounts[0].savingAmount).toBe(1000);
    });

    it('awards 1 free unit for qty 4 and qty 5', () => {
      for (const qty of [4, 5]) {
        const item = makeItem({ productId: 'prod_001', unitPrice: 1000, quantity: qty });
        const result = engine.applyAll([item], [discount]);
        expect(result.appliedDiscounts[0].savingAmount).toBe(1000);
      }
    });

    it('awards 2 free units for qty 6', () => {
      const item = makeItem({ productId: 'prod_001', unitPrice: 1000, quantity: 6 });
      const result = engine.applyAll([item], [discount]);
      expect(result.appliedDiscounts[0].savingAmount).toBe(2000);
    });
  });

  describe('BASKET_THRESHOLD', () => {
    const discount: Discount = {
      id: 'disc_004',
      code: 'SPEND100',
      description: 'Spend £100 get £15 off',
      type: 'BASKET_THRESHOLD',
      isActive: true,
      validFrom: EPOCH,
      validTo: FAR_FUTURE,
      thresholdAmount: 10000,
      amountOff: 1500,
    };

    it('does not apply below threshold', () => {
      const item = makeItem({ productId: 'prod_001', unitPrice: 9999, quantity: 1 });
      const result = engine.applyAll([item], [discount]);
      expect(result.appliedDiscounts).toHaveLength(0);
    });

    it('applies at exact threshold', () => {
      const item = makeItem({ productId: 'prod_001', unitPrice: 10000, quantity: 1 });
      const result = engine.applyAll([item], [discount]);
      expect(result.appliedDiscounts[0].savingAmount).toBe(1500);
    });

    it('applies above threshold', () => {
      const item = makeItem({ productId: 'prod_001', unitPrice: 15000, quantity: 1 });
      const result = engine.applyAll([item], [discount]);
      expect(result.appliedDiscounts[0].savingAmount).toBe(1500);
    });
  });

  describe('MULTI_BUY_FIXED', () => {
    const discount: Discount = {
      id: 'disc_005',
      code: 'BEAUTY3FOR25',
      description: 'Any 3 beauty/food items for £25',
      type: 'MULTI_BUY_FIXED',
      isActive: true,
      validFrom: EPOCH,
      validTo: FAR_FUTURE,
      category: 'beauty,food',
      requiredQuantity: 3,
      fixedPrice: 2500,
    };

    it('does not apply with fewer than 3 qualifying units', () => {
      const item = makeItem({ productId: 'prod_005', unitPrice: 1499, quantity: 2, category: 'beauty' });
      const result = engine.applyAll([item], [discount]);
      expect(result.appliedDiscounts).toHaveLength(0);
    });

    it('applies when total qualifying units >= 3', () => {
      const coffee = makeItem({ productId: 'prod_003', unitPrice: 1299, quantity: 2, category: 'food' });
      const cream = makeItem({ productId: 'prod_005', unitPrice: 1499, quantity: 1, category: 'beauty' });
      const result = engine.applyAll([coffee, cream], [discount]);
      // Normal cost for 3 cheapest: 1299 + 1299 + 1499 = 4097; bundle price = 2500; saving = 1597
      expect(result.appliedDiscounts[0].savingAmount).toBe(1597);
    });

    it('does not apply to non-qualifying categories', () => {
      const item = makeItem({ productId: 'prod_001', unitPrice: 27999, quantity: 3, category: 'electronics' });
      const result = engine.applyAll([item], [discount]);
      expect(result.appliedDiscounts).toHaveLength(0);
    });
  });

  describe('multiple discounts combined', () => {
    it('correctly combines PERCENTAGE_OFF and BASKET_THRESHOLD', () => {
      const pctDiscount: Discount = {
        id: 'disc_001',
        code: 'PCT15',
        description: '15% off prod_001',
        type: 'PERCENTAGE_OFF',
        isActive: true,
        validFrom: EPOCH,
        validTo: FAR_FUTURE,
        productId: 'prod_001',
        percentage: 15,
      };
      const basketDiscount: Discount = {
        id: 'disc_004',
        code: 'SPEND100',
        description: 'Spend £100 get £15 off',
        type: 'BASKET_THRESHOLD',
        isActive: true,
        validFrom: EPOCH,
        validTo: FAR_FUTURE,
        thresholdAmount: 10000,
        amountOff: 1500,
      };

      // prod_001 × 1 at £279.99 — lineTotal 27999
      const item = makeItem({ productId: 'prod_001', unitPrice: 27999, quantity: 1 });
      const result = engine.applyAll([item], [pctDiscount, basketDiscount]);

      expect(result.appliedDiscounts).toHaveLength(2);
      // PCT15: 27999 * 0.15 = 4199.85 → Math.round = 4200
      const pct = result.appliedDiscounts.find((d) => d.discountId === 'disc_001');
      expect(pct!.savingAmount).toBe(4200);
      // Basket threshold: subtotal (pre-discount) = 27999 >= 10000, saving = 1500
      const basket = result.appliedDiscounts.find((d) => d.discountId === 'disc_004');
      expect(basket!.savingAmount).toBe(1500);
      expect(result.discountTotal).toBe(5700);
    });
  });

  describe('inactive / expired discounts', () => {
    it('does not apply inactive discounts', () => {
      const discount: Discount = {
        id: 'disc_x',
        code: 'INACTIVE',
        description: 'Inactive discount',
        type: 'PERCENTAGE_OFF',
        isActive: false,
        validFrom: EPOCH,
        validTo: FAR_FUTURE,
        productId: 'prod_001',
        percentage: 50,
      };
      const item = makeItem({ productId: 'prod_001', unitPrice: 1000, quantity: 1 });
      const result = engine.applyAll([item], [discount]);
      expect(result.appliedDiscounts).toHaveLength(0);
    });

    it('does not apply expired discounts', () => {
      const discount: Discount = {
        id: 'disc_x',
        code: 'EXPIRED',
        description: 'Expired discount',
        type: 'PERCENTAGE_OFF',
        isActive: true,
        validFrom: EPOCH,
        validTo: new Date('2020-01-01'), // expired
        productId: 'prod_001',
        percentage: 50,
      };
      const item = makeItem({ productId: 'prod_001', unitPrice: 1000, quantity: 1 });
      const result = engine.applyAll([item], [discount]);
      expect(result.appliedDiscounts).toHaveLength(0);
    });
  });
});
