import { useCallback, useEffect, useRef } from 'react';

export default function useReveal() {
  const observerRef = useRef(null);

  const disconnectObserver = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);

  const revealRef = useCallback((el) => {
    disconnectObserver();
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('visible');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const children = entry.target.querySelectorAll(
              '.product-card, .feature-card, .banner-card, .category-card'
            );
            if (children.length > 0) {
              children.forEach((child, i) => {
                child.style.opacity = '0';
                child.style.transform = 'translateY(20px)';
                child.style.transition = `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.07}s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.07}s`;
                requestAnimationFrame(() => {
                  child.style.opacity = '1';
                  child.style.transform = 'translateY(0)';
                });
              });
            }
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(el);
    observerRef.current = observer;
  }, [disconnectObserver]);

  useEffect(() => disconnectObserver, [disconnectObserver]);

  return revealRef;
}
