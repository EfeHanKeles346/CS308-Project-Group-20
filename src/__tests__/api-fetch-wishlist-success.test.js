import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchWishlist } from '../services/api';

describe('fetchWishlist', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('encodes email and returns items', async () => {
    globalThis.fetch.mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify([{ productId: 1 }]),
    });

    const result = await fetchWishlist('user@example.com');

    expect(result.success).toBe(true);
    expect(Array.isArray(result.items)).toBe(true);
    const url = globalThis.fetch.mock.calls[0][0];
    expect(url).toContain(encodeURIComponent('user@example.com'));
  });
});
