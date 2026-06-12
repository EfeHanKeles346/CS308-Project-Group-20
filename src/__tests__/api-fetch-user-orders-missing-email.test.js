import { describe, it, expect } from 'vitest';
import { fetchUserOrders } from '../services/api';

describe('fetchUserOrders', () => {
  it('rejects missing email', async () => {
    const result = await fetchUserOrders('');
    expect(result.success).toBe(false);
  });
});
