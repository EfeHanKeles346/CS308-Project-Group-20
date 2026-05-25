/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchProducts } from '../services/api';
import { normalizeProducts } from '../utils/productUtils';

const ProductsContext = createContext(null);

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const result = await fetchProducts();

    if (result.success) {
      setProducts(normalizeProducts(result.products));
      setError('');
    } else {
      setProducts([]);
      setError(result.error || 'Products could not be loaded.');
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Re-fetch when the user returns to the tab, so products added/priced in the
  // manager panels (possibly in another tab) show up without a full reload.
  useEffect(() => {
    const handleFocus = () => loadProducts();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadProducts]);

  const value = useMemo(() => ({
    products,
    loading,
    error,
    setProducts,
    refetch: loadProducts,
  }), [products, loading, error, loadProducts]);

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

export function useProducts() {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error('useProducts must be used within ProductsProvider');
  }
  return context;
}
