import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cancelOrder } from '../services/api';

describe('cancelOrder', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('posts userEmail and returns order', async () => {
    const mockOrder = { orderId: 'ORD-1', status: 'cancelled' };
    globalThis.fetch.mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(mockOrder),
    });

    const result = await cancelOrder('ORD-1', 'user@example.com');

    expect(result.success).toBe(true);
    expect(result.order.orderId).toBe('ORD-1');
    const options = globalThis.fetch.mock.calls[0][1];
    const body = JSON.parse(options.body);
    expect(body.userEmail).toBe('user@example.com');
  });
});
