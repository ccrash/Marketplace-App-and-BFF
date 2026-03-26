import { BadRequestException, GoneException, ConflictException } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CartService } from '../cart/cart.service';
import { StockService } from '../stock/stock.service';
import { DiscountsService } from '../discounts/discounts.service';
import { DiscountEngineService } from '../discounts/discount-engine.service';
import { Cart } from '../common/interfaces/cart.interface';

function makeActiveCart(cartId: string): Cart {
  const now = new Date();
  return {
    id: cartId,
    status: 'ACTIVE',
    items: [
      {
        productId: 'prod_001',
        productName: 'Sony Headphones',
        category: 'electronics',
        unitPrice: 27999,
        quantity: 1,
        lineTotal: 27999,
      },
    ],
    createdAt: now,
    lastActivityAt: now,
    expiresAt: new Date(now.getTime() + 120000),
  };
}

describe('CheckoutService', () => {
  let service: CheckoutService;
  let cartService: jest.Mocked<CartService>;
  let stockService: jest.Mocked<StockService>;
  let discountsService: jest.Mocked<DiscountsService>;
  let discountEngine: jest.Mocked<DiscountEngineService>;

  beforeEach(() => {
    cartService = {
      getCart: jest.fn(),
      markCheckedOut: jest.fn(),
      markExpired: jest.fn(),
    } as any;

    stockService = {
      getStockLevel: jest.fn().mockReturnValue({ available: 0, reserved: 1, sold: 0 }),
      getCartReservations: jest.fn().mockReturnValue(new Map([['prod_001', 1]])),
      commitReservations: jest.fn(),
      releaseAllReservations: jest.fn(),
    } as any;

    discountsService = {
      getActiveDiscounts: jest.fn().mockReturnValue([]),
    } as any;

    discountEngine = {
      applyAll: jest.fn().mockReturnValue({ appliedDiscounts: [], discountTotal: 0 }),
    } as any;

    service = new CheckoutService(cartService, stockService, discountsService, discountEngine);
  });

  describe('successful checkout', () => {
    it('returns an order summary with correct totals', () => {
      const cart = makeActiveCart('cart_1');
      cartService.getCart.mockReturnValue(cart);

      const summary = service.checkout('cart_1');

      expect(summary.cartId).toBe('cart_1');
      expect(summary.subtotal).toBe(27999);
      expect(summary.discountTotal).toBe(0);
      expect(summary.totalPaid).toBe(27999);
      expect(summary.paymentStatus).toBe('SIMULATED_SUCCESS');
      expect(summary.orderId).toBeDefined();
    });

    it('calls commitReservations and markCheckedOut', () => {
      const cart = makeActiveCart('cart_1');
      cartService.getCart.mockReturnValue(cart);

      service.checkout('cart_1');

      expect(stockService.commitReservations).toHaveBeenCalledWith('cart_1');
      expect(cartService.markCheckedOut).toHaveBeenCalledWith('cart_1');
    });

    it('applies discounts from the engine', () => {
      const cart = makeActiveCart('cart_1');
      cartService.getCart.mockReturnValue(cart);
      discountEngine.applyAll.mockReturnValue({
        appliedDiscounts: [{ discountId: 'disc_001', code: 'PCT15', description: '15% off', savingAmount: 4200 }],
        discountTotal: 4200,
      });

      const summary = service.checkout('cart_1');

      expect(summary.appliedDiscounts).toHaveLength(1);
      expect(summary.discountTotal).toBe(4200);
      expect(summary.totalPaid).toBe(27999 - 4200);
    });
  });

  describe('failed checkout', () => {
    it('throws BadRequestException with failures array when reservation insufficient', () => {
      const cart = makeActiveCart('cart_1');
      cartService.getCart.mockReturnValue(cart);
      // Simulate reservation partially missing
      stockService.getCartReservations.mockReturnValue(new Map([['prod_001', 0]]));

      expect(() => service.checkout('cart_1')).toThrow(BadRequestException);
    });

    it('releases reservations on stock failure', () => {
      const cart = makeActiveCart('cart_1');
      cartService.getCart.mockReturnValue(cart);
      stockService.getCartReservations.mockReturnValue(new Map());

      try {
        service.checkout('cart_1');
      } catch {
        // expected
      }

      expect(stockService.releaseAllReservations).toHaveBeenCalledWith('cart_1');
    });
  });

  describe('cart state guards', () => {
    it('propagates GoneException for expired cart', () => {
      cartService.getCart.mockImplementation(() => {
        throw new GoneException({ message: 'Cart has expired', cartId: 'cart_1' });
      });
      expect(() => service.checkout('cart_1')).toThrow(GoneException);
    });

    it('propagates ConflictException for already checked-out cart', () => {
      cartService.getCart.mockImplementation(() => {
        throw new ConflictException({ message: 'Cart already checked out', cartId: 'cart_1' });
      });
      expect(() => service.checkout('cart_1')).toThrow(ConflictException);
    });
  });
});
