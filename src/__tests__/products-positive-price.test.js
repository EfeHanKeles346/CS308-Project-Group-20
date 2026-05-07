import { describe, it, expect } from 'vitest';
import products from '../data/products';

describe('products data', () => {
  it('has positive numeric prices', () => {
    products.forEach((product) => {
      expect(product.price).toBeGreaterThan(0);
      expect(typeof product.price).toBe('number');
    });
  });
});
