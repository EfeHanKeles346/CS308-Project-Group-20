import { useState, useEffect, useRef } from 'react';

export default function CursorGlow() {
  const [active, setActive] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleMove = (e) => {
      if (!active) setActive(true);
      if (ref.current) {
        ref.current.style.left = e.clientX + 'px';
        ref.current.style.top = e.clientY + 'px';
      }
    };
    document.addEventListener('mousemove', handleMove);
    return () => document.removeEventListener('mousemove', handleMove);
  }, [active]);

  return <div className={`cursor-glow${active ? ' active' : ''}`} ref={ref} />;
}
