import { Discount } from '../common/interfaces/discount.interface';

const FAR_FUTURE = new Date('2099-12-31');
const EPOCH = new Date('2024-01-01');

export const DISCOUNTS_SEED: Discount[] = [
  {
    id: 'disc_001',
    code: 'SONY15',
    description: '15% off Sony WH-1000XM5 Headphones',
    type: 'PERCENTAGE_OFF',
    isActive: true,
    validFrom: EPOCH,
    validTo: FAR_FUTURE,
    productId: 'prod_001',
    percentage: 15,
  },
  {
    id: 'disc_002',
    code: 'DYSON10',
    description: '£10 off Dyson V15 Detect Vacuum',
    type: 'FIXED_AMOUNT_OFF',
    isActive: true,
    validFrom: EPOCH,
    validTo: FAR_FUTURE,
    productId: 'prod_004',
    amountOff: 1000, // £10.00
  },
  {
    id: 'disc_003',
    code: 'COFFEE3FOR2',
    description: 'Buy 2 bags of coffee, get 1 free',
    type: 'BUY_X_GET_Y_FREE',
    isActive: true,
    validFrom: EPOCH,
    validTo: FAR_FUTURE,
    productId: 'prod_003',
    buyQuantity: 2,
    getFreeQuantity: 1,
  },
  {
    id: 'disc_004',
    code: 'SPEND100',
    description: 'Spend £100 or more and get £15 off your basket',
    type: 'BASKET_THRESHOLD',
    isActive: true,
    validFrom: EPOCH,
    validTo: FAR_FUTURE,
    thresholdAmount: 10000, // £100.00
    amountOff: 1500,        // £15.00
  },
  {
    id: 'disc_005',
    code: 'BEAUTY3FOR25',
    description: 'Any 3 beauty or food items for £25',
    type: 'MULTI_BUY_FIXED',
    isActive: true,
    validFrom: EPOCH,
    validTo: FAR_FUTURE,
    category: 'beauty,food',
    requiredQuantity: 3,
    fixedPrice: 2500, // £25.00 per bundle of 3
  },
];
