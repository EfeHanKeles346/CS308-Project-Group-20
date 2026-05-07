import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductsContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  fetchProductComments,
  fetchProductRatingSummary,
  fetchUserProductRating,
  submitProductComment,
  submitProductRating,
} from '../services/api';

function StarIcon({ value }) {
  if (value === 1) return <i className="fas fa-star" />;
  if (value === 0.5) return <i className="fas fa-star-half-alt" />;
  return <i className="far fa-star" />;
}

function formatCommentDate(ms) {
  if (!ms) return '';
  return new Date(ms).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function userInitials(name) {
  return String(name || 'U')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';
}

function ratingLabel(value) {
  return `${value} star${value !== 1 ? 's' : ''}`;
}

function buildRatingStars(rating) {
  const stars = [];
  let remaining = Number(rating) || 0;

  for (let index = 0; index < 5; index += 1) {
    if (remaining >= 1) {
      stars.push(1);
    } else if (remaining >= 0.5) {
      stars.push(0.5);
    } else {
      stars.push(0);
    }
    remaining -= 1;
  }

  return stars;
}

function formatRatingCount(value) {
  const count = Number(value) || 0;
  if (count >= 1000) {
    const rounded = Math.round((count / 1000) * 10) / 10;
    return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded}K`;
  }
  return String(count);
}

function formatRatingValue(value) {
  const rating = Number(value) || 0;
  return Number.isInteger(rating) ? String(rating) : rating.toFixed(1);
}

function isSameProduct(item, productId, routeId) {
  return String(item.productId || item.id) === String(productId) || String(item.id) === String(routeId);
}

function normalizeRatingSummary(summary) {
  return {
    ...summary,
    averageRating: Number(summary?.averageRating || 0),
    ratingCount: Number(summary?.ratingCount || 0),
  };
}

function mergeProductRating(products, productId, routeId, summary) {
  return products.map((item) => {
    if (!isSameProduct(item, productId, routeId)) return item;

    return {
      ...item,
      rating: summary.averageRating,
      reviews: summary.ratingCount,
      reviewsDisplay: formatRatingCount(summary.ratingCount),
      stars: buildRatingStars(summary.averageRating),
    };
  });
}

export default function ProductDetail() {
  const { id } = useParams();
  const { products, loading, error, setProducts } = useProducts();
  const product = products.find((item) => item.id === Number(id));
  const productId = product?.productId || (id ? String(id) : '');
  const { addToCart } = useCart();
  const { user, isLoggedIn } = useAuth();
  const { showToast } = useToast();
  const [added, setAdded] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsStatus, setCommentsStatus] = useState('idle');
  const [commentsError, setCommentsError] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentNotice, setCommentNotice] = useState('');
  const [ratingSummary, setRatingSummary] = useState({ averageRating: 0, ratingCount: 0 });
  const [ratingStatus, setRatingStatus] = useState('idle');
  const [selectedRating, setSelectedRating] = useState(0);
  const [selectedRatingProductId, setSelectedRatingProductId] = useState('');
  const [userRatingState, setUserRatingState] = useState({ productId: '', email: '', rating: 0 });
  const [hoverRating, setHoverRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingNotice, setRatingNotice] = useState('');

  useEffect(() => {
    if (!productId) return undefined;

    let cancelled = false;

    async function loadComments() {
      setCommentsStatus('loading');
      setCommentsError(null);

      const result = await fetchProductComments(productId);
      if (cancelled) return;

      if (!result.success) {
        setComments([]);
        setCommentsError(result.error || 'Comments could not be loaded.');
        setCommentsStatus('error');
        return;
      }

      setComments(result.comments);
      setCommentsStatus('loaded');
    }

    loadComments();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  useEffect(() => {
    if (!productId) return undefined;

    let cancelled = false;

    async function loadRatingSummary() {
      setRatingStatus('loading');
      const result = await fetchProductRatingSummary(productId);
      if (cancelled) return;

      if (result.success) {
        const nextSummary = normalizeRatingSummary(result.summary);
        setRatingSummary(nextSummary);
        setProducts((currentProducts) => mergeProductRating(currentProducts, productId, id, nextSummary));
        setRatingStatus('loaded');
      } else {
        setRatingSummary({ averageRating: 0, ratingCount: 0 });
        setRatingStatus('error');
      }
    }

    loadRatingSummary();

    return () => {
      cancelled = true;
    };
  }, [id, productId, setProducts]);

  useEffect(() => {
    if (!productId || !user?.email) {
      return undefined;
    }

    let cancelled = false;

    async function loadUserRating() {
      const result = await fetchUserProductRating(productId, user.email);
      if (cancelled) return;

      if (result.success && result.rating > 0) {
        setUserRatingState({ productId, email: user.email, rating: result.rating });
        setSelectedRating(result.rating);
        setSelectedRatingProductId(productId);
      } else {
        setUserRatingState({ productId, email: user.email, rating: 0 });
        setSelectedRating(0);
        setSelectedRatingProductId(productId);
      }
    }

    loadUserRating();

    return () => {
      cancelled = true;
    };
  }, [productId, user?.email]);

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

  const handleSubmitComment = async (event) => {
    event.preventDefault();

    if (!isLoggedIn) {
      showToast('Please sign in to comment.', 'error');
      return;
    }

    const text = commentText.trim();
    if (!text) {
      showToast('Comment cannot be empty.', 'error');
      return;
    }

    setSubmittingComment(true);
    setCommentNotice('');
    const result = await submitProductComment({
      productId,
      userEmail: user.email,
      userName: user.name,
      text,
    });
    setSubmittingComment(false);

    if (!result.success) {
      showToast(result.error || 'Comment could not be submitted.', 'error');
      return;
    }

    setCommentText('');
    setCommentNotice('Your comment is pending approval.');
    showToast('Comment submitted for review.', 'success');
  };

  const handleSubmitRating = async (event) => {
    event.preventDefault();

    if (!isLoggedIn) {
      showToast('Please sign in to rate this product.', 'error');
      return;
    }
    const ratingToSubmit = selectedRatingProductId === productId ? selectedRating : 0;
    if (ratingToSubmit < 1 || ratingToSubmit > 5) {
      showToast('Select a rating between 1 and 5.', 'error');
      return;
    }

    setSubmittingRating(true);
    setRatingNotice('');
    const result = await submitProductRating({
      productId,
      userEmail: user.email,
      userName: user.name,
      rating: ratingToSubmit,
    });
    setSubmittingRating(false);

    if (!result.success) {
      showToast(result.error || 'Rating could not be saved.', 'error');
      return;
    }

    const nextSummary = normalizeRatingSummary(result.summary);
    setRatingSummary(nextSummary);
    setUserRatingState({ productId, email: user.email, rating: ratingToSubmit });
    setProducts((currentProducts) => mergeProductRating(currentProducts, productId, id, nextSummary));
    setRatingNotice('Your rating has been saved.');
    showToast('Rating saved.', 'success');
  };

  const savedUserRating = userRatingState.productId === productId && userRatingState.email === user?.email
    ? Number(userRatingState.rating || 0)
    : 0;
  const selectedRatingValue = selectedRatingProductId === productId ? selectedRating : savedUserRating;
  const displayRating = hoverRating || selectedRatingValue;
  const detailRating = savedUserRating > 0 ? savedUserRating : product.rating;
  const detailStars = savedUserRating > 0 ? buildRatingStars(detailRating) : product.stars;
  const panelRating = savedUserRating > 0 ? savedUserRating : Number(ratingSummary.averageRating || 0);
  const hasPanelRating = panelRating > 0;
  const averageRatingText = ratingSummary.ratingCount > 0
    ? `${formatRatingValue(ratingSummary.averageRating)} / 5`
    : 'No verified ratings yet';

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
              <div className="stars" aria-label={`Rating: ${detailRating} out of 5`}>
                {detailStars.map((star, index) => <StarIcon key={index} value={star} />)}
              </div>
              <span>
                {formatRatingValue(detailRating)} ({savedUserRating > 0 ? 'your rating' : `${product.reviewsDisplay} reviews`})
              </span>
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

        <div className="pd-rating-panel">
          <div className="pd-rating-copy">
            <p className="checkout-kicker">{savedUserRating > 0 ? 'Your rating' : 'Verified rating'}</p>
            <h2>
              {hasPanelRating ? `${formatRatingValue(panelRating)} / 5` : 'No verified ratings yet'}
            </h2>
            <span>
              {ratingStatus === 'loading'
                ? 'Loading ratings'
                : savedUserRating > 0
                  ? `Average: ${averageRatingText} from ${ratingSummary.ratingCount || 0} delivered customer rating${ratingSummary.ratingCount === 1 ? '' : 's'}`
                  : `${ratingSummary.ratingCount || 0} delivered customer rating${ratingSummary.ratingCount === 1 ? '' : 's'}`}
            </span>
          </div>

          <form className="pd-rating-form" onSubmit={handleSubmitRating}>
            <div className="pd-rating-stars" role="radiogroup" aria-label="Rate this product">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={value <= displayRating ? 'is-active' : ''}
                  onClick={() => {
                    setSelectedRating(value);
                    setSelectedRatingProductId(productId);
                    if (ratingNotice) setRatingNotice('');
                  }}
                  onMouseEnter={() => setHoverRating(value)}
                  onMouseLeave={() => setHoverRating(0)}
                  aria-label={ratingLabel(value)}
                  aria-checked={selectedRatingValue === value}
                  role="radio"
                >
                  <i className="fas fa-star" />
                </button>
              ))}
            </div>
            <button type="submit" className="btn btn-primary btn-sm" disabled={submittingRating}>
              <i className={`fas ${submittingRating ? 'fa-spinner fa-spin' : 'fa-star'}`} />
              <span>{submittingRating ? 'Saving' : 'Save rating'}</span>
            </button>
            {ratingNotice && <p className="pd-comment-notice">{ratingNotice}</p>}
          </form>
        </div>

        <div className="pd-comments">
          <div className="pd-comments-header">
            <div>
              <p className="checkout-kicker">Customer comments</p>
              <h2>Accepted comments</h2>
            </div>
            <span>{comments.length} visible</span>
          </div>

          <div className="pd-comments-layout">
            <form className="pd-comment-form" onSubmit={handleSubmitComment}>
              <label htmlFor="productComment">Leave a comment</label>
              <textarea
                id="productComment"
                value={commentText}
                onChange={(event) => {
                  setCommentText(event.target.value);
                  if (commentNotice) setCommentNotice('');
                }}
                rows={5}
                maxLength={1000}
                placeholder={isLoggedIn ? 'Share your experience after delivery' : 'Sign in to comment'}
                disabled={submittingComment}
              />
              <div className="pd-comment-form-footer">
                <span>{commentText.length}/1000</span>
                <button type="submit" className="btn btn-primary btn-sm" disabled={submittingComment}>
                  <i className={`fas ${submittingComment ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`} />
                  <span>{submittingComment ? 'Submitting' : 'Submit'}</span>
                </button>
              </div>
              {commentNotice && <p className="pd-comment-notice">{commentNotice}</p>}
            </form>

            <div className="pd-comment-list">
              {commentsStatus === 'loading' && (
                <div className="pd-comment-empty">
                  <i className="fas fa-spinner fa-spin" />
                  <span>Loading comments</span>
                </div>
              )}
              {commentsStatus === 'error' && (
                <div className="pd-comment-empty">
                  <i className="fas fa-triangle-exclamation" />
                  <span>{commentsError}</span>
                </div>
              )}
              {commentsStatus === 'loaded' && comments.length === 0 && (
                <div className="pd-comment-empty">
                  <i className="far fa-comment" />
                  <span>No accepted comments yet</span>
                </div>
              )}
              {commentsStatus === 'loaded' && comments.map((comment) => (
                <article className="pd-comment" key={comment.commentId}>
                  <div className="pd-comment-avatar">{userInitials(comment.userName)}</div>
                  <div>
                    <div className="pd-comment-meta">
                      <strong>{comment.userName || 'Customer'}</strong>
                      <span>{formatCommentDate(comment.createdAt)}</span>
                    </div>
                    <p>{comment.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
