const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
const MOCK_AUTH_STORAGE_KEY = 'techmind_mock_auth_users';
const ENABLE_MOCK_AUTH = import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCK_AUTH === 'true';

async function parseJsonSafe(response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { message: 'Unexpected server response.' };
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await parseJsonSafe(response);

  if (!response.ok) {
    return {
      success: false,
      error: payload.message || 'Request failed.',
    };
  }

  return {
    success: true,
    data: payload,
  };
}

function mapAuthUser(data) {
  return {
    id: data.uid,
    uid: data.uid,
    name: data.displayName,
    email: data.email,
  };
}

function readMockUsers() {
  try {
    const raw = localStorage.getItem(MOCK_AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeMockUsers(users) {
  localStorage.setItem(MOCK_AUTH_STORAGE_KEY, JSON.stringify(users));
}

function createMockToken(email) {
  return `mock-token-${email}-${Date.now()}`;
}

function isNetworkError(error) {
  return error instanceof TypeError || error?.name === 'TypeError';
}

function shouldUseMockAuth(error) {
  return ENABLE_MOCK_AUTH && isNetworkError(error);
}

function buildMockAuthSuccess(user) {
  return {
    success: true,
    user: mapAuthUser(user),
    token: createMockToken(user.email),
    refreshToken: `mock-refresh-${user.uid}`,
  };
}

function loginMockUser(email, password) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = readMockUsers().find((item) => item.email.toLowerCase() === normalizedEmail);

  if (!user || user.password !== password) {
    return { success: false, error: 'Invalid email or password.' };
  }

  return buildMockAuthSuccess(user);
}

function registerMockUser(data) {
  const normalizedEmail = data.email.trim().toLowerCase();
  const users = readMockUsers();

  if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
    return { success: false, error: 'An account with this email already exists.' };
  }

  const user = {
    uid: `mock-${globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : Date.now()}`,
    email: normalizedEmail,
    displayName: `${data.firstName} ${data.lastName}`.trim(),
    phone: data.phone || '',
    password: data.password,
  };

  writeMockUsers([...users, user]);
  return buildMockAuthSuccess(user);
}

export async function loginUser(email, password) {
  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' };
  }

  let result;
  try {
    result = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  } catch (error) {
    if (shouldUseMockAuth(error)) return loginMockUser(email, password);
    throw error;
  }

  if (!result.success) return result;

  return {
    success: true,
    user: mapAuthUser(result.data),
    token: result.data.idToken,
    refreshToken: result.data.refreshToken,
  };
}

export async function registerUser(data) {
  if (!data.email || !data.password || !data.firstName || !data.lastName) {
    return { success: false, error: 'All required fields must be filled.' };
  }
  if (data.password.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters.' };
  }

  let result;
  try {
    result = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || '',
        password: data.password,
      }),
    });
  } catch (error) {
    if (shouldUseMockAuth(error)) return registerMockUser(data);
    throw error;
  }

  if (!result.success) return result;

  return {
    success: true,
    user: mapAuthUser(result.data),
    token: result.data.idToken,
    refreshToken: result.data.refreshToken,
  };
}

export async function fetchProducts() {
  const products = (await import('../data/products.js')).default;
  return { success: true, products };
}

export async function fetchProductById(id) {
  const products = (await import('../data/products.js')).default;
  const product = products.find((p) => p.id === id);
  if (!product) return { success: false, error: 'Product not found.' };
  return { success: true, product };
}

export async function addToCartAPI(productId, quantity = 1) {
  return { success: true, message: 'Product added to cart.' };
}

export async function removeFromCartAPI(productId) {
  return { success: true, message: 'Product removed from cart.' };
}

export async function toggleWishlistAPI(productId) {
  return { success: true };
}
