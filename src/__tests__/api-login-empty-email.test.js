import { describe, it, expect } from 'vitest';
import { loginUser } from '../services/api';

describe('loginUser', () => {
  it('fails with empty email', async () => {
    const result = await loginUser('', 'password123');

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
