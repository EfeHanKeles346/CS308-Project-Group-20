import { describe, it, expect } from 'vitest';
import { normalizeProduct } from '../utils/productUtils';

describe('normalizeProduct', () => {
  it('returns null for empty product', () => {
    expect(normalizeProduct(null)).toBeNull();
    expect(normalizeProduct(undefined)).toBeNull();
  });
});
