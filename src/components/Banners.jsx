import useReveal from '../hooks/useReveal';

export default function Banners({ onCategorySelect }) {
  const ref = useReveal();

  return (
    <section className="banners section">
      <div className="container">
        <div className="banner-grid reveal" ref={ref}>
          <div className="banner-card banner-cyber">
            <div className="banner-content">
              <span className="banner-tag"><i className="fas fa-clock" /> Limited Time</span>
              <h3>Gaming Week</h3>
              <p>Up to 20% off all gaming products</p>
              <button className="btn btn-primary btn-sm" onClick={() => {
                onCategorySelect('gaming');
                document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
              }}>
                Explore <i className="fas fa-arrow-right" />
              </button>
            </div>
            <div className="banner-deco"><i className="fas fa-gamepad" /></div>
          </div>
          <div className="banner-card banner-neon">
            <div className="banner-content">
              <span className="banner-tag"><i className="fas fa-gift" /> Special Offer</span>
              <h3>Smart Home</h3>
              <p>Extra 10% off smart home products at checkout</p>
              <button className="btn btn-primary btn-sm" onClick={() => {
                onCategorySelect('tv');
                document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
              }}>
                Shop Now <i className="fas fa-arrow-right" />
              </button>
            </div>
            <div className="banner-deco"><i className="fas fa-home" /></div>
          </div>
        </div>
      </div>
    </section>
  );
}
