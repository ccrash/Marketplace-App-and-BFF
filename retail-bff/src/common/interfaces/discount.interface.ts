export type DiscountType =
  | 'PERCENTAGE_OFF'
  | 'FIXED_AMOUNT_OFF'
  | 'BUY_X_GET_Y_FREE'
  | 'BASKET_THRESHOLD'
  | 'MULTI_BUY_FIXED';

interface BaseDiscount {
  id: string;
  code: string;
  description: string;
  type: DiscountType;
  isActive: boolean;
  validFrom: Date;
  validTo: Date;
}

export interface PercentageOffDiscount extends BaseDiscount {
  type: 'PERCENTAGE_OFF';
  productId: string;
  percentage: number; // 0–100
}

export interface FixedAmountOffDiscount extends BaseDiscount {
  type: 'FIXED_AMOUNT_OFF';
  productId: string;
  amountOff: number; // pence
}

export interface BuyXGetYFreeDiscount extends BaseDiscount {
  type: 'BUY_X_GET_Y_FREE';
  productId: string;
  buyQuantity: number;
  getFreeQuantity: number;
}

export interface BasketThresholdDiscount extends BaseDiscount {
  type: 'BASKET_THRESHOLD';
  thresholdAmount: number; // pence
  amountOff: number;       // pence
}

export interface MultiBuyFixedDiscount extends BaseDiscount {
  type: 'MULTI_BUY_FIXED';
  category: string;
  requiredQuantity: number;
  fixedPrice: number; // pence — total price for one bundle
}

export type Discount =
  | PercentageOffDiscount
  | FixedAmountOffDiscount
  | BuyXGetYFreeDiscount
  | BasketThresholdDiscount
  | MultiBuyFixedDiscount;

export interface AppliedDiscount {
  discountId: string;
  code: string;
  description: string;
  savingAmount: number; // pence
}
