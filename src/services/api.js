const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

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

export async function loginUser(email, password) {
  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' };
  }

  const result = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

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

  const result = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || '',
      password: data.password,
    }),
  });

  if (!result.success) return result;

  return {
    success: true,
    user: mapAuthUser(result.data),
    token: result.data.idToken,
    refreshToken: result.data.refreshToken,
  };
}

export async function fetchProducts() {
  const result = await request('/products');
  if (!result.success) return result;

  return {
    success: true,
    products: Array.isArray(result.data) ? result.data : [],
  };
}

export async function fetchProductById(id) {
  const result = await request(`/products/${id}`);
  if (!result.success) return result;

  return {
    success: true,
    product: result.data,
  };
}

export async function addToCartAPI() {
  return { success: true, message: 'Product added to cart.' };
}

export async function removeFromCartAPI() {
  return { success: true, message: 'Product removed from cart.' };
}

export async function fetchWishlist(email) {
  if (!email) {
    return { success: false, error: 'Please sign in to view your wishlist.' };
  }

  const result = await request(`/wishlist/${encodeURIComponent(email)}`);
  if (!result.success) return result;

  return {
    success: true,
    items: Array.isArray(result.data) ? result.data : [],
  };
}

export async function addToWishlistAPI(email, productId) {
  if (!email) {
    return { success: false, error: 'Please sign in to add items to your wishlist.' };
  }

  const result = await request('/wishlist/add', {
    method: 'POST',
    body: JSON.stringify({ userEmail: email, productId }),
  });
  if (!result.success) return result;

  return { success: true, data: result.data };
}

export async function removeFromWishlistAPI(email, productId) {
  if (!email) {
    return { success: false, error: 'Please sign in to update your wishlist.' };
  }

  const result = await request(`/wishlist/remove/${encodeURIComponent(productId)}?email=${encodeURIComponent(email)}`, {
    method: 'DELETE',
  });
  if (!result.success) return result;

  return { success: true, data: result.data };
}

export async function createOrder(orderPayload) {
  const result = await request('/orders', {
    method: 'POST',
    body: JSON.stringify(orderPayload),
  });
  if (!result.success) return result;

  return {
    success: true,
    order: result.data,
  };
}

export function getInvoiceDownloadUrl(orderId) {
  if (!orderId) return null;
  return `${BASE_URL}/orders/${encodeURIComponent(orderId)}/invoice`;
}

export async function fetchUserOrders(email) {
  if (!email) {
    return { success: false, error: 'Email is required.' };
  }

  const result = await request(`/orders/user/${encodeURIComponent(email)}`);
  if (!result.success) return result;

  return {
    success: true,
    orders: Array.isArray(result.data) ? result.data : [],
  };
}

export async function fetchProductComments(productId) {
  if (!productId) {
    return { success: false, error: 'Product is required.' };
  }

  const result = await request(`/comments/product/${encodeURIComponent(productId)}`);
  if (!result.success) return result;

  return {
    success: true,
    comments: Array.isArray(result.data) ? result.data : [],
  };
}

export async function submitProductComment({ productId, userEmail, userName, text }) {
  if (!productId) {
    return { success: false, error: 'Product is required.' };
  }
  if (!userEmail) {
    return { success: false, error: 'Please sign in to comment.' };
  }

  const result = await request(`/comments/product/${encodeURIComponent(productId)}`, {
    method: 'POST',
    body: JSON.stringify({ userEmail, userName, text }),
  });
  if (!result.success) return result;

  return {
    success: true,
    data: result.data,
  };
}

export async function fetchProductRatingSummary(productId) {
  if (!productId) {
    return { success: false, error: 'Product is required.' };
  }

  const result = await request(`/ratings/product/${encodeURIComponent(productId)}`);
  if (!result.success) return result;

  return {
    success: true,
    summary: result.data,
  };
}

export async function submitProductRating({ productId, userEmail, userName, rating }) {
  if (!productId) {
    return { success: false, error: 'Product is required.' };
  }
  if (!userEmail) {
    return { success: false, error: 'Please sign in to rate this product.' };
  }

  const result = await request(`/ratings/product/${encodeURIComponent(productId)}`, {
    method: 'POST',
    body: JSON.stringify({ userEmail, userName, rating }),
  });
  if (!result.success) return result;

  return {
    success: true,
    summary: result.data,
  };
}
