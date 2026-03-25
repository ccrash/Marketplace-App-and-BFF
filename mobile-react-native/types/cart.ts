import type { AppliedDiscount } from './discount'

export interface CartItem {
  productId: string
  productName: string
  unitPrice: number // pence
  quantity: number
  lineTotal: number // pence
}

export type CartStatus = 'ACTIVE' | 'CHECKED_OUT' | 'EXPIRED'

export interface Cart {
  cartId: string
  status: CartStatus
  items: CartItem[]
  subtotal: number // pence
  appliedDiscounts: AppliedDiscount[]
  discountTotal: number // pence
  grandTotal: number // pence
  expiresAt: string
}
