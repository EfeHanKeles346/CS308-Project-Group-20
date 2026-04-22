import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getSavedAddress, saveAddress } from '../utils/profileStorage';
import { validateAddress } from '../utils/paymentValidation';

export default function UserPage() {
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();
  const { showToast } = useToast();
  const [address, setAddress] = useState(() => getSavedAddress(user));
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setAddress(getSavedAddress(user));
  }, [user]);

  if (!isLoggedIn) {
    return (
      <section className="account-page section">
        <div className="container">
          <div className="empty-state">
            <i className="fas fa-user-lock" />
            <h3>Sign in to manage your address</h3>
            <p>Your account page becomes available after signing in from the header avatar.</p>
            <Link to="/" className="btn btn-primary" style={{ marginTop: '20px', display: 'inline-flex' }}>
              <i className="fas fa-arrow-left" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const initials = user?.name
    ?.split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'TM';

  const handleChange = (event) => {
    const { name, value } = event.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const nextErrors = validateAddress(address);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      showToast('Please complete your address details.', 'error');
      return;
    }

    saveAddress(user, address);
    showToast('Your address has been updated.', 'success');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <section className="account-page section">
      <div className="container">
        <div className="cart-header">
          <p className="checkout-kicker">My Account</p>
          <h1 className="section-title">Address settings</h1>
          <p className="section-sub">Keep one saved address ready for faster checkout.</p>
        </div>

        <div className="account-layout">
          <aside className="account-sidebar">
            <div className="account-card">
              <div className="account-avatar">{initials}</div>
              <h2>{user.name}</h2>
              <p>{user.email}</p>
              <div className="account-chip">
                <i className="fas fa-location-dot" />
                <span>Single saved address</span>
              </div>
              <div className="account-actions">
                <Link to="/checkout" className="btn btn-primary btn-full">
                  <i className="fas fa-credit-card" />
                  <span>Go to Checkout</span>
                </Link>
                <button className="btn btn-outline btn-full" onClick={handleLogout} type="button">
                  <i className="fas fa-arrow-right-from-bracket" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </aside>

          <form className="account-panel" onSubmit={handleSubmit} noValidate>
            <div className="checkout-panel-header">
              <div>
                <p className="checkout-kicker">Address Book</p>
                <h2>Default delivery address</h2>
              </div>
              <span className="checkout-pill">Used at checkout</span>
            </div>

            <div className="checkout-form-grid">
              <label className="field-group">
                <span className="field-label">Full Name</span>
                <input
                  className={`field-input${errors.fullName ? ' invalid' : ''}`}
                  name="fullName"
                  value={address.fullName}
                  onChange={handleChange}
                  placeholder="Jane Doe"
                />
                {errors.fullName && <span className="field-error">{errors.fullName}</span>}
              </label>

              <label className="field-group">
                <span className="field-label">Phone</span>
                <input
                  className={`field-input${errors.phone ? ' invalid' : ''}`}
                  name="phone"
                  value={address.phone}
                  onChange={handleChange}
                  placeholder="+90 555 555 55 55"
                />
                {errors.phone && <span className="field-error">{errors.phone}</span>}
              </label>

              <label className="field-group field-group-full">
                <span className="field-label">Address Line 1</span>
                <input
                  className={`field-input${errors.line1 ? ' invalid' : ''}`}
                  name="line1"
                  value={address.line1}
                  onChange={handleChange}
                  placeholder="Street, building, apartment"
                />
                {errors.line1 && <span className="field-error">{errors.line1}</span>}
              </label>

              <label className="field-group field-group-full">
                <span className="field-label">Address Line 2</span>
                <input
                  className="field-input"
                  name="line2"
                  value={address.line2}
                  onChange={handleChange}
                  placeholder="District, floor, delivery note"
                />
              </label>

              <label className="field-group">
                <span className="field-label">City</span>
                <input
                  className={`field-input${errors.city ? ' invalid' : ''}`}
                  name="city"
                  value={address.city}
                  onChange={handleChange}
                  placeholder="Istanbul"
                />
                {errors.city && <span className="field-error">{errors.city}</span>}
              </label>

              <label className="field-group">
                <span className="field-label">Postal Code</span>
                <input
                  className={`field-input${errors.postalCode ? ' invalid' : ''}`}
                  name="postalCode"
                  value={address.postalCode}
                  onChange={handleChange}
                  placeholder="34000"
                />
                {errors.postalCode && <span className="field-error">{errors.postalCode}</span>}
              </label>

              <label className="field-group field-group-full">
                <span className="field-label">Country</span>
                <input
                  className={`field-input${errors.country ? ' invalid' : ''}`}
                  name="country"
                  value={address.country}
                  onChange={handleChange}
                  placeholder="Turkey"
                />
                {errors.country && <span className="field-error">{errors.country}</span>}
              </label>
            </div>

            <div className="account-panel-actions">
              <button className="btn btn-primary" type="submit">
                <i className="fas fa-floppy-disk" />
                <span>Save Address</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
