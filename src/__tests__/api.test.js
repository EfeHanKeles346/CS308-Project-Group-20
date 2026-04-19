import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loginUser, registerUser, fetchProducts, fetchProductById } from '../services/api';

describe('API Service - loginUser', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return success with valid credentials', async () => {
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

  it('should fail with empty email', async () => {
    const result = await loginUser('', 'password123');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should fail with empty password', async () => {
    const result = await loginUser('test@example.com', '');
    expect(result.success).toBe(false);
  });
});

describe('API Service - registerUser', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should register with valid data', async () => {
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
      firstName: 'John', lastName: 'Doe',
      email: 'john@example.com', password: 'password123',
    });
    expect(result.success).toBe(true);
    expect(result.user.name).toBe('John Doe');
  });

  it('should fail with missing fields', async () => {
    const result = await registerUser({ email: 'test@example.com', password: 'pass' });
    expect(result.success).toBe(false);
  });

  it('should fail with short password', async () => {
    const result = await registerUser({
      firstName: 'John', lastName: 'Doe',
      email: 'john@example.com', password: '123',
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain('8 characters');
  });
});

describe('API Service - fetchProducts', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return products array from backend', async () => {
    globalThis.fetch.mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify([{ id: 1, name: 'Phone' }]),
    });

    const result = await fetchProducts();
    expect(result.success).toBe(true);
    expect(Array.isArray(result.products)).toBe(true);
    expect(result.products[0].id).toBe(1);
  });
});

describe('API Service - fetchProductById', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should find existing product', async () => {
    globalThis.fetch.mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ id: 1, name: 'Phone' }),
    });

    const result = await fetchProductById(1);
    expect(result.success).toBe(true);
    expect(result.product.id).toBe(1);
  });

  it('should fail for non-existing product', async () => {
    globalThis.fetch.mockResolvedValue({
      ok: false,
      text: async () => JSON.stringify({ message: 'Product not found.' }),
    });

    const result = await fetchProductById(9999);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
