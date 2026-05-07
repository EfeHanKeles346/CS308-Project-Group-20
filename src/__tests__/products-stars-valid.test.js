import { describe, it, expect } from 'vitest';
import products from '../data/products';

describe('products data', () => {
  it('has valid five-star arrays', () => {
    products.forEach((product) => {
      expect(product.stars).toHaveLength(5);
      product.stars.forEach((star) => {
        expect([0, 0.5, 1]).toContain(star);
      });
    });
  });
});
