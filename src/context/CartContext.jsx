import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useToast } from './ToastContext';
import axios from 'axios';
import products from '../data/products.js';

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
  const previousUserRef = useRef(user);

  useEffect(() => {
    const navigationEntry = performance.getEntriesByType('navigation')[0];
    const navigationType = navigationEntry?.type;
    const openTabs = readOpenTabs();
    const nextOpenTabs = openTabs + 1;

    localStorage.setItem(OPEN_TABS_KEY, String(nextOpenTabs));

    // Start a fresh guest cart when a brand-new browser session begins.
    if (!user && nextOpenTabs === 1 && navigationType !== 'reload') {
      clearGuestCart();
      setItems([]);
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

  // Keep guest cart shared across tabs during the current browser session.
  useEffect(() => {
    if (!user) {
      writeGuestCart(items);
    }
  }, [items, user]);

  // React to guest cart updates coming from another tab.
  useEffect(() => {
    if (user) return undefined;

    const handleStorage = (event) => {
      if (event.key !== GUEST_CART_KEY) return;
      setItems(event.newValue ? JSON.parse(event.newValue) : []);
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [user]);

  // Fetch cart from backend when user logs in, merge with guest cart, and reset on logout.
  useEffect(() => {
    if (user && user.email) {
      const guestItems = readGuestCart();

      axios.get(`http://localhost:8080/api/cart/${user.email}`)
        .then(async (response) => {
          const dbItems = response.data.map((item) => {
            const productDetail = products.find((p) => Number(p.id) === Number(item.productId));
            return {
              ...productDetail,
              id: item.productId,
              quantity: item.quantity,
              dbId: item.id,
            };
          }).filter(Boolean);

          const mergedItems = [...dbItems];

          for (const guestItem of guestItems) {
            const existing = mergedItems.find((item) => Number(item.id) === Number(guestItem.id));
            if (existing) {
              const newQty = Math.min(
                existing.quantity + guestItem.quantity,
                guestItem.stock || existing.stock
              );
              existing.quantity = newQty;
            } else {
              mergedItems.push(guestItem);
            }

            try {
              await axios.post('http://localhost:8080/api/cart/add', {
                userEmail: user.email,
                productId: guestItem.id,
                quantity: guestItem.quantity,
              });
            } catch (error) {
              console.error('Failed to sync guest item to backend:', error);
            }
          }

          clearGuestCart();
          setItems(mergedItems);
        })
        .catch((error) => {
          console.error('Failed to fetch cart from backend:', error);
        });
    } else {
      if (previousUserRef.current) {
        clearGuestCart();
        setItems([]);
      } else {
        setItems(readGuestCart());
      }
    }

    previousUserRef.current = user;
  }, [user]);

  const cartCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const cartTotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const addToCart = useCallback(async (product) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          showToast('Maximum stock reached!', 'error');
          return prev;
        }
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });

    if (user && user.email) {
      try {
        await axios.post('http://localhost:8080/api/cart/add', {
          userEmail: user.email,
          productId: product.id,
          quantity: 1,
        });
      } catch (error) {
        console.error('Failed to sync cart with backend:', error);
      }
    }
    showToast('Product added to cart!', 'success');
  }, [showToast, user]);

  const removeFromCart = useCallback(async (productId) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));

    if (user && user.email) {
      try {
        await axios.delete(`http://localhost:8080/api/cart/remove/${productId}?email=${user.email}`);
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

    if (user && user.email) {
      try {
        await axios.put('http://localhost:8080/api/cart/update', {
          userEmail: user.email,
          productId,
          quantity: nextQuantity,
        });
      } catch (error) {
        console.error('Failed to update cart quantity on backend:', error);
        setItems(previousItems);
        showToast('Cart quantity could not be updated.', 'error');
      }
    }
  }, [items, removeFromCart, showToast, user]);

  const clearCart = useCallback(async () => {
    setItems([]);
    if (user && user.email) {
      try {
        await axios.delete(`http://localhost:8080/api/cart/clear/${user.email}`);
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
