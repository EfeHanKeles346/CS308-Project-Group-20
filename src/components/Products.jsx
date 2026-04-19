import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useReveal from '../hooks/useReveal';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useWishlist } from '../context/WishlistContext';
import { useProducts } from '../context/ProductsContext';

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

export default function Products({ searchQuery = '', selectedCategory = null, onCategorySelect }) {
  const [activeTab, setActiveTab] = useState('All');
  const [wishlisted, setWishlisted] = useState({});
  const [sortBy, setSortBy] = useState('default');
  const [addedMap, setAddedMap] = useState({});
  const { showToast } = useToast();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist } = useWishlist();
  const { products, loading, error } = useProducts();
  const headerRef = useReveal();

  const visibleTab = selectedCategory === 'deals' ? 'On Sale' : activeTab;

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (selectedCategory === 'deals') {
      result = result.filter((product) => product.tags.includes('sale'));
    } else if (selectedCategory) {
      result = result.filter((product) => product.category === selectedCategory);
    }

    if (visibleTab === 'Best Sellers') {
      result = result.filter((product) => product.tags.includes('best-seller'));
    } else if (visibleTab === 'New') {
      result = result.filter((product) => product.tags.includes('new'));
    } else if (visibleTab === 'On Sale') {
      result = result.filter((product) => product.tags.includes('sale'));
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((product) =>
        product.name.toLowerCase().includes(query)
        || product.brand.toLowerCase().includes(query)
        || product.description.toLowerCase().includes(query)
        || product.category.toLowerCase().includes(query)
      );
    }

    if (sortBy === 'price-asc') {
      result.sort((first, second) => first.price - second.price);
    } else if (sortBy === 'price-desc') {
      result.sort((first, second) => second.price - first.price);
    } else if (sortBy === 'rating') {
      result.sort((first, second) => second.reviews - first.reviews);
    } else if (sortBy === 'name') {
      result.sort((first, second) => first.name.localeCompare(second.name));
    }

    return result;
  }, [products, searchQuery, selectedCategory, sortBy, visibleTab]);

  const toggleWishlist = (product) => {
    const next = !wishlisted[product.id];
    setWishlisted((prev) => ({ ...prev, [product.id]: next }));
    if (next) addToWishlist(product);
    else removeFromWishlist(product.id);
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
                  className={`tab-btn${visibleTab === tab ? ' active' : ''}`}
                  onClick={() => {
                    setActiveTab(tab);
                    if (selectedCategory === 'deals' && tab !== 'On Sale') onCategorySelect('deals');
                  }}
                  role="tab"
                  aria-selected={visibleTab === tab}
                >
                  {tab}
                </button>
              ))}
            </div>
            <select
              className="sort-select"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              aria-label="Sort products"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        {error ? (
          <div className="empty-state" role="status">
            <i className="fas fa-database" />
            <h3>Products could not be loaded</h3>
            <p>{error}</p>
          </div>
        ) : !loading && filteredProducts.length === 0 ? (
          <div className="empty-state" role="status">
            <i className="fas fa-search" />
            <h3>No products found</h3>
            <p>Try adjusting your search or filter to find what you're looking for.</p>
          </div>
        ) : !loading ? (
          <div className="product-grid" role="list" aria-label="Products">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isWishlisted={!!wishlisted[product.id]}
                isAdded={!!addedMap[product.id]}
                onToggleWishlist={() => toggleWishlist(product)}
                onAddToCart={() => handleAddToCart(product)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ProductCard({ product, isWishlisted, isAdded, onToggleWishlist, onAddToCart }) {
  const ref = useReveal();

  return (
    <article className="product-card reveal" ref={ref} role="listitem">
      {product.badge && (
        <div className={`product-badge badge-${product.badgeType}`}>{product.badge}</div>
      )}
      <button
        className={`wishlist-btn${isWishlisted ? ' active' : ''}`}
        onClick={onToggleWishlist}
        aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
      >
        <i className={`${isWishlisted ? 'fas' : 'far'} fa-heart`} />
      </button>
      <Link to={`/product/${product.id}`} className="product-image-link">
        <div className="product-image">
          <img src={product.img} alt={product.name} loading="lazy" />
        </div>
      </Link>
      <div className="product-info">
        <span className="product-brand">{product.brand}</span>
        <h3 className="product-name">
          <Link to={`/product/${product.id}`} className="product-name-link">{product.name}</Link>
        </h3>
        <div className="product-rating">
          <div className="stars" aria-label={`Rating: ${product.rating} out of 5`}>
            {product.stars.map((star, index) => <StarIcon key={index} value={star} />)}
          </div>
          <span>{product.rating} ({product.reviewsDisplay})</span>
        </div>
        <div className="product-price">
          {product.oldPriceDisplay && <span className="price-old">{product.oldPriceDisplay}</span>}
          <span className="price-current">{product.priceDisplay}</span>
        </div>
        {product.stock <= 5 && product.stock > 0 && (
          <span className="stock-warning">
            <i className="fas fa-exclamation-circle" /> Only {product.stock} left in stock
          </span>
        )}
        <button
          className="add-to-cart"
          onClick={onAddToCart}
          disabled={product.stock === 0}
          aria-label={`Add ${product.name} to cart`}
          style={isAdded ? {
            background: 'var(--gradient-primary)',
            borderColor: 'transparent',
            color: 'white',
            boxShadow: 'var(--shadow-glow)',
          } : undefined}
        >
          {product.stock === 0 ? (
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
