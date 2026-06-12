import { describe, it, expect } from 'vitest';
import { removeFromWishlistAPI } from '../services/api';

describe('removeFromWishlistAPI', () => {
  it('rejects missing email', async () => {
    const result = await removeFromWishlistAPI('', 1);
    expect(result.success).toBe(false);
  });
});
