import type { AppliedDiscount } from './discount'

export interface OrderLineItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number // pence
  lineTotal: number // pence
}

export interface OrderSummary {
  orderId: string
  cartId: string
  createdAt: string
  items: OrderLineItem[]
  subtotal: number // pence
  appliedDiscounts: AppliedDiscount[]
  discountTotal: number // pence
  totalPaid: number // pence
  paymentStatus: string
}
