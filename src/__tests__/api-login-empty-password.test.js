import { describe, it, expect } from 'vitest';
import { loginUser } from '../services/api';

describe('loginUser', () => {
  it('fails with empty password', async () => {
    const result = await loginUser('test@example.com', '');

    expect(result.success).toBe(false);
  });
});
