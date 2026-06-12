import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { addToWishlistAPI } from '../services/api';

describe('addToWishlistAPI', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('posts userEmail and productId', async () => {
    globalThis.fetch.mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({}),
    });

    await addToWishlistAPI('user@example.com', 42);

    const options = globalThis.fetch.mock.calls[0][1];
    const body = JSON.parse(options.body);
    expect(body.userEmail).toBe('user@example.com');
    expect(body.productId).toBe(42);
  });
});
