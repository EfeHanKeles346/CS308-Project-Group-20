/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fetchProducts } from '../services/api';
import { normalizeProducts } from '../utils/productUtils';

const ProductsContext = createContext(null);

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    async function loadProducts() {
      setLoading(true);
      const result = await fetchProducts();

      if (ignore) return;

      if (result.success) {
        setProducts(normalizeProducts(result.products));
        setError('');
      } else {
        setProducts([]);
        setError(result.error || 'Products could not be loaded.');
      }

      setLoading(false);
    }

    loadProducts();
    return () => {
      ignore = true;
    };
  }, []);

  const value = useMemo(() => ({
    products,
    loading,
    error,
    setProducts,
  }), [error, loading, products]);

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

export function useProducts() {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error('useProducts must be used within ProductsProvider');
  }
  return context;
}
