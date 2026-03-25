export interface StockLevel {
  productId: string;
  available: number; // free units (not reserved, not sold)
  reserved: number;  // units currently held across active carts
  sold: number;      // units sold since startup
}
