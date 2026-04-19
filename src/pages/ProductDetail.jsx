import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductsContext';

function StarIcon({ value }) {
  if (value === 1) return <i className="fas fa-star" />;
  if (value === 0.5) return <i className="fas fa-star-half-alt" />;
  return <i className="far fa-star" />;
}

export default function ProductDetail() {
  const { id } = useParams();
  const { products, loading, error } = useProducts();
  const product = products.find((item) => item.id === Number(id));
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  if (loading) {
    return (
      <section className="product-detail-page section">
        <div className="container">
          <div className="empty-state">
            <i className="fas fa-spinner" />
            <h3>Product is loading</h3>
            <p>Firestore product data is being fetched.</p>
          </div>
        </div>
      </section>
    );
  }

  if (error || !product) {
    return (
      <section className="product-detail-page section">
        <div className="container">
          <div className="empty-state">
            <i className="fas fa-exclamation-triangle" />
            <h3>Product not found</h3>
            <p>{error || "The product you're looking for doesn't exist or has been removed."}</p>
            <Link to="/" className="btn btn-primary" style={{ marginTop: '20px', display: 'inline-flex' }}>
              <i className="fas fa-arrow-left" /> <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const handleAdd = () => {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <section className="product-detail-page section">
      <div className="container">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <i className="fas fa-chevron-right" />
          <span>{product.category}</span>
          <i className="fas fa-chevron-right" />
          <span aria-current="page">{product.name}</span>
        </nav>

        <div className="pd-layout">
          <div className="pd-image-col">
            <div className="pd-image">
              {product.badge && (
                <div className={`product-badge badge-${product.badgeType}`}>{product.badge}</div>
              )}
              <img src={product.img} alt={product.name} />
            </div>
          </div>

          <div className="pd-info-col">
            <span className="product-brand">{product.brand}</span>
            <h1 className="pd-title">{product.name}</h1>

            <div className="product-rating" style={{ marginBottom: '16px' }}>
              <div className="stars" aria-label={`Rating: ${product.rating} out of 5`}>
                {product.stars.map((star, index) => <StarIcon key={index} value={star} />)}
              </div>
              <span>{product.rating} ({product.reviewsDisplay} reviews)</span>
            </div>

            <p className="pd-description">{product.description}</p>

            <div className="product-price" style={{ marginBottom: '20px', marginTop: '20px' }}>
              {product.oldPriceDisplay && <span className="price-old">{product.oldPriceDisplay}</span>}
              <span className="price-current" style={{ fontSize: '28px' }}>{product.priceDisplay}</span>
            </div>

            {product.stock <= 5 && product.stock > 0 && (
              <span className="stock-warning" style={{ marginBottom: '16px' }}>
                <i className="fas fa-exclamation-circle" /> Only {product.stock} left in stock
              </span>
            )}
            {product.stock > 5 && (
              <span className="stock-ok" style={{ marginBottom: '16px' }}>
                <i className="fas fa-check-circle" /> In Stock
              </span>
            )}

            <div className="pd-actions">
              <button
                className="btn btn-primary btn-full"
                onClick={handleAdd}
                disabled={product.stock === 0}
                style={added ? { background: 'var(--green)', borderColor: 'transparent' } : undefined}
              >
                {product.stock === 0 ? (
                  <><i className="fas fa-ban" /> <span>Out of Stock</span></>
                ) : added ? (
                  <><i className="fas fa-check" /> <span>Added to Cart!</span></>
                ) : (
                  <><i className="fas fa-shopping-bag" /> <span>Add to Cart</span></>
                )}
              </button>
            </div>

            <div className="pd-features">
              <div className="pd-feature"><i className="fas fa-truck-fast" /><span>Free shipping</span></div>
              <div className="pd-feature"><i className="fas fa-rotate-left" /><span>14-day returns</span></div>
              <div className="pd-feature"><i className="fas fa-shield-halved" /><span>Secure payment</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
