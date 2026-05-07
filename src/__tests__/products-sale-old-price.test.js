import { describe, it, expect } from 'vitest';
import products from '../data/products';

describe('products data', () => {
  it('has oldPrice above price for sale products', () => {
    products.filter((product) => product.tags.includes('sale')).forEach((product) => {
      expect(product.oldPrice).toBeGreaterThan(product.price);
    });
  });
});
