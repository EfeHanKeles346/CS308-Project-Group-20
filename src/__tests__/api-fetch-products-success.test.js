import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchProducts } from '../services/api';

describe('fetchProducts', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns products array from backend', async () => {
    globalThis.fetch.mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify([{ id: 1, name: 'Phone' }]),
    });

    const result = await fetchProducts();

    expect(result.success).toBe(true);
    expect(Array.isArray(result.products)).toBe(true);
    expect(result.products[0].id).toBe(1);
  });
});
