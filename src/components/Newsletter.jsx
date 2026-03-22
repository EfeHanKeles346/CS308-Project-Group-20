import { useState } from 'react';
import useReveal from '../hooks/useReveal';
import { useToast } from '../context/ToastContext';

export default function Newsletter() {
  const ref = useReveal();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast('Please enter your email address.', 'error');
      return;
    }
    if (!isValidEmail(email)) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    // TODO: Replace with real API call when backend is ready
    setSubmitted(true);
    showToast('Subscribed successfully!', 'success');
  };

  return (
    <section className="newsletter reveal" ref={ref}>
      <div className="container">
        <div className="newsletter-card">
          <div className="newsletter-text">
            <h3>Be the first to know about deals</h3>
            <p>Subscribe to our newsletter and never miss a deal.</p>
          </div>
          {submitted ? (
            <div className="newsletter-success" role="status">
              <i className="fas fa-check-circle" />
              <span>Thank you for subscribing!</span>
            </div>
          ) : (
            <form className="newsletter-form" onSubmit={handleSubmit} noValidate>
              <input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Email address for newsletter"
                required
              />
              <button type="submit" className="btn btn-primary">Subscribe</button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
