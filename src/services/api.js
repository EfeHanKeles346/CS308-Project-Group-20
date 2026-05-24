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

function getErrorMessage(payload, fallback = 'Request failed.') {
  const candidates = [payload?.message, payload?.error, payload?.detail, payload?.title];
  const message = candidates
    .map((value) => String(value || '').trim())
    .find((value) => value && value !== 'No message available' && value !== 'Internal Server Error');

  return message || fallback;
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
      error: getErrorMessage(payload),
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
    role: data.role || 'customer',
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

export async function fetchCategories() {
  const result = await request('/categories');
  if (!result.success) return result;

  return {
    success: true,
    categories: Array.isArray(result.data) ? result.data : [],
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

export async function cancelOrder(orderId, userEmail) {
  if (!orderId) {
    return { success: false, error: 'Order is required.' };
  }

  const result = await request(`/orders/${encodeURIComponent(orderId)}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ userEmail }),
  });
  if (!result.success) return result;

  return { success: true, order: result.data };
}

export async function createRefundRequest(orderId, userEmail, reason) {
  if (!orderId) {
    return { success: false, error: 'Order is required.' };
  }

  const result = await request(`/orders/${encodeURIComponent(orderId)}/refund`, {
    method: 'POST',
    body: JSON.stringify({ userEmail, reason }),
  });
  if (!result.success) return result;

  return { success: true, refund: result.data };
}

export async function fetchSalesManagerProducts() {
  const result = await request('/sales-manager/products');
  if (!result.success) return result;

  return { success: true, products: Array.isArray(result.data) ? result.data : [] };
}

export async function updateSalesManagerPrice(productId, price) {
  const result = await request(`/sales-manager/products/${encodeURIComponent(productId)}/price`, {
    method: 'PATCH',
    body: JSON.stringify({ price }),
  });
  if (!result.success) return result;

  return { success: true, product: result.data };
}

export async function applySalesManagerDiscount(productId, discountPercent) {
  const result = await request(`/sales-manager/products/${encodeURIComponent(productId)}/discount`, {
    method: 'PATCH',
    body: JSON.stringify({ discountPercent }),
  });
  if (!result.success) return result;

  return { success: true, product: result.data };
}

export async function fetchSalesManagerOrders(from, to) {
  const params = new URLSearchParams();
  if (from) params.set('from', String(from));
  if (to) params.set('to', String(to));
  const query = params.toString() ? `?${params.toString()}` : '';
  const result = await request(`/sales-manager/orders${query}`);
  if (!result.success) return result;

  return { success: true, orders: Array.isArray(result.data) ? result.data : [] };
}

export async function fetchSalesManagerRevenue(from, to) {
  const params = new URLSearchParams();
  if (from) params.set('from', String(from));
  if (to) params.set('to', String(to));
  const query = params.toString() ? `?${params.toString()}` : '';
  const result = await request(`/sales-manager/revenue${query}`);
  if (!result.success) return result;

  return { success: true, revenue: Array.isArray(result.data) ? result.data : [] };
}

export async function fetchRefundRequests() {
  const result = await request('/sales-manager/refunds');
  if (!result.success) return result;

  return { success: true, refunds: Array.isArray(result.data) ? result.data : [] };
}

export async function decideRefundRequest(refundId, decision, note = '') {
  const result = await request(`/sales-manager/refunds/${encodeURIComponent(refundId)}/decision`, {
    method: 'POST',
    body: JSON.stringify({ decision, note }),
  });
  if (!result.success) return result;

  return { success: true, refund: result.data };
}

export async function fetchProductManagerCategories() {
  const result = await request('/product-manager/categories');
  if (!result.success) return result;

  return { success: true, categories: Array.isArray(result.data) ? result.data : [] };
}

export async function addProductManagerCategory(category) {
  const result = await request('/product-manager/categories', {
    method: 'POST',
    body: JSON.stringify(category),
  });
  if (!result.success) return result;

  return { success: true, category: result.data };
}

export async function removeProductManagerCategory(categoryId) {
  const result = await request(`/product-manager/categories/${encodeURIComponent(categoryId)}`, {
    method: 'DELETE',
  });
  if (!result.success) return result;

  return { success: true, category: result.data };
}

export async function fetchProductManagerProducts() {
  const result = await request('/product-manager/products');
  if (!result.success) return result;

  return { success: true, products: Array.isArray(result.data) ? result.data : [] };
}

export async function addProductManagerProduct(product) {
  const result = await request('/product-manager/products', {
    method: 'POST',
    body: JSON.stringify(product),
  });
  if (!result.success) return result;

  return { success: true, product: result.data };
}

export async function archiveProductManagerProduct(productId) {
  const result = await request(`/product-manager/products/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
  });
  if (!result.success) return result;

  return { success: true, product: result.data };
}

export async function updateProductManagerStock(productId, stock) {
  const result = await request(`/product-manager/products/${encodeURIComponent(productId)}/stock`, {
    method: 'PATCH',
    body: JSON.stringify({ stock }),
  });
  if (!result.success) return result;

  return { success: true, product: result.data };
}

export async function fetchProductManagerOrders(from, to) {
  const params = new URLSearchParams();
  if (from) params.set('from', String(from));
  if (to) params.set('to', String(to));
  const query = params.toString() ? `?${params.toString()}` : '';
  const result = await request(`/product-manager/orders${query}`);
  if (!result.success) return result;

  return { success: true, orders: Array.isArray(result.data) ? result.data : [] };
}

export async function updateProductManagerOrderStatus(orderId, status) {
  const result = await request(`/product-manager/orders/${encodeURIComponent(orderId)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  if (!result.success) return result;

  return { success: true, order: result.data };
}

export async function fetchProductManagerComments() {
  const result = await request('/product-manager/comments');
  if (!result.success) return result;

  return { success: true, comments: Array.isArray(result.data) ? result.data : [] };
}

export async function decideProductManagerComment(productId, commentId, status) {
  const result = await request(
    `/product-manager/comments/${encodeURIComponent(productId)}/${encodeURIComponent(commentId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }
  );
  if (!result.success) return result;

  return { success: true, comment: result.data };
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

export async function fetchUserProductRating(productId, userEmail) {
  if (!productId) {
    return { success: false, error: 'Product is required.' };
  }
  if (!userEmail) {
    return { success: false, error: 'Please sign in to rate this product.' };
  }

  const result = await request(
    `/ratings/product/${encodeURIComponent(productId)}/user?email=${encodeURIComponent(userEmail)}`
  );
  if (!result.success) return result;

  return {
    success: true,
    rating: Number(result.data?.rating || 0),
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
