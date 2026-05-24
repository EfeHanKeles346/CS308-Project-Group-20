/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchCategories } from '../services/api';

const CategoriesContext = createContext(null);

export function CategoriesProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCategories = useCallback(async () => {
    setLoading(true);
    const result = await fetchCategories();

    if (result.success) {
      setCategories(result.categories);
      setError('');
    } else {
      setCategories([]);
      setError(result.error || 'Categories could not be loaded.');
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Re-fetch when the user returns to the tab so PM category changes propagate.
  useEffect(() => {
    const handleFocus = () => loadCategories();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadCategories]);

  const value = useMemo(() => ({
    categories,
    loading,
    error,
    refetch: loadCategories,
  }), [categories, loading, error, loadCategories]);

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
}

export function useCategories() {
  const context = useContext(CategoriesContext);
  if (!context) {
    throw new Error('useCategories must be used within CategoriesProvider');
  }
  return context;
}
