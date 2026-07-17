import React from 'react';
import { THEME } from '../theme';

const NavBar = ({ onHome }) => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-white/40 backdrop-blur-lg border-b shadow-sm transition-all duration-300" style={{ borderColor: 'rgba(255,255,255,0.4)' }}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-16">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer transition-transform hover:scale-105" onClick={onHome}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-sm" style={{ border: `1px solid ${THEME.primary}30` }}>
            🌱
          </div>
          <span className="text-xl font-bold tracking-wide drop-shadow-sm" style={{ color: THEME.text }}>
            Eco<span style={{ color: THEME.primary }}>Plate</span>
          </span>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-mono shadow-sm bg-white/50 backdrop-blur-sm border" style={{ borderColor: 'rgba(255,255,255,0.6)', color: THEME.textMuted }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: THEME.success }} />
            PIPELINE READY
          </div>
        </div>
      </div>
    </div>
  </nav>
);

export default NavBar;
