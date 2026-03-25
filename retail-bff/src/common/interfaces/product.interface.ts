export type ProductCategory = 'electronics' | 'clothing' | 'food' | 'home' | 'beauty';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // pence, e.g. 1299 = £12.99
  imageUrl: string;
  category: ProductCategory;
  sku: string;
}
