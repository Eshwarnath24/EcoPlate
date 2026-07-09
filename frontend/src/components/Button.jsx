import React from 'react';
import { THEME } from '../theme';

const Button = ({ children, onClick, variant = 'primary', className = '', disabled, ...props }) => {
  const isPrimary = variant === 'primary';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative group overflow-hidden rounded-md px-6 py-3 font-medium tracking-wide text-sm transition-all duration-500 ease-out flex items-center justify-center gap-2
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}
        ${className}`}
      style={{
        backgroundColor: isPrimary ? THEME.text : 'transparent',
        color: isPrimary ? THEME.bg : THEME.text,
        border: `1px solid ${isPrimary ? 'transparent' : THEME.borderHighlight}`,
      }}
      {...props}
    >
      {/* Button hover flare */}
      {!disabled && isPrimary && (
        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
      )}
      {!disabled && !isPrimary && (
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
};

export default Button;
