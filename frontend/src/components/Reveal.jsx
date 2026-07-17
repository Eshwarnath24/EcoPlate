import React, { useState, useEffect, useRef } from 'react';

const Reveal = ({ children, delay = 0, className = '', direction = 'from-bottom' }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);

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

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: animationComplete ? 'none' : (visible ? getFinalTransform() : getInitialTransform()),
        transition: `opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        willChange: animationComplete ? 'auto' : 'opacity, transform'
      }}
    >
      {children}
    </div>
  );
};

export default Reveal;
