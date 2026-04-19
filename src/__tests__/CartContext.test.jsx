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

  it('should start with empty cart', async () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    await waitFor(() => expect(result.current.items).toHaveLength(0));
    expect(result.current.cartCount).toBe(0);
    expect(result.current.cartTotal).toBe(0);
  });

  it('should add a product to cart', async () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    await act(async () => { await result.current.addToCart(mockProduct); });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.cartCount).toBe(1);
    expect(result.current.cartTotal).toBe(100);
  });

  it('should increase quantity when adding same product twice', async () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    await act(async () => { await result.current.addToCart(mockProduct); });
    await act(async () => { await result.current.addToCart(mockProduct); });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.cartCount).toBe(2);
    expect(result.current.cartTotal).toBe(200);
  });

  it('should handle multiple different products', async () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    await act(async () => { await result.current.addToCart(mockProduct); });
    await act(async () => { await result.current.addToCart(mockProduct2); });
    expect(result.current.items).toHaveLength(2);
    expect(result.current.cartCount).toBe(2);
    expect(result.current.cartTotal).toBe(300);
  });

  it('should remove a product from cart', async () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    await act(async () => { await result.current.addToCart(mockProduct); });
    await act(async () => { await result.current.addToCart(mockProduct2); });
    await act(async () => { await result.current.removeFromCart(1); });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].id).toBe(2);
  });

  it('should update quantity', async () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    await act(async () => { await result.current.addToCart(mockProduct); });
    await act(async () => { await result.current.updateQuantity(1, 5); });
    expect(result.current.cartCount).toBe(5);
    expect(result.current.cartTotal).toBe(500);
  });

  it('should remove item when quantity set to 0', async () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    await act(async () => { await result.current.addToCart(mockProduct); });
    await act(async () => { await result.current.updateQuantity(1, 0); });
    expect(result.current.items).toHaveLength(0);
  });

  it('should clear all items', async () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    await act(async () => { await result.current.addToCart(mockProduct); });
    await act(async () => { await result.current.addToCart(mockProduct2); });
    await act(async () => { await result.current.clearCart(); });
    expect(result.current.items).toHaveLength(0);
    expect(result.current.cartCount).toBe(0);
  });

  it('should report isInCart correctly', async () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    expect(result.current.isInCart(1)).toBe(false);
    await act(async () => { await result.current.addToCart(mockProduct); });
    expect(result.current.isInCart(1)).toBe(true);
    expect(result.current.isInCart(999)).toBe(false);
  });
});
