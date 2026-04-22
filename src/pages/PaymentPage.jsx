import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getSavedAddress, saveAddress } from '../utils/profileStorage';
import { createOrder } from '../services/api';
import {
  formatCardNumber,
  formatExpiry,
  normalizeCardNumber,
  normalizeCvv,
  validateAddress,
  validateCard,
} from '../utils/paymentValidation';

const initialCardState = {
  cardholderName: '',
  cardNumber: '',
  expiry: '',
  cvv: '',
};

export default function PaymentPage() {
  const navigate = useNavigate();
  const { items, cartCount, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [address, setAddress] = useState(() => getSavedAddress(user));
  const [card, setCard] = useState(initialCardState);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [orderComplete, setOrderComplete] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setAddress(getSavedAddress(user));
  }, [user]);

  const handleAddressChange = (event) => {
    const { name, value } = event.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleCardChange = (event) => {
    const { name, value } = event.target;

    setCard((prev) => {
      if (name === 'cardNumber') {
        return { ...prev, cardNumber: formatCardNumber(value) };
      }
      if (name === 'expiry') {
        return { ...prev, expiry: formatExpiry(value) };
      }
      if (name === 'cvv') {
        return { ...prev, cvv: normalizeCvv(value) };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const currentErrors = {
    ...validateAddress(address),
    ...validateCard(card),
  };

  const visibleErrors = Object.fromEntries(
    Object.entries(currentErrors).filter(([key]) => touched[key] || errors[key])
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {
      ...validateAddress(address),
      ...validateCard(card),
    };

    setErrors(nextErrors);
    setTouched({
      fullName: true,
      phone: true,
      line1: true,
      line2: true,
      city: true,
      postalCode: true,
      country: true,
      cardholderName: true,
      cardNumber: true,
      expiry: true,
      cvv: true,
    });

    if (Object.keys(nextErrors).length > 0) {
      showToast('Please review your payment details.', 'error');
      return;
    }

    if (!user?.email) {
      showToast('Please log in before placing an order.', 'error');
      return;
    }

    const savedAddress = saveAddress(user, address);
    const cardDigits = normalizeCardNumber(card.cardNumber);

    const orderPayload = {
      userEmail: user.email,
      fullName: savedAddress.fullName,
      deliveryAddress: {
        label: savedAddress.label || 'Home',
        fullName: savedAddress.fullName,
        phone: savedAddress.phone,
        line1: savedAddress.line1,
        line2: savedAddress.line2 || '',
        city: savedAddress.city,
        state: savedAddress.state || '',
        postalCode: savedAddress.postalCode,
        country: savedAddress.country,
      },
      items: items.map((item) => ({
        productId: String(item.id),
        productName: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
      })),
    };

    setSubmitting(true);
    const result = await createOrder(orderPayload);
    setSubmitting(false);

    if (!result.success) {
      showToast(result.error || 'Could not place your order.', 'error');
      return;
    }

    setOrderComplete({
      orderId: result.order.orderId,
      address: savedAddress,
      items,
      total: result.order.totalPrice ?? cartTotal,
      last4: cardDigits.slice(-4),
    });

    await clearCart();
    setCard(initialCardState);
    setErrors({});
    setTouched({});
    showToast('Payment approved. Your order is confirmed!', 'success');
  };

  if (orderComplete) {
    return (
      <section className="checkout-page section">
        <div className="container">
          <div className="checkout-success">
            <div className="checkout-success-icon">
              <i className="fas fa-circle-check" />
            </div>
            <p className="checkout-kicker">Payment Complete</p>
            <h1 className="section-title">Your order is confirmed</h1>
            <p className="section-sub">
              Mock payment ending in {orderComplete.last4} was accepted for ${orderComplete.total.toLocaleString()}.
            </p>

            <div className="checkout-success-meta">
              <div>
                <span className="checkout-success-label">Delivering to</span>
                <strong>{orderComplete.address.fullName}</strong>
                <span>{orderComplete.address.line1}</span>
                <span>
                  {orderComplete.address.city}, {orderComplete.address.postalCode}, {orderComplete.address.country}
                </span>
              </div>
              <div>
                <span className="checkout-success-label">Items</span>
                <strong>{orderComplete.items.length} product{orderComplete.items.length !== 1 ? 's' : ''}</strong>
              </div>
            </div>

            <div className="checkout-success-actions">
              <button className="btn btn-primary" onClick={() => navigate('/')}>
                <i className="fas fa-house" />
                <span>Back to Home</span>
              </button>
              <Link to="/account" className="btn btn-outline">
                <i className="fas fa-user" />
                <span>Manage Address</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="checkout-page section">
        <div className="container">
          <div className="empty-state">
            <i className="fas fa-credit-card" />
            <h3>Your checkout is empty</h3>
            <p>Add products to your cart before continuing to payment.</p>
            <Link to="/cart" className="btn btn-primary" style={{ marginTop: '20px', display: 'inline-flex' }}>
              <i className="fas fa-arrow-left" />
              <span>Return to Cart</span>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const cardPreviewNumber = card.cardNumber || '0000 0000 0000 0000';
  const cardPreviewName = card.cardholderName || address.fullName || user?.name || 'Cardholder Name';
  const cardPreviewExpiry = card.expiry || 'MM/YY';

  return (
    <section className="checkout-page section">
      <div className="container">
        <div className="cart-header checkout-header">
          <div>
            <p className="checkout-kicker">Secure Checkout</p>
            <h1 className="section-title">Review and pay</h1>
            <p className="section-sub">Complete your order with shipping details and mock card validation.</p>
          </div>
          <Link to="/cart" className="cart-continue-link checkout-back-link">
            <i className="fas fa-arrow-left" />
            Edit Cart
          </Link>
        </div>

        <form className="checkout-grid" onSubmit={handleSubmit} noValidate>
          <div className="checkout-stack">
            <section className="checkout-panel">
              <div className="checkout-panel-header">
                <div>
                  <p className="checkout-kicker">Form 1</p>
                  <h2>Shipping Address</h2>
                </div>
                {user && <span className="checkout-pill">Saved to your account</span>}
              </div>

              <div className="checkout-form-grid">
                <label className="field-group">
                  <span className="field-label">Full Name</span>
                  <input
                    className={`field-input${visibleErrors.fullName ? ' invalid' : ''}`}
                    name="fullName"
                    value={address.fullName}
                    onChange={handleAddressChange}
                    onBlur={handleBlur}
                    placeholder="Jane Doe"
                  />
                  {visibleErrors.fullName && <span className="field-error">{visibleErrors.fullName}</span>}
                </label>

                <label className="field-group">
                  <span className="field-label">Phone</span>
                  <input
                    className={`field-input${visibleErrors.phone ? ' invalid' : ''}`}
                    name="phone"
                    value={address.phone}
                    onChange={handleAddressChange}
                    onBlur={handleBlur}
                    placeholder="+90 555 555 55 55"
                  />
                  {visibleErrors.phone && <span className="field-error">{visibleErrors.phone}</span>}
                </label>

                <label className="field-group field-group-full">
                  <span className="field-label">Address Line 1</span>
                  <input
                    className={`field-input${visibleErrors.line1 ? ' invalid' : ''}`}
                    name="line1"
                    value={address.line1}
                    onChange={handleAddressChange}
                    onBlur={handleBlur}
                    placeholder="Street, building, apartment"
                  />
                  {visibleErrors.line1 && <span className="field-error">{visibleErrors.line1}</span>}
                </label>

                <label className="field-group field-group-full">
                  <span className="field-label">Address Line 2</span>
                  <input
                    className="field-input"
                    name="line2"
                    value={address.line2}
                    onChange={handleAddressChange}
                    onBlur={handleBlur}
                    placeholder="District, floor, delivery note"
                  />
                </label>

                <label className="field-group">
                  <span className="field-label">City</span>
                  <input
                    className={`field-input${visibleErrors.city ? ' invalid' : ''}`}
                    name="city"
                    value={address.city}
                    onChange={handleAddressChange}
                    onBlur={handleBlur}
                    placeholder="Istanbul"
                  />
                  {visibleErrors.city && <span className="field-error">{visibleErrors.city}</span>}
                </label>

                <label className="field-group">
                  <span className="field-label">Postal Code</span>
                  <input
                    className={`field-input${visibleErrors.postalCode ? ' invalid' : ''}`}
                    name="postalCode"
                    value={address.postalCode}
                    onChange={handleAddressChange}
                    onBlur={handleBlur}
                    placeholder="34000"
                  />
                  {visibleErrors.postalCode && <span className="field-error">{visibleErrors.postalCode}</span>}
                </label>

                <label className="field-group field-group-full">
                  <span className="field-label">Country</span>
                  <input
                    className={`field-input${visibleErrors.country ? ' invalid' : ''}`}
                    name="country"
                    value={address.country}
                    onChange={handleAddressChange}
                    onBlur={handleBlur}
                    placeholder="Turkey"
                  />
                  {visibleErrors.country && <span className="field-error">{visibleErrors.country}</span>}
                </label>
              </div>
            </section>

            <section className="checkout-panel">
              <div className="checkout-panel-header">
                <div>
                  <p className="checkout-kicker">Form 2</p>
                  <h2>Card Details</h2>
                </div>
                <span className="checkout-pill">Mock payment only</span>
              </div>

              <div className="card-preview">
                <div className="card-preview-top">
                  <span>TechMind Pay</span>
                  <i className="fas fa-wifi" />
                </div>
                <div className="card-preview-number">{cardPreviewNumber}</div>
                <div className="card-preview-meta">
                  <div>
                    <span>Cardholder</span>
                    <strong>{cardPreviewName}</strong>
                  </div>
                  <div>
                    <span>Expires</span>
                    <strong>{cardPreviewExpiry}</strong>
                  </div>
                </div>
              </div>

              <div className="checkout-form-grid">
                <label className="field-group field-group-full">
                  <span className="field-label">Name on Card</span>
                  <input
                    className={`field-input${visibleErrors.cardholderName ? ' invalid' : ''}`}
                    name="cardholderName"
                    value={card.cardholderName}
                    onChange={handleCardChange}
                    onBlur={handleBlur}
                    placeholder="Jane Doe"
                  />
                  {visibleErrors.cardholderName && <span className="field-error">{visibleErrors.cardholderName}</span>}
                </label>

                <label className="field-group field-group-full">
                  <span className="field-label">Card Number</span>
                  <input
                    className={`field-input${visibleErrors.cardNumber ? ' invalid' : ''}`}
                    name="cardNumber"
                    inputMode="numeric"
                    value={card.cardNumber}
                    onChange={handleCardChange}
                    onBlur={handleBlur}
                    placeholder="1234 5678 9012 3456"
                  />
                  {visibleErrors.cardNumber && <span className="field-error">{visibleErrors.cardNumber}</span>}
                </label>

                <label className="field-group">
                  <span className="field-label">Expiry</span>
                  <input
                    className={`field-input${visibleErrors.expiry ? ' invalid' : ''}`}
                    name="expiry"
                    inputMode="numeric"
                    value={card.expiry}
                    onChange={handleCardChange}
                    onBlur={handleBlur}
                    placeholder="MM/YY"
                  />
                  {visibleErrors.expiry && <span className="field-error">{visibleErrors.expiry}</span>}
                </label>

                <label className="field-group">
                  <span className="field-label">CVV</span>
                  <input
                    className={`field-input${visibleErrors.cvv ? ' invalid' : ''}`}
                    name="cvv"
                    inputMode="numeric"
                    value={card.cvv}
                    onChange={handleCardChange}
                    onBlur={handleBlur}
                    placeholder="123"
                  />
                  {visibleErrors.cvv && <span className="field-error">{visibleErrors.cvv}</span>}
                </label>
              </div>
            </section>
          </div>

          <aside className="checkout-summary-panel">
            <div className="cart-summary checkout-summary-card">
              <h3>Order Summary</h3>
              <div className="checkout-summary-list">
                {items.map((item) => (
                  <div className="checkout-line-item" key={item.id}>
                    <div>
                      <strong>{item.name}</strong>
                      <span>{item.quantity} x {item.priceDisplay}</span>
                    </div>
                    <span>${(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="summary-divider" />
              <div className="summary-row">
                <span>Items ({cartCount})</span>
                <span>${cartTotal.toLocaleString()}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span className="summary-free">Free</span>
              </div>
              <div className="summary-row">
                <span>Payment type</span>
                <span>Mock Card</span>
              </div>
              <div className="summary-divider" />
              <div className="summary-row summary-total">
                <span>Total</span>
                <span>${cartTotal.toLocaleString()}</span>
              </div>

              <button
                className="btn btn-primary btn-full checkout-submit"
                type="submit"
                disabled={submitting}
              >
                <i className="fas fa-lock" />
                <span>{submitting ? 'Processing...' : `Pay $${cartTotal.toLocaleString()}`}</span>
              </button>

              <p className="checkout-note">
                This is a demo checkout. We only validate card length, CVV, and expiry on the frontend.
              </p>
            </div>
          </aside>
        </form>
      </div>
    </section>
  );
}
