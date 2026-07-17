import React, { useState, useEffect, useRef } from 'react';
import { THEME } from '../theme';

const AnimatedStat = ({ value, suffix = '', label, icon }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const step = () => {
          start += Math.ceil(value / 40);
          if (start >= value) {
            setCount(value);
            return;
          }
          setCount(start);
          requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div 
      ref={ref} 
      className="p-7 md:p-8 rounded-3xl border bg-white/80 backdrop-blur-md shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 hover:border-emerald-600/30 text-center group h-full flex flex-col justify-between"
      style={{ borderColor: 'rgba(255,255,255,0.9)' }}
    >
      <div className="flex flex-col items-center">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 shadow-md border-2 bg-gradient-to-br from-emerald-50 to-white mb-5 shrink-0"
          style={{ borderColor: `${THEME.primary}15`, color: THEME.primary }}
        >
          {icon}
        </div>
        <div 
          className="text-5xl md:text-6xl font-extrabold tracking-tight text-[#1F4D3A] select-none"
          style={{ fontFamily: 'Plus Jakarta Sans' }}
        >
          {count}{suffix}
        </div>
      </div>
      <div 
        className="text-[11px] md:text-xs font-bold uppercase tracking-widest text-emerald-800 mt-4 leading-snug"
        style={{ fontFamily: 'Plus Jakarta Sans' }}
      >
        {label}
      </div>
    </div>
  );
};

export default AnimatedStat;
