import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { CartProvider, useCart } from '../context/CartContext';
import { ToastProvider } from '../context/ToastContext';
import { ProductsProvider } from '../context/ProductsContext';

const mockProduct = {
  id: 1,
  brand: 'Test',
  name: 'Test Product',
  price: 100,
  priceDisplay: '$100',
  stock: 10,
  img: '',
  stars: [1, 1, 1, 1, 0],
  rating: 4,
  reviews: 50,
  reviewsDisplay: '50',
  tags: [],
  category: 'test',
  description: 'Test',
  badge: '',
  badgeType: '',
  oldPrice: null,
  oldPriceDisplay: '',
};

const wrapper = ({ children }) => (
  <ToastProvider>
    <ProductsProvider>
      <CartProvider>{children}</CartProvider>
    </ProductsProvider>
  </ToastProvider>
);

describe('CartContext', () => {
  beforeEach(() => {
    localStorage.clear();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify([mockProduct]),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('updates quantity', async () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
    await act(async () => { await result.current.addToCart(mockProduct); });
    await act(async () => { await result.current.updateQuantity(1, 5); });
    await waitFor(() => expect(result.current.cartCount).toBe(5));
    expect(result.current.cartTotal).toBe(500);
  });
});
