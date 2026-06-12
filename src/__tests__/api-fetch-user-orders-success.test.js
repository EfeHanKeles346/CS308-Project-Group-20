import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchUserOrders } from '../services/api';

describe('fetchUserOrders', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns orders array', async () => {
    globalThis.fetch.mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify([{ orderId: 'ORD-1' }]),
    });

    const result = await fetchUserOrders('user@example.com');

    expect(result.success).toBe(true);
    expect(Array.isArray(result.orders)).toBe(true);
    expect(result.orders[0].orderId).toBe('ORD-1');
  });
});
