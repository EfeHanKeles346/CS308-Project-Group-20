export default function Footer({ onOpenModal }) {
  return (
    <footer className="footer" role="contentinfo">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col footer-brand">
            <a href="#" className="logo" aria-label="TechMind Home">
              <span className="logo-text">Tech<span>Mind</span></span>
            </a>
            <p>Welcome to the largest tech store. The latest products, the best prices.</p>
            <div className="social-links">
              <a href="#" aria-label="Facebook"><i className="fab fa-facebook-f" /></a>
              <a href="#" aria-label="Twitter"><i className="fab fa-x-twitter" /></a>
              <a href="#" aria-label="Instagram"><i className="fab fa-instagram" /></a>
              <a href="#" aria-label="YouTube"><i className="fab fa-youtube" /></a>
            </div>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <ul>
              <li><a href="#">About Us</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Press</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Help</h4>
            <ul>
              <li><a href="#">FAQ</a></li>
              <li><a href="#">Shipping &amp; Delivery</a></li>
              <li><a href="#">Returns &amp; Exchanges</a></li>
              <li><a href="#">Warranty</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>My Account</h4>
            <ul>
              <li><a href="#" onClick={(e) => { e.preventDefault(); onOpenModal('login'); }}>Sign In</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); onOpenModal('register'); }}>Sign Up</a></li>
              <li><a href="#">My Orders</a></li>
              <li><a href="#">My Wishlist</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 TechMind. All rights reserved.</p>
          <div className="payment-icons">
            <i className="fab fa-cc-visa" />
            <i className="fab fa-cc-mastercard" />
            <i className="fab fa-cc-amex" />
            <i className="fab fa-cc-apple-pay" />
          </div>
        </div>
      </div>
    </footer>
  );
}
