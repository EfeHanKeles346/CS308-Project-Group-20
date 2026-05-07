import { describe, it, expect } from 'vitest';
import products from '../data/products';

describe('products data', () => {
  it('has products defined', () => {
    expect(products).toBeDefined();
    expect(products.length).toBeGreaterThan(0);
  });
});
