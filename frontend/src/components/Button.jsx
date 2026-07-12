import React from 'react';
import { THEME } from '../theme';

const Button = ({ children, onClick, variant = 'primary', className = '', disabled, ...props }) => {
  const isPrimary = variant === 'primary';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative group overflow-hidden rounded-lg px-6 py-3 font-semibold tracking-wide text-sm transition-all duration-300 ease-out flex items-center justify-center gap-2
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] hover:shadow-lg'}
        ${className}`}
      style={{
        backgroundColor: isPrimary ? THEME.primary : 'transparent',
        color: isPrimary ? '#FFFFFF' : THEME.primary,
        border: `2px solid ${isPrimary ? THEME.primary : THEME.primary}`,
      }}
      {...props}
    >
      {/* Hover darken for primary */}
      {!disabled && isPrimary && (
        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
      )}
      {/* Hover fill for outline */}
      {!disabled && !isPrimary && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ backgroundColor: `${THEME.primary}10` }} />
      )}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
};

export default Button;
