import { describe, it, expect } from 'vitest';
import { registerUser } from '../services/api';

describe('registerUser', () => {
  it('fails with short password', async () => {
    const result = await registerUser({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: '123',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('8 characters');
  });
});
