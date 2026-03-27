import useReveal from '../hooks/useReveal';
import categories from '../data/categories';

export default function Categories({ selectedCategory, onCategorySelect }) {
  const headerRef = useReveal();
  const scrollRef = useReveal();

  return (
    <section className="categories section">
      <div className="container">
        <div className="section-header reveal" ref={headerRef}>
          <div>
            <h2 className="section-title">Categories</h2>
            <p className="section-sub">Everything you need, just a click away</p>
          </div>
        </div>
      </div>
      <div className="category-scroll reveal" ref={scrollRef}>
        <div className="category-track">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`category-card${selectedCategory === cat.id ? ' active' : ''}`}
              onClick={() => onCategorySelect(cat.id)}
              aria-pressed={selectedCategory === cat.id}
            >
              <div className="category-icon"><i className={`fas ${cat.icon}`} /></div>
              <span>{cat.name}</span>
              <small>{cat.count} products</small>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
