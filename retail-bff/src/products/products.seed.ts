import { Product } from '../common/interfaces/product.interface';

export const PRODUCTS_SEED: Product[] = [
  {
    id: 'prod_001',
    name: 'Sony WH-1000XM5 Headphones',
    description:
      'Industry-leading noise cancelling wireless headphones with 30-hour battery life and crystal-clear hands-free calling.',
    price: 27999, // £279.99
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    category: 'electronics',
    sku: 'SNY-WH1000XM5-BLK',
  },
  {
    id: 'prod_002',
    name: "Levi's 501 Original Fit Jeans",
    description:
      "The original jean since 1873. Levi's iconic straight fit with button fly, in classic stonewash denim.",
    price: 8999, // £89.99
    imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400',
    category: 'clothing',
    sku: 'LVS-501-32W32L-SWS',
  },
  {
    id: 'prod_003',
    name: 'Organic Ground Coffee 1kg',
    description:
      'Single-origin Colombian arabica beans, medium roast. Smooth, rich flavour with notes of chocolate and hazelnut.',
    price: 1299, // £12.99
    imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400',
    category: 'food',
    sku: 'COF-ORG-COL-1KG',
  },
  {
    id: 'prod_004',
    name: 'Dyson V15 Detect Vacuum',
    description:
      'Laser reveals invisible dust. Automatically adapts suction power and reports scientific proof of clean.',
    price: 59999, // £599.99
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    category: 'home',
    sku: 'DYS-V15-DET-GLD',
  },
  {
    id: 'prod_005',
    name: 'CeraVe Moisturising Cream 454g',
    description:
      'Daily face and body moisturiser for dry to very dry skin. With 3 essential ceramides and hyaluronic acid.',
    price: 1499, // £14.99
    imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400',
    category: 'beauty',
    sku: 'CVE-MOIST-CRM-454',
  },
];
