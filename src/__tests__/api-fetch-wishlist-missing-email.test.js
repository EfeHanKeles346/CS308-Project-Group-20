import { describe, it, expect } from 'vitest';
import { fetchWishlist } from '../services/api';

describe('fetchWishlist', () => {
  it('rejects missing email', async () => {
    const result = await fetchWishlist('');
    expect(result.success).toBe(false);
  });
});
