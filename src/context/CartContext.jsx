/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import axios from 'axios';
import { useToast } from './ToastContext';
import { useProducts } from './ProductsContext';
import { normalizeProduct } from '../utils/productUtils';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
const GUEST_CART_KEY = 'guest_cart';
const OPEN_TABS_KEY = 'guest_cart_open_tabs';
const CartContext = createContext();

function readGuestCart() {
  try {
    const saved = localStorage.getItem(GUEST_CART_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function writeGuestCart(items) {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

function clearGuestCart() {
  localStorage.removeItem(GUEST_CART_KEY);
}

function readOpenTabs() {
  const raw = Number(localStorage.getItem(OPEN_TABS_KEY) || '0');
  return Number.isFinite(raw) && raw > 0 ? raw : 0;
}

export function CartProvider({ children, user }) {
  const [items, setItems] = useState(() => readGuestCart());
  const { showToast } = useToast();
  const { products, loading: productsLoading } = useProducts();
  const previousUserRef = useRef(user);

  const productMap = useMemo(() => (
    new Map(products.map((product) => [Number(product.id), product]))
  ), [products]);

  useEffect(() => {
    const navigationEntry = performance.getEntriesByType('navigation')[0];
    const navigationType = navigationEntry?.type;
    const openTabs = readOpenTabs();
    const nextOpenTabs = openTabs + 1;

    localStorage.setItem(OPEN_TABS_KEY, String(nextOpenTabs));

    if (!user && nextOpenTabs === 1 && navigationType !== 'reload') {
      clearGuestCart();
      queueMicrotask(() => setItems([]));
    }

    const handleBeforeUnload = () => {
      const remainingTabs = Math.max(readOpenTabs() - 1, 0);
      if (remainingTabs === 0) {
        localStorage.removeItem(OPEN_TABS_KEY);
        clearGuestCart();
      } else {
        localStorage.setItem(OPEN_TABS_KEY, String(remainingTabs));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      writeGuestCart(items);
    }
  }, [items, user]);

  useEffect(() => {
    if (user) return undefined;

    const handleStorage = (event) => {
      if (event.key !== GUEST_CART_KEY) return;
      setItems(event.newValue ? JSON.parse(event.newValue) : []);
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [user]);

  useEffect(() => {
    if (productsLoading) return;

    if (user?.email) {
      const guestItems = readGuestCart()
        .map((item) => normalizeProduct(item))
        .filter(Boolean);

      axios.get(`${BASE_URL}/cart/${user.email}`)
        .then(async (response) => {
          const dbItems = response.data
            .map((item) => normalizeProduct(item))
            .filter(Boolean);

          const mergedItemsMap = new Map(
            dbItems.map((item) => [Number(item.id), { ...item }])
          );

          for (const guestItem of guestItems) {
            const productId = Number(guestItem.id);
            const existing = mergedItemsMap.get(productId);
            const baseItem = existing || productMap.get(productId) || guestItem;
            const currentQuantity = existing?.quantity ?? 0;
            const maxStock = baseItem.stock || guestItem.stock || currentQuantity + guestItem.quantity;
            const mergedQuantity = Math.min(currentQuantity + guestItem.quantity, maxStock);

            mergedItemsMap.set(productId, {
              ...baseItem,
              quantity: mergedQuantity,
            });

            try {
              await axios.put(`${BASE_URL}/cart/update`, {
                userEmail: user.email,
                productId,
                quantity: mergedQuantity,
              });
            } catch (error) {
              console.error('Failed to sync guest item to backend:', error);
            }
          }

          const mergedItems = [...mergedItemsMap.values()];

          clearGuestCart();
          setItems(mergedItems);
        })
        .catch((error) => {
          console.error('Failed to fetch cart from backend:', error);
        });
    } else if (previousUserRef.current) {
      clearGuestCart();
      queueMicrotask(() => setItems([]));
    } else {
      const hydratedGuestCart = readGuestCart()
        .map((item) => {
          const product = productMap.get(Number(item.id));
          if (!product) {
            return normalizeProduct(item);
          }
          return normalizeProduct({
            ...product,
            quantity: item.quantity,
          });
        })
        .filter(Boolean);

      queueMicrotask(() => setItems(hydratedGuestCart));
    }

    previousUserRef.current = user;
  }, [productMap, productsLoading, user]);

  const cartCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const cartTotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const addToCart = useCallback(async (product) => {
    const normalizedProduct = normalizeProduct(product);
    let reachedLimit = false;

    setItems((prev) => {
      const existing = prev.find((item) => item.id === normalizedProduct.id);
      if (existing) {
        if (existing.quantity >= normalizedProduct.stock) {
          reachedLimit = true;
          return prev;
        }
        return prev.map((item) =>
          item.id === normalizedProduct.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...normalizedProduct, quantity: 1 }];
    });

    if (reachedLimit) {
      showToast('Maximum stock reached!', 'error');
      return;
    }

    if (user?.email) {
      try {
        await axios.post(`${BASE_URL}/cart/add`, {
          userEmail: user.email,
          productId: normalizedProduct.id,
          quantity: 1,
        });
      } catch (error) {
        console.error('Failed to sync cart with backend:', error);
        showToast(error?.response?.data?.message || 'Cart could not be synced.', 'error');
      }
    }

    showToast('Product added to cart!', 'success');
  }, [showToast, user]);

  const removeFromCart = useCallback(async (productId) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));

    if (user?.email) {
      try {
        await axios.delete(`${BASE_URL}/cart/remove/${productId}?email=${user.email}`);
      } catch (error) {
        console.error('Failed to remove item from backend:', error);
      }
    }

    showToast('Product removed from cart.', 'error');
  }, [showToast, user]);

  const updateQuantity = useCallback(async (productId, quantity) => {
    const existingItem = items.find((item) => item.id === productId);
    if (!existingItem) return;

    const nextQuantity = Math.max(0, Math.min(quantity, existingItem.stock ?? quantity));

    if (nextQuantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    const previousItems = items;

    setItems((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, quantity: nextQuantity } : item))
    );

    if (user?.email) {
      try {
        await axios.put(`${BASE_URL}/cart/update`, {
          userEmail: user.email,
          productId,
          quantity: nextQuantity,
        });
      } catch (error) {
        console.error('Failed to update cart quantity on backend:', error);
        setItems(previousItems);
        showToast(error?.response?.data?.message || 'Cart quantity could not be updated.', 'error');
      }
    }
  }, [items, removeFromCart, showToast, user]);

  const clearCart = useCallback(async () => {
    setItems([]);
    if (user?.email) {
      try {
        await axios.delete(`${BASE_URL}/cart/clear/${user.email}`);
      } catch (error) {
        console.error('Failed to clear cart on backend:', error);
      }
    } else {
      clearGuestCart();
    }
  }, [user]);

  const isInCart = useCallback((productId) => items.some((item) => item.id === productId), [items]);

  return (
    <CartContext.Provider
      value={{ items, cartCount, cartTotal, addToCart, removeFromCart, updateQuantity, clearCart, isInCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
