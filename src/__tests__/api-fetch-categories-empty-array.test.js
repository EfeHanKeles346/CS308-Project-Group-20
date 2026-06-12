import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchCategories } from '../services/api';

describe('fetchCategories', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns empty array for non-array response', async () => {
    globalThis.fetch.mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ categories: [] }),
    });

    const result = await fetchCategories();

    expect(result.success).toBe(true);
    expect(result.categories).toEqual([]);
  });
});
