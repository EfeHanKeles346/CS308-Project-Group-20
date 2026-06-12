import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchCategories } from '../services/api';

describe('fetchCategories', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns categories array', async () => {
    globalThis.fetch.mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify([{ id: 'phones', name: 'Phones' }]),
    });

    const result = await fetchCategories();

    expect(result.success).toBe(true);
    expect(Array.isArray(result.categories)).toBe(true);
    expect(result.categories[0].id).toBe('phones');
  });
});
