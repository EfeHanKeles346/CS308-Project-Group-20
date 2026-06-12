import { describe, it, expect } from 'vitest';
import { normalizeProducts } from '../utils/productUtils';

describe('normalizeProducts', () => {
  it('filters invalid products', () => {
    const result = normalizeProducts([{ id: 1 }, null, undefined]);
    expect(result).toHaveLength(1);
  });
});
