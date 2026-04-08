import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { useToast } from './ToastContext';
import axios from 'axios';
import products from '../data/products.js';

const GUEST_CART_KEY = 'guest_cart';
const CartContext = createContext();

export function CartProvider({ children, user }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(GUEST_CART_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const { showToast } = useToast();

  // Save to localStorage when guest — persists across tabs, clears when browser closes
  useEffect(() => {
    if (!user) {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
    }
  }, [items, user]);

  // Fetch cart from backend when user logs in, merge with guest cart, clear cart on logout
  useEffect(() => {
    if (user && user.email) {
      // Read guest cart before clearing
      let guestItems = [];
      try {
        const saved = localStorage.getItem(GUEST_CART_KEY);
        guestItems = saved ? JSON.parse(saved) : [];
      } catch {
        guestItems = [];
      }

      axios.get(`http://localhost:8080/api/cart/${user.email}`)
        .then(async (response) => {
          const dbItems = response.data.map(item => {
            // Match backend productId with local product data to get full details
            const productDetail = products.find(p => Number(p.id) === Number(item.productId));
            return {
              ...productDetail,
              id: item.productId,
              quantity: item.quantity,
              dbId: item.id,
            };
          }).filter(Boolean);

          // Merge guest items into backend cart
          const mergedItems = [...dbItems];

          for (const guestItem of guestItems) {
            const existing = mergedItems.find(i => Number(i.id) === Number(guestItem.id));
            if (existing) {
              // Increase quantity but respect stock limit
              const newQty = Math.min(existing.quantity + guestItem.quantity, guestItem.stock || existing.stock);
              existing.quantity = newQty;
            } else {
              mergedItems.push(guestItem);
            }

            // Sync merged guest item to backend
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

          // Clear guest cart from localStorage after merge
          localStorage.removeItem(GUEST_CART_KEY);
          setItems(mergedItems);
        })
        .catch((error) => {
          console.error('Failed to fetch cart from backend:', error);
        });
    } else {
      // User logged out — clear the cart
      setItems([]);
    }
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

    // Sync new item to backend if user is logged in
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
    const itemToRemove = items.find(item => item.id === productId);
    setItems((prev) => prev.filter((item) => item.id !== productId));

    // Remove item from backend using productId and email as query param
    if (user && user.email && itemToRemove?.dbId) {
      try {
        await axios.delete(`http://localhost:8080/api/cart/remove/${productId}?email=${user.email}`);
      } catch (error) {
        console.error('Failed to remove item from backend:', error);
      }
    }
    showToast('Product removed from cart.', 'error');
  }, [items, showToast, user]);

  const updateQuantity = useCallback((productId, quantity) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.id !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, quantity } : item))
    );
  }, []);

  const clearCart = useCallback(async () => {
    setItems([]);
    // Clear all cart items on backend for this user
    if (user && user.email) {
      try {
        await axios.delete(`http://localhost:8080/api/cart/clear/${user.email}`);
      } catch (error) {
        console.error('Failed to clear cart on backend:', error);
      }
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