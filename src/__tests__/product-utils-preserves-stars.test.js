import { describe, it, expect } from 'vitest';
import { normalizeProduct } from '../utils/productUtils';

describe('normalizeProduct', () => {
  it('preserves valid stars array', () => {
    const stars = [1, 1, 1, 0.5, 0];
    const result = normalizeProduct({ id: 1, stars });
    expect(result.stars).toEqual(stars);
  });
});
