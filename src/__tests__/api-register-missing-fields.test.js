import { describe, it, expect } from 'vitest';
import { registerUser } from '../services/api';

describe('registerUser', () => {
  it('fails with missing fields', async () => {
    const result = await registerUser({ email: 'test@example.com', password: 'pass' });

    expect(result.success).toBe(false);
  });
});
