import { describe, it, expect } from 'vitest';
import { normalizeProduct } from '../utils/productUtils';

describe('normalizeProduct', () => {
  it('formats oldPriceDisplay when oldPrice exists', () => {
    const result = normalizeProduct({ id: 1, price: 199, oldPrice: 299 });
    expect(result.oldPriceDisplay).toMatch(/299/);
  });
});
