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

const mockProduct2 = { ...mockProduct, id: 2, name: 'Product 2', price: 200, priceDisplay: '$200' };

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
      text: async () => JSON.stringify([mockProduct, mockProduct2]),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('clears all items', async () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
    await act(async () => { await result.current.addToCart(mockProduct); });
    await act(async () => { await result.current.addToCart(mockProduct2); });
    await act(async () => { await result.current.clearCart(); });
    expect(result.current.items).toHaveLength(0);
    expect(result.current.cartCount).toBe(0);
  });
});
