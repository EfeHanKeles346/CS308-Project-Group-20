import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { headerCategories } from '../data/categories';

export default function Header({ onOpenModal, onSearch, selectedCategory, onCategorySelect }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const { cartCount } = useCart();
  const { isLoggedIn, user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        document.getElementById('mainSearch')?.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    onSearch(value);
    // Navigate to home if not already there, so search results show
    if (window.location.pathname !== '/') navigate('/');
    if (value) setTimeout(() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleSearchClear = () => {
    setSearchValue('');
    onSearch('');
  };

  return (
    <header className={`header${scrolled ? ' scrolled' : ''}`} role="banner">
      <div className="container header-inner">
        <Link to="/" className="logo" aria-label="TechMind Home" onClick={handleSearchClear}>
          <span className="logo-text">Tech<span>Mind</span></span>
        </Link>

        <div className="search-bar">
          <i className="fas fa-search search-icon" />
          <input
            id="mainSearch"
            type="text"
            placeholder="Search products, categories or brands..."
            value={searchValue}
            onChange={handleSearchChange}
            aria-label="Search products"
          />
          {searchValue ? (
            <button className="search-clear-btn" onClick={handleSearchClear} aria-label="Clear search">
              <i className="fas fa-xmark" />
            </button>
          ) : (
            <kbd className="search-kbd">/</kbd>
          )}
        </div>

        <nav className="header-nav" aria-label="Main navigation">
          <button
            className={`nav-link${selectedCategory === 'deals' ? ' active' : ''}`}
            onClick={() => {
              onCategorySelect('deals');
              if (window.location.pathname !== '/') navigate('/');
              setTimeout(() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' }), 100);
            }}
          >Deals</button>
          <a href="#" className="nav-link">Stores</a>
          <a href="#" className="nav-link">Help</a>
        </nav>

        <div className="header-actions">
          {isLoggedIn ? (
            <button className="header-icon-btn" onClick={logout} aria-label={`Signed in as ${user?.name}. Click to sign out.`} style={{ color: 'var(--cyan)' }} title={`${user?.name} - Sign Out`}>
              <i className="fas fa-user-check" />
            </button>
          ) : (
            <button className="header-icon-btn" onClick={() => onOpenModal('login')} aria-label="Sign in" id="authBtn">
              <i className="fas fa-user" />
            </button>
          )}
          <button className="header-icon-btn" aria-label="Wishlist">
            <i className="fas fa-heart" />
          </button>
          <Link to="/cart" className="header-icon-btn cart-btn" aria-label={`Shopping cart with ${cartCount} items`}>
            <i className="fas fa-shopping-bag" />
            {cartCount > 0 && <span className="cart-badge">{cartCount > 99 ? '99+' : cartCount}</span>}
          </Link>
        </div>

        <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileOpen}>
          <i className={`fas ${mobileOpen ? 'fa-xmark' : 'fa-bars'}`} />
        </button>
      </div>

      <div className={`cat-nav${mobileOpen ? ' open' : ''}`}>
        <div className="container">
          <div className="cat-nav-scroll" role="navigation" aria-label="Categories">
            {headerCategories.map((cat) => (
              <button
                key={cat.id}
                className={`cat-link${selectedCategory === cat.id ? ' active' : ''}`}
                onClick={() => {
                  onCategorySelect(cat.id);
                  if (window.location.pathname !== '/') navigate('/');
                  setTimeout(() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' }), 100);
                }}
                aria-pressed={selectedCategory === cat.id}
              >
                <i className={`fas ${cat.icon}`} /> {cat.label}
              </button>
            ))}
            <button
              className={`cat-link cat-link-accent${selectedCategory === 'deals' ? ' active' : ''}`}
              onClick={() => {
                onCategorySelect('deals');
                if (window.location.pathname !== '/') navigate('/');
                setTimeout(() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' }), 100);
              }}
              aria-pressed={selectedCategory === 'deals'}
            >
              <i className="fas fa-fire" /> Deals
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
