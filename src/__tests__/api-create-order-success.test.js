import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createOrder } from '../services/api';

describe('createOrder', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('posts payload and returns order', async () => {
    const mockOrder = { orderId: 'ORD-1', total: 299 };
    globalThis.fetch.mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(mockOrder),
    });

    const payload = { userEmail: 'user@example.com', items: [] };
    const result = await createOrder(payload);

    expect(result.success).toBe(true);
    expect(result.order.orderId).toBe('ORD-1');
    const options = globalThis.fetch.mock.calls[0][1];
    expect(JSON.parse(options.body)).toEqual(payload);
  });
});
