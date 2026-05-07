import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchProductById } from '../services/api';

describe('fetchProductById', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('finds existing product', async () => {
    globalThis.fetch.mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ id: 1, name: 'Phone' }),
    });

    const result = await fetchProductById(1);

    expect(result.success).toBe(true);
    expect(result.product.id).toBe(1);
  });
});
