import { useState, useEffect } from 'react';
import useReveal from '../hooks/useReveal';
import allProducts from '../data/products';

// Derive hero carousel from centralized data — single source of truth
const heroProducts = allProducts.slice(0, 5).map((p) => ({
  id: p.id,
  img: p.img.replace('w=600', 'w=400').replace('h=600', 'h=400'),
  brand: p.brand,
  name: p.name,
  old: p.oldPriceDisplay || '',
  price: p.priceDisplay,
}));

export default function Hero({ onCategorySelect }) {
  const [current, setCurrent] = useState(0);
  const [switching, setSwitching] = useState(false);
  const mainRef = useReveal();
  const visualRef = useReveal();

  useEffect(() => {
    const interval = setInterval(() => {
      setSwitching(true);
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % heroProducts.length);
        setSwitching(false);
      }, 500);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const p = heroProducts[current];

  return (
    <section className="hero">
      <div className="hero-bg">
        <div className="hero-grid-pattern" />
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />
        <div className="hero-line hero-line-1" />
        <div className="hero-line hero-line-2" />
      </div>
      <div className="container hero-content">
        <div className="hero-main reveal" ref={mainRef}>
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            2026 New Season
          </div>
          <h1 className="hero-title">
            The Future of
            <span className="hero-title-gradient"> Technology</span>
            <br />Is Here.
          </h1>
          <p className="hero-desc">
            Discover thousands of premium tech products. Same-day shipping, hassle-free returns, and best price guarantee.
          </p>
          <div className="hero-buttons">
            <a href="#products" className="btn btn-primary">
              <span>Explore</span>
              <i className="fas fa-arrow-right" />
            </a>
            <button className="btn btn-outline" onClick={() => {
              onCategorySelect('deals');
              document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
            }}>
              <i className="fas fa-play" />
              <span>Deals</span>
            </button>
          </div>
        </div>
        <div className="hero-visual reveal" ref={visualRef}>
          <div className="hero-card-stack">
            <div className={`hero-product-card${switching ? ' switching' : ''}`}>
              <div className="hpc-glow" />
              <div className="hpc-image">
                <img src={p.img} alt={`${p.brand} ${p.name}`} />
              </div>
              <div className="hpc-info">
                <span className="hpc-brand">{p.brand}</span>
                <span className="hpc-name">{p.name}</span>
                <div className="hpc-price">
                  {p.old && <span className="hpc-old">{p.old}</span>}
                  <span className="hpc-new">{p.price}</span>
                </div>
              </div>
            </div>
            <div className="hero-orbit">
              <div className="orbit-card orbit-card-1">
                <i className="fas fa-truck-fast" /><span>Same Day Shipping</span>
              </div>
              <div className="orbit-card orbit-card-2">
                <i className="fas fa-shield-halved" /><span>100% Secure</span>
              </div>
              <div className="orbit-card orbit-card-3">
                <i className="fas fa-rotate-left" /><span>14-Day Returns</span>
              </div>
              <div className="orbit-card orbit-card-4">
                <i className="fas fa-star" /><span>4.8 Rating</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
