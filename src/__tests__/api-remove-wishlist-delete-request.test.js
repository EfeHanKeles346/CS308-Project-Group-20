import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { removeFromWishlistAPI } from '../services/api';

describe('removeFromWishlistAPI', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends encoded DELETE request', async () => {
    globalThis.fetch.mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({}),
    });

    await removeFromWishlistAPI('user@example.com', 'prod-1');

    const [url, options] = globalThis.fetch.mock.calls[0];
    expect(options.method).toBe('DELETE');
    expect(url).toContain(encodeURIComponent('prod-1'));
  });
});
