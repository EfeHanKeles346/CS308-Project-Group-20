import { describe, it, expect } from 'vitest';
import products from '../data/products';

describe('products data', () => {
  it('has ratings between zero and five', () => {
    products.forEach((product) => {
      expect(product.rating).toBeGreaterThanOrEqual(0);
      expect(product.rating).toBeLessThanOrEqual(5);
    });
  });
});
