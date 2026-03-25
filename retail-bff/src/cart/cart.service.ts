import {
  Injectable,
  NotFoundException,
  GoneException,
  ConflictException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Cart, CartItem, CartView } from '../common/interfaces/cart.interface';
import { StockService } from '../stock/stock.service';
import { ProductsService } from '../products/products.service';
import { DiscountsService } from '../discounts/discounts.service';
import { DiscountEngineService } from '../discounts/discount-engine.service';

export const CART_INACTIVITY_MS = 2 * 60 * 1000; // 2 minutes

@Injectable()
export class CartService {
  private readonly carts = new Map<string, Cart>();

  constructor(
    private readonly stockService: StockService,
    private readonly productsService: ProductsService,
    private readonly discountsService: DiscountsService,
    private readonly discountEngine: DiscountEngineService,
  ) {}

  createCart(): { cartId: string; expiresAt: Date } {
    const now = new Date();
    const cart: Cart = {
      id: uuidv4(),
      status: 'ACTIVE',
      items: [],
      createdAt: now,
      lastActivityAt: now,
      expiresAt: new Date(now.getTime() + CART_INACTIVITY_MS),
    };
    this.carts.set(cart.id, cart);
    return { cartId: cart.id, expiresAt: cart.expiresAt };
  }

  getCartView(cartId: string): CartView {
    const cart = this.requireActiveCart(cartId);
    return this.buildCartView(cart);
  }

  addItem(cartId: string, productId: string, quantity: number): CartView {
    const cart = this.requireActiveCart(cartId);
    const product = this.productsService.getProduct(productId);

    const existingItem = cart.items.find((i) => i.productId === productId);

    if (existingItem) {
      // Increase existing reservation
      const newQty = existingItem.quantity + quantity;
      this.stockService.adjustReservation(cartId, productId, newQty);
      existingItem.quantity = newQty;
      existingItem.lineTotal = existingItem.unitPrice * newQty;
    } else {
      // New item — reserve stock
      this.stockService.reserve(cartId, productId, quantity);
      const item: CartItem = {
        productId,
        productName: product.name,
        unitPrice: product.price,
        quantity,
        lineTotal: product.price * quantity,
      };
      // Attach category for multi-buy discount engine (stored as non-enumerable trick avoided — just add it)
      (item as any).category = product.category;
      cart.items.push(item);
    }

    this.touchCart(cart);
    return this.buildCartView(cart);
  }

  updateItem(cartId: string, productId: string, newQuantity: number): CartView {
    const cart = this.requireActiveCart(cartId);
    const itemIndex = cart.items.findIndex((i) => i.productId === productId);
    if (itemIndex === -1) {
      throw new NotFoundException({ message: 'Item not in cart', productId });
    }

    if (newQuantity === 0) {
      return this.removeItem(cartId, productId);
    }

    this.stockService.adjustReservation(cartId, productId, newQuantity);
    const item = cart.items[itemIndex];
    item.quantity = newQuantity;
    item.lineTotal = item.unitPrice * newQuantity;

    this.touchCart(cart);
    return this.buildCartView(cart);
  }

  removeItem(cartId: string, productId: string): CartView {
    const cart = this.requireActiveCart(cartId);
    const itemIndex = cart.items.findIndex((i) => i.productId === productId);
    if (itemIndex === -1) {
      throw new NotFoundException({ message: 'Item not in cart', productId });
    }

    this.stockService.adjustReservation(cartId, productId, 0);
    cart.items.splice(itemIndex, 1);

    this.touchCart(cart);
    return this.buildCartView(cart);
  }

  abandonCart(cartId: string): void {
    const cart = this.carts.get(cartId);
    if (!cart) return; // idempotent — already gone or never existed
    if (cart.status === 'ACTIVE') {
      this.stockService.releaseAllReservations(cartId);
    }
    this.carts.delete(cartId);
  }

  // Called by CheckoutService
  getCart(cartId: string): Cart {
    return this.requireActiveCart(cartId);
  }

  markCheckedOut(cartId: string): void {
    const cart = this.carts.get(cartId);
    if (cart) cart.status = 'CHECKED_OUT';
  }

  markExpired(cartId: string): void {
    const cart = this.carts.get(cartId);
    if (cart) cart.status = 'EXPIRED';
  }

  getExpiredCarts(now: Date): Cart[] {
    return Array.from(this.carts.values()).filter(
      (c) => c.status === 'ACTIVE' && c.expiresAt < now,
    );
  }

  private requireActiveCart(cartId: string): Cart {
    const cart = this.carts.get(cartId);
    if (!cart) {
      throw new NotFoundException({ message: 'Cart not found', cartId });
    }
    if (cart.status === 'EXPIRED') {
      throw new GoneException({ message: 'Cart has expired', cartId });
    }
    if (cart.status === 'CHECKED_OUT') {
      throw new ConflictException({ message: 'Cart already checked out', cartId });
    }
    return cart;
  }

  private touchCart(cart: Cart): void {
    const now = new Date();
    cart.lastActivityAt = now;
    cart.expiresAt = new Date(now.getTime() + CART_INACTIVITY_MS);
  }

  private buildCartView(cart: Cart): CartView {
    const subtotal = cart.items.reduce((sum, i) => sum + i.lineTotal, 0);
    const activeDiscounts = this.discountsService.getActiveDiscounts();
    const { appliedDiscounts, discountTotal } = this.discountEngine.applyAll(
      cart.items,
      activeDiscounts,
    );
    return {
      cartId: cart.id,
      status: cart.status,
      items: cart.items,
      subtotal,
      appliedDiscounts,
      discountTotal,
      grandTotal: subtotal - discountTotal,
      expiresAt: cart.expiresAt,
    };
  }
}
