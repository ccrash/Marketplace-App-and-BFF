import { CartExpiryService } from './cart-expiry.service';
import { CartService } from './cart.service';
import { StockService } from '../stock/stock.service';
import { Cart } from '../common/interfaces/cart.interface';

function makeCart(id: string, expiresAt: Date): Cart {
  const now = new Date();
  return {
    id,
    status: 'ACTIVE',
    items: [],
    createdAt: now,
    lastActivityAt: now,
    expiresAt,
  };
}

describe('CartExpiryService', () => {
  let service: CartExpiryService;
  let cartService: jest.Mocked<CartService>;
  let stockService: jest.Mocked<StockService>;

  beforeEach(() => {
    cartService = {
      getExpiredCarts: jest.fn(),
      markExpired: jest.fn(),
    } as any;
    stockService = {
      releaseAllReservations: jest.fn(),
    } as any;
    service = new CartExpiryService(cartService as any, stockService as any);
  });

  describe('releaseExpiredCarts', () => {
    it('calls releaseAllReservations and markExpired for each expired cart', () => {
      const cart1 = makeCart('cart_1', new Date(Date.now() - 1000));
      const cart2 = makeCart('cart_2', new Date(Date.now() - 500));
      cartService.getExpiredCarts.mockReturnValue([cart1, cart2]);

      service.releaseExpiredCarts();

      expect(stockService.releaseAllReservations).toHaveBeenCalledWith('cart_1');
      expect(stockService.releaseAllReservations).toHaveBeenCalledWith('cart_2');
      expect(cartService.markExpired).toHaveBeenCalledWith('cart_1');
      expect(cartService.markExpired).toHaveBeenCalledWith('cart_2');
    });

    it('does nothing when there are no expired carts', () => {
      cartService.getExpiredCarts.mockReturnValue([]);
      service.releaseExpiredCarts();
      expect(stockService.releaseAllReservations).not.toHaveBeenCalled();
      expect(cartService.markExpired).not.toHaveBeenCalled();
    });
  });
});
