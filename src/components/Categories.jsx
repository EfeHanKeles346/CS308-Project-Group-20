import { useRef, useEffect } from 'react';
import useReveal from '../hooks/useReveal';
import { useCategories } from '../context/CategoriesContext';
import { iconForCategory } from '../data/categories';

const LEFT_SCROLL = 420;

export default function Categories({ selectedCategory, onCategorySelect }) {
  const { categories } = useCategories();
  const headerRef = useReveal();
  const revealRef = useReveal();
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollLeft = LEFT_SCROLL;
  }, []);

  const scrollTrack = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  return (
    <section className="categories section">
      <div className="container">
        <div className="section-header reveal" ref={headerRef}>
          <div>
            <h2 className="section-title">Categories</h2>
            <p className="section-sub">Everything you need, just a click away</p>
          </div>
          <div className="category-nav-btns">
            <button className="cat-nav-btn" onClick={() => scrollTrack(-1)} aria-label="Scroll left">
              <i className="fas fa-chevron-left" />
            </button>
            <button className="cat-nav-btn" onClick={() => scrollTrack(1)} aria-label="Scroll right">
              <i className="fas fa-chevron-right" />
            </button>
          </div>
        </div>
      </div>
      <div className="category-scroll-wrapper reveal" ref={revealRef}>
        <div className="category-scroll" ref={scrollRef}>
          <div className="category-track">
            <div className="category-spacer" />
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`category-card${selectedCategory === cat.id ? ' active' : ''}`}
                onClick={() => onCategorySelect(cat.id)}
                aria-pressed={selectedCategory === cat.id}
              >
                <div className="category-icon"><i className={`fas ${iconForCategory(cat.id, cat.icon)}`} /></div>
                <span>{cat.name}</span>
                <small>{cat.count} product{cat.count !== 1 ? 's' : ''}</small>
              </button>
            ))}
          </div>
        </div>
        <div className="category-fade-left" />
        <div className="category-fade-right" />
      </div>
    </section>
  );
}
