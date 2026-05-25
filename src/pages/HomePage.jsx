import { useEffect } from 'react';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Categories from '../components/Categories';
import Products from '../components/Products';
import Banners from '../components/Banners';
import Newsletter from '../components/Newsletter';
import { useProducts } from '../context/ProductsContext';
import { useCategories } from '../context/CategoriesContext';

export default function HomePage({ searchQuery, selectedCategory, onCategorySelect }) {
  const { refetch: refetchProducts } = useProducts();
  const { refetch: refetchCategories } = useCategories();

  // Refresh storefront data whenever the home page is (re)visited, so changes
  // made in the manager panels appear without a manual full-page reload.
  useEffect(() => {
    refetchProducts();
    refetchCategories();
  }, [refetchProducts, refetchCategories]);

  return (
    <>
      <Hero onCategorySelect={onCategorySelect} />
      <Features />
      <Categories selectedCategory={selectedCategory} onCategorySelect={onCategorySelect} />
      <Products searchQuery={searchQuery} selectedCategory={selectedCategory} onCategorySelect={onCategorySelect} />
      <Banners onCategorySelect={onCategorySelect} />
      <Newsletter />
    </>
  );
}
