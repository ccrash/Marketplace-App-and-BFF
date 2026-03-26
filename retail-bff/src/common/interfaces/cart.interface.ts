import { AppliedDiscount } from './discount.interface';

export interface CartItem {
  productId: string;
  productName: string;
  category: string;   // snapshot at time of adding — used by MULTI_BUY_FIXED discount engine
  unitPrice: number;  // pence — snapshot at time of adding
  quantity: number;
  lineTotal: number;  // unitPrice * quantity
}

export type CartStatus = 'ACTIVE' | 'CHECKED_OUT' | 'EXPIRED';

export interface Cart {
  id: string;
  status: CartStatus;
  items: CartItem[];
  createdAt: Date;
  lastActivityAt: Date;
  expiresAt: Date; // lastActivityAt + 2 min, recomputed on every mutation
}

export interface CartView {
  cartId: string;
  status: CartStatus;
  items: CartItem[];
  subtotal: number;
  appliedDiscounts: AppliedDiscount[];
  discountTotal: number;
  grandTotal: number;
  expiresAt: Date;
}
