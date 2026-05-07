import { describe, it, expect } from 'vitest';
import products from '../data/products';

describe('products data', () => {
  it('has unique ids for every product', () => {
    const ids = products.map((product) => product.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(ids.length);
  });
});
