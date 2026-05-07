import { describe, it, expect } from 'vitest';
import products from '../data/products';

describe('products data', () => {
  it('uses only valid tag values', () => {
    const validTags = ['best-seller', 'new', 'sale'];

    products.forEach((product) => {
      product.tags.forEach((tag) => {
        expect(validTags).toContain(tag);
      });
    });
  });
});
