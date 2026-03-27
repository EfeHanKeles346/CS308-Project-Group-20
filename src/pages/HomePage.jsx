import Hero from '../components/Hero';
import Features from '../components/Features';
import Categories from '../components/Categories';
import Products from '../components/Products';
import Banners from '../components/Banners';
import Newsletter from '../components/Newsletter';

export default function HomePage({ searchQuery, selectedCategory, onCategorySelect }) {
  return (
    <>
      <Hero onCategorySelect={onCategorySelect} />
      <Features />
      <Categories selectedCategory={selectedCategory} onCategorySelect={onCategorySelect} />
      <Products searchQuery={searchQuery} selectedCategory={selectedCategory} />
      <Banners onCategorySelect={onCategorySelect} />
      <Newsletter />
    </>
  );
}
