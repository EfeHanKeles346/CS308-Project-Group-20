import { describe, it, expect } from 'vitest';
import { addToWishlistAPI } from '../services/api';

describe('addToWishlistAPI', () => {
  it('rejects missing email', async () => {
    const result = await addToWishlistAPI('', 1);
    expect(result.success).toBe(false);
  });
});
