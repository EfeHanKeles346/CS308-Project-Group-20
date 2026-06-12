import { describe, it, expect } from 'vitest';
import { normalizeProduct } from '../utils/productUtils';

describe('normalizeProduct', () => {
  it('formats priceDisplay', () => {
    const result = normalizeProduct({ id: 1, price: 299 });
    expect(result.priceDisplay).toMatch(/299/);
  });
});
