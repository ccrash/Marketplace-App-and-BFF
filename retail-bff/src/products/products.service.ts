import { Injectable, NotFoundException } from '@nestjs/common';
import { Product } from '../common/interfaces/product.interface';
import { StockLevel } from '../common/interfaces/stock.interface';
import { StockService } from '../stock/stock.service';
import { PRODUCTS_SEED } from './products.seed';

@Injectable()
export class ProductsService {
  private readonly products = new Map<string, Product>();

  constructor(private readonly stockService: StockService) {
    for (const product of PRODUCTS_SEED) {
      this.products.set(product.id, product);
    }
  }

  findAll(): Array<Product & { stock: Pick<StockLevel, 'available'> }> {
    return Array.from(this.products.values()).map((p) => ({
      ...p,
      stock: { available: this.stockService.getStockLevel(p.id).available },
    }));
  }

  findOne(id: string): Product & { stock: StockLevel } {
    const product = this.products.get(id);
    if (!product) {
      throw new NotFoundException({ message: 'Product not found', productId: id });
    }
    return { ...product, stock: this.stockService.getStockLevel(id) };
  }

  // Used internally by CartService to look up product details
  getProduct(id: string): Product {
    const product = this.products.get(id);
    if (!product) {
      throw new NotFoundException({ message: 'Product not found', productId: id });
    }
    return product;
  }
}
