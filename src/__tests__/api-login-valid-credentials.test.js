import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loginUser } from '../services/api';

describe('loginUser', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns success with valid credentials', async () => {
    globalThis.fetch.mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({
        uid: 'user-1',
        email: 'test@example.com',
        displayName: 'Test User',
        idToken: 'token-1',
        refreshToken: 'refresh-1',
      }),
    });

    const result = await loginUser('test@example.com', 'password123');

    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.user.email).toBe('test@example.com');
    expect(result.token).toBeDefined();
  });
});
