import { describe, it, expect } from 'vitest';
import { normalizeProduct } from '../utils/productUtils';

describe('normalizeProduct', () => {
  it('uses productId as id fallback', () => {
    const result = normalizeProduct({ productId: 42, name: 'Test' });
    expect(result.id).toBe(42);
  });
});
