import { describe, it, expect } from 'vitest';
import { normalizeProduct } from '../utils/productUtils';

describe('normalizeProduct', () => {
  it('builds five stars from rating', () => {
    const result = normalizeProduct({ id: 1, rating: 3.5 });
    expect(result.stars).toHaveLength(5);
    expect(result.stars[0]).toBe(1);
    expect(result.stars[3]).toBe(0.5);
  });
});
