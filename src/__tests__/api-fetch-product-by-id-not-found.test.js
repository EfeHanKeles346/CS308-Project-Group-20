import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchProductById } from '../services/api';

describe('fetchProductById', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fails for non-existing product', async () => {
    globalThis.fetch.mockResolvedValue({
      ok: false,
      text: async () => JSON.stringify({ message: 'Product not found.' }),
    });

    const result = await fetchProductById(9999);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
