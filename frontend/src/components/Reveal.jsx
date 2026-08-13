import React, { useState, useEffect, useRef } from 'react';

const Reveal = ({ children, delay = 0, className = '', direction = 'from-bottom' }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [parallaxOffset, setParallaxOffset] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        setAnimationComplete(true);
      }, 900 + delay + 100);
      return () => clearTimeout(timer);
    }
  }, [visible, delay]);

  // Subtle parallax: elements shift slightly as you scroll past them
  useEffect(() => {
    if (!animationComplete) return;
    const handleScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const viewportCenter = window.innerHeight / 2;
      const elementCenter = rect.top + rect.height / 2;
      const offset = (elementCenter - viewportCenter) / window.innerHeight;
      // Subtle shift: max ±8px
      setParallaxOffset(offset * -8);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [animationComplete]);

  const getInitialTransform = () => {
    switch (direction) {
      case 'from-bottom': return 'translateY(50px)';
      case 'from-top': return 'translateY(-50px)';
      case 'from-left': return 'translateX(-50px)';
      case 'from-right': return 'translateX(50px)';
      case 'zoom-in': return 'scale(0.85)';
      default: return 'translateY(50px)';
    }
  };

  const getFinalTransform = () => {
    if (direction === 'zoom-in') return 'scale(1)';
    return 'translate(0, 0)';
  };

  const getParallaxTransform = () => {
    return `translateY(${parallaxOffset}px)`;
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: animationComplete
          ? getParallaxTransform()
          : (visible ? getFinalTransform() : getInitialTransform()),
        transition: animationComplete
          ? 'transform 0.1s linear'
          : `opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        willChange: animationComplete ? 'auto' : 'opacity, transform'
      }}
    >
      {children}
    </div>
  );
};

export default Reveal;
