import { describe, it, expect } from 'vitest';
import products from '../data/products';

describe('products data', () => {
  it('has non-negative integer stock values', () => {
    products.forEach((product) => {
      expect(product.stock).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(product.stock)).toBe(true);
    });
  });
});
