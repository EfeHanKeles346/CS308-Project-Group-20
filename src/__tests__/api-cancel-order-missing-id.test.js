import { describe, it, expect } from 'vitest';
import { cancelOrder } from '../services/api';

describe('cancelOrder', () => {
  it('rejects missing orderId', async () => {
    const result = await cancelOrder('', 'user@example.com');
    expect(result.success).toBe(false);
  });
});
