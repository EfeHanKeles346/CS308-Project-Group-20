import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function CartPage({ onOpenModal }) {
  const { items, cartCount, cartTotal, removeFromCart, updateQuantity, clearCart } = useCart();
  const { isLoggedIn } = useAuth();

  const handleCheckoutClick = () => {
    if (!isLoggedIn) {
      onOpenModal?.('login');
    }
  };

  if (items.length === 0) {
    return (
      <section className="cart-page section">
        <div className="container">
          <div className="empty-state">
            <i className="fas fa-shopping-bag" />
            <h3>Your cart is empty</h3>
            <p>Looks like you haven't added any products yet.</p>
            <Link to="/" className="btn btn-primary" style={{ marginTop: '20px', display: 'inline-flex' }}>
              <i className="fas fa-arrow-left" /> <span>Continue Shopping</span>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="cart-page section">
      <div className="container">
        <div className="cart-header">
          <h2 className="section-title">Shopping Cart</h2>
          <p className="section-sub">{cartCount} item{cartCount !== 1 ? 's' : ''} in your cart</p>
        </div>

        <div className="cart-layout">
          <div className="cart-items">
            {items.map((item) => (
              <div className="cart-item" key={item.id}>
                <div className="cart-item-image">
                  <img src={item.img} alt={item.name} loading="lazy" />
                </div>
                <div className="cart-item-details">
                  <span className="product-brand">{item.brand}</span>
                  <h3 className="product-name">{item.name}</h3>
                  <span className="price-current">{item.priceDisplay}</span>
                </div>
                <div className="cart-item-actions">
                  <div className="quantity-control">
                    <button
                      className="qty-btn"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      aria-label="Decrease quantity"
                    >
                      <i className="fas fa-minus" />
                    </button>
                    <span className="qty-value" aria-label={`Quantity: ${item.quantity}`}>{item.quantity}</span>
                    <button
                      className="qty-btn"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      aria-label="Increase quantity"
                    >
                      <i className="fas fa-plus" />
                    </button>
                  </div>
                  <span className="cart-item-total">${(item.price * item.quantity).toLocaleString()}</span>
                  <button
                    className="cart-remove-btn"
                    onClick={() => removeFromCart(item.id)}
                    aria-label={`Remove ${item.name} from cart`}
                  >
                    <i className="fas fa-trash-alt" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h3>Order Summary</h3>
            <div className="summary-row">
              <span>Subtotal ({cartCount} items)</span>
              <span>${cartTotal.toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span className="summary-free">Free</span>
            </div>
            <div className="summary-divider" />
            <div className="summary-row summary-total">
              <span>Total</span>
              <span>${cartTotal.toLocaleString()}</span>
            </div>
            {isLoggedIn ? (
              <Link to="/checkout" className="btn btn-primary btn-full" style={{ marginTop: '16px' }}>
                <span>Proceed to Checkout</span>
                <i className="fas fa-arrow-right" />
              </Link>
            ) : (
              <button
                type="button"
                className="btn btn-primary btn-full"
                style={{ marginTop: '16px' }}
                onClick={handleCheckoutClick}
              >
                <span>Proceed to Checkout</span>
                <i className="fas fa-arrow-right" />
              </button>
            )}
            <button className="cart-clear-btn" onClick={clearCart}>
              <i className="fas fa-trash" /> Clear Cart
            </button>
            <Link to="/" className="cart-continue-link">
              <i className="fas fa-arrow-left" /> Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
