import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { addToWishlistAPI, fetchWishlist, removeFromWishlistAPI } from '../services/api';
import { normalizeProducts, normalizeProduct } from '../utils/productUtils';

const WishlistContext = createContext();

export function WishlistProvider({ children, user }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadWishlist() {
      if (!user?.email) {
        setItems([]);
        return;
      }

      setLoading(true);
      const result = await fetchWishlist(user.email);
      if (!cancelled) {
        setItems(result.success ? normalizeProducts(result.items) : []);
        setLoading(false);
      }
    }

    loadWishlist();

    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  const addToWishlist = useCallback(async (product) => {
    if (!user?.email) {
      return { success: false, error: 'Please sign in to add items to your wishlist.' };
    }

    const normalizedProduct = normalizeProduct(product);
    if (!normalizedProduct) {
      return { success: false, error: 'Product could not be added to wishlist.' };
    }

    setItems((prev) => {
      if (prev.find((p) => p.id === normalizedProduct.id)) return prev;
      return [...prev, normalizedProduct];
    });

    const result = await addToWishlistAPI(user.email, normalizedProduct.id);
    if (!result.success) {
      setItems((prev) => prev.filter((p) => p.id !== normalizedProduct.id));
    }

    return result;
  }, [user?.email]);

  const removeFromWishlist = useCallback(async (productId) => {
    if (!user?.email) {
      return { success: false, error: 'Please sign in to update your wishlist.' };
    }

    const removedItem = items.find((p) => p.id === productId);
    setItems((prev) => prev.filter((p) => p.id !== productId));

    const result = await removeFromWishlistAPI(user.email, productId);
    if (!result.success && removedItem) {
      setItems((prev) => {
        if (prev.find((p) => p.id === removedItem.id)) return prev;
        return [...prev, removedItem];
      });
    }

    return result;
  }, [items, user?.email]);

  const isWishlisted = useCallback((productId) => items.some((p) => p.id === productId), [items]);

  return (
    <WishlistContext.Provider value={{ items, loading, addToWishlist, removeFromWishlist, isWishlisted, wishlistCount: items.length }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
