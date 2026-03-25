import { BadRequestException } from '@nestjs/common';
import { StockService } from './stock.service';

describe('StockService', () => {
  let service: StockService;

  beforeEach(() => {
    service = new StockService();
  });

  describe('getStockLevel', () => {
    it('returns seeded stock for a known product', () => {
      const level = service.getStockLevel('prod_001');
      expect(level.available).toBe(15);
      expect(level.reserved).toBe(0);
      expect(level.sold).toBe(0);
    });

    it('returns zeros for unknown product', () => {
      const level = service.getStockLevel('unknown');
      expect(level.available).toBe(0);
    });
  });

  describe('reserve', () => {
    it('deducts from available stock', () => {
      service.reserve('cart_1', 'prod_001', 5);
      expect(service.getStockLevel('prod_001').available).toBe(10);
    });

    it('records reservation', () => {
      service.reserve('cart_1', 'prod_001', 3);
      expect(service.getStockLevel('prod_001').reserved).toBe(3);
    });

    it('throws BadRequestException when insufficient stock', () => {
      expect(() => service.reserve('cart_1', 'prod_001', 100)).toThrow(BadRequestException);
    });

    it('accumulates reservations for same cart and product', () => {
      service.reserve('cart_1', 'prod_001', 3);
      service.reserve('cart_1', 'prod_001', 2);
      expect(service.getStockLevel('prod_001').available).toBe(10);
      expect(service.getStockLevel('prod_001').reserved).toBe(5);
    });
  });

  describe('adjustReservation', () => {
    it('increases reservation and deducts more from available', () => {
      service.reserve('cart_1', 'prod_001', 3);
      service.adjustReservation('cart_1', 'prod_001', 5);
      expect(service.getStockLevel('prod_001').available).toBe(10);
      expect(service.getStockLevel('prod_001').reserved).toBe(5);
    });

    it('decreases reservation and returns stock to available', () => {
      service.reserve('cart_1', 'prod_001', 5);
      service.adjustReservation('cart_1', 'prod_001', 2);
      expect(service.getStockLevel('prod_001').available).toBe(13);
      expect(service.getStockLevel('prod_001').reserved).toBe(2);
    });

    it('throws when adjusting up beyond available stock', () => {
      service.reserve('cart_1', 'prod_001', 10);
      expect(() => service.adjustReservation('cart_1', 'prod_001', 20)).toThrow(BadRequestException);
    });

    it('removes reservation when set to 0', () => {
      service.reserve('cart_1', 'prod_001', 5);
      service.adjustReservation('cart_1', 'prod_001', 0);
      expect(service.getStockLevel('prod_001').available).toBe(15);
      expect(service.getStockLevel('prod_001').reserved).toBe(0);
    });
  });

  describe('releaseAllReservations', () => {
    it('returns all reserved stock to available', () => {
      service.reserve('cart_1', 'prod_001', 5);
      service.reserve('cart_1', 'prod_002', 10);
      service.releaseAllReservations('cart_1');
      expect(service.getStockLevel('prod_001').available).toBe(15);
      expect(service.getStockLevel('prod_002').available).toBe(40);
    });

    it('is a no-op for unknown cart', () => {
      expect(() => service.releaseAllReservations('unknown_cart')).not.toThrow();
    });

    it('only releases stock for the specified cart', () => {
      service.reserve('cart_1', 'prod_001', 3);
      service.reserve('cart_2', 'prod_001', 4);
      service.releaseAllReservations('cart_1');
      // stockLevels starts at 15; reserve cart_1(3) → 12; reserve cart_2(4) → 8;
      // release cart_1(3) → 8 + 3 = 11
      expect(service.getStockLevel('prod_001').available).toBe(11);
      expect(service.getStockLevel('prod_001').reserved).toBe(4);
    });
  });

  describe('commitReservations', () => {
    it('does NOT return stock to available', () => {
      service.reserve('cart_1', 'prod_001', 5);
      service.commitReservations('cart_1');
      expect(service.getStockLevel('prod_001').available).toBe(10);
    });

    it('increments sold count', () => {
      service.reserve('cart_1', 'prod_001', 5);
      service.commitReservations('cart_1');
      expect(service.getStockLevel('prod_001').sold).toBe(5);
    });

    it('removes the reservation entry', () => {
      service.reserve('cart_1', 'prod_001', 5);
      service.commitReservations('cart_1');
      expect(service.getStockLevel('prod_001').reserved).toBe(0);
    });
  });
});
