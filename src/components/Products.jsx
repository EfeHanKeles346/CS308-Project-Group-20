import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import useReveal from '../hooks/useReveal';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import allProducts from '../data/products';

const tabs = ['All', 'Best Sellers', 'New', 'On Sale'];
const sortOptions = [
  { value: 'default', label: 'Default' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Most Popular' },
  { value: 'name', label: 'Name: A-Z' },
];

function StarIcon({ value }) {
  if (value === 1) return <i className="fas fa-star" />;
  if (value === 0.5) return <i className="fas fa-star-half-alt" />;
  return <i className="far fa-star" />;
}

export default function Products({ searchQuery = '', selectedCategory = null }) {
  const [activeTab, setActiveTab] = useState('All');
  const [sortBy, setSortBy] = useState('default');
  const [wishlisted, setWishlisted] = useState({});
  const [addedMap, setAddedMap] = useState({});
  const { showToast } = useToast();
  const { addToCart } = useCart();
  const headerRef = useReveal();

  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    // Category filter
    if (selectedCategory === 'deals') {
      result = result.filter((p) => p.tags.includes('sale'));
    } else if (selectedCategory) {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // Tab filter
    if (activeTab === 'Best Sellers') {
      result = result.filter((p) => p.tags.includes('best-seller'));
    } else if (activeTab === 'New') {
      result = result.filter((p) => p.tags.includes('new'));
    } else if (activeTab === 'On Sale') {
      result = result.filter((p) => p.tags.includes('sale'));
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.reviews - a.reviews);
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [activeTab, searchQuery, sortBy, selectedCategory]);

  const toggleWishlist = (productId) => {
    const next = !wishlisted[productId];
    setWishlisted((prev) => ({ ...prev, [productId]: next }));
    showToast(
      next ? 'Added to wishlist!' : 'Removed from wishlist.',
      next ? 'success' : 'error'
    );
  };

  const handleAddToCart = (product) => {
    addToCart(product);
    setAddedMap((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => setAddedMap((prev) => ({ ...prev, [product.id]: false })), 1200);
  };

  return (
    <section className="products section" id="products">
      <div className="container">
        <div className="section-header reveal" ref={headerRef}>
          <div>
            <h2 className="section-title">
              {searchQuery ? `Results for "${searchQuery}"` : 'Featured Products'}
            </h2>
            <p className="section-sub">
              {searchQuery
                ? `${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''} found`
                : 'Most popular and best-selling products'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div className="product-tabs" role="tablist" aria-label="Product filters">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  className={`tab-btn${activeTab === tab || (tab === 'On Sale' && selectedCategory === 'deals') ? ' active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                  role="tab"
                  aria-selected={activeTab === tab || (tab === 'On Sale' && selectedCategory === 'deals')}
                >
                  {tab}
                </button>
              ))}
            </div>
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort products"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="empty-state" role="status">
            <i className="fas fa-search" />
            <h3>No products found</h3>
            <p>Try adjusting your search or filter to find what you're looking for.</p>
          </div>
        ) : (
          <div className="product-grid" role="list" aria-label="Products">
            {filteredProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                isWishlisted={!!wishlisted[p.id]}
                isAdded={!!addedMap[p.id]}
                onToggleWishlist={() => toggleWishlist(p.id)}
                onAddToCart={() => handleAddToCart(p)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ProductCard({ product: p, isWishlisted, isAdded, onToggleWishlist, onAddToCart }) {
  const ref = useReveal();

  return (
    <article className="product-card reveal" ref={ref} role="listitem">
      {p.badge && (
        <div className={`product-badge badge-${p.badgeType}`}>{p.badge}</div>
      )}
      <button
        className={`wishlist-btn${isWishlisted ? ' active' : ''}`}
        onClick={onToggleWishlist}
        aria-label={isWishlisted ? `Remove ${p.name} from wishlist` : `Add ${p.name} to wishlist`}
      >
        <i className={`${isWishlisted ? 'fas' : 'far'} fa-heart`} />
      </button>
      <Link to={`/product/${p.id}`} className="product-image-link">
        <div className="product-image">
          <img src={p.img} alt={p.name} loading="lazy" />
        </div>
      </Link>
      <div className="product-info">
        <span className="product-brand">{p.brand}</span>
        <h3 className="product-name">
          <Link to={`/product/${p.id}`} className="product-name-link">{p.name}</Link>
        </h3>
        <div className="product-rating">
          <div className="stars" aria-label={`Rating: ${p.rating} out of 5`}>
            {p.stars.map((s, i) => <StarIcon key={i} value={s} />)}
          </div>
          <span>{p.rating} ({p.reviewsDisplay})</span>
        </div>
        <div className="product-price">
          {p.oldPriceDisplay && <span className="price-old">{p.oldPriceDisplay}</span>}
          <span className="price-current">{p.priceDisplay}</span>
        </div>
        {p.stock <= 5 && p.stock > 0 && (
          <span className="stock-warning">
            <i className="fas fa-exclamation-circle" /> Only {p.stock} left in stock
          </span>
        )}
        <button
          className="add-to-cart"
          onClick={onAddToCart}
          disabled={p.stock === 0}
          aria-label={`Add ${p.name} to cart`}
          style={isAdded ? {
            background: 'var(--gradient-primary)',
            borderColor: 'transparent',
            color: 'white',
            boxShadow: 'var(--shadow-glow)',
          } : undefined}
        >
          {p.stock === 0 ? (
            <><i className="fas fa-ban" /> Out of Stock</>
          ) : isAdded ? (
            <><i className="fas fa-check" /> Added!</>
          ) : (
            <><i className="fas fa-shopping-bag" /> Add to Cart</>
          )}
        </button>
      </div>
    </article>
  );
}
