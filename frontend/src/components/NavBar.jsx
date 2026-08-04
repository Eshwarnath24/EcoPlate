import React from 'react';
import { ChefHat, ArrowLeft } from 'lucide-react';
import { THEME } from '../theme';

const NavBar = ({ onHome, onBack }) => (
  <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg border-b shadow-sm transition-all duration-300" style={{ backgroundColor: `${THEME.bg}CC`, borderColor: THEME.border }}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-16">
        <div className="flex items-center gap-4">
          {onBack && (
            <button 
              onClick={onBack} 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10"
              style={{ color: THEME.textMuted }}
            >
              <ArrowLeft size={16} />
              <span className="text-sm font-semibold font-mono tracking-wide">BACK</span>
            </button>
          )}
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer transition-transform hover:scale-105" onClick={onHome}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: THEME.primary, color: '#fff' }}>
              <ChefHat size={18} />
            </div>
            <span className="text-xl font-bold tracking-wide drop-shadow-sm" style={{ color: THEME.text }}>
              Eco<span style={{ color: THEME.primary }}>Plate</span>
            </span>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-mono shadow-sm backdrop-blur-sm border font-bold" style={{ borderColor: THEME.border, backgroundColor: THEME.surface, color: THEME.textMuted }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: THEME.success, boxShadow: `0 0 8px ${THEME.success}80` }} />
            SYSTEM ONLINE
          </div>
        </div>
      </div>
    </div>
  </nav>
);

export default NavBar;
