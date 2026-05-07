import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { registerUser } from '../services/api';

describe('registerUser', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registers with valid data', async () => {
    globalThis.fetch.mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({
        uid: 'user-2',
        email: 'john@example.com',
        displayName: 'John Doe',
        idToken: 'token-2',
        refreshToken: 'refresh-2',
      }),
    });

    const result = await registerUser({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
    });

    expect(result.success).toBe(true);
    expect(result.user.name).toBe('John Doe');
  });
});
