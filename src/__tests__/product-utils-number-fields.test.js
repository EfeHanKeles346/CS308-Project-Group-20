import { describe, it, expect } from 'vitest';
import { normalizeProduct } from '../utils/productUtils';

describe('normalizeProduct', () => {
  it('converts numeric fields from strings', () => {
    const result = normalizeProduct({ id: '5', price: '99', rating: '4', reviews: '200', stock: '10' });
    expect(result.price).toBe(99);
    expect(result.rating).toBe(4);
    expect(result.stock).toBe(10);
  });
});
