import { AppliedDiscount } from './discount.interface';

export interface OrderLineItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderSummary {
  orderId: string;
  cartId: string;
  createdAt: Date;
  items: OrderLineItem[];
  subtotal: number;
  appliedDiscounts: AppliedDiscount[];
  discountTotal: number;
  totalPaid: number;
  paymentStatus: 'SIMULATED_SUCCESS';
}
