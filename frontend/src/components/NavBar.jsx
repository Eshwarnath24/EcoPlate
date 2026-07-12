import React from 'react';
import { Leaf } from 'lucide-react';
import { THEME } from '../theme';

const NavBar = ({ onHome }) => (
  <nav className="px-6 py-5 sticky top-0 z-50 shadow-sm" style={{ backgroundColor: THEME.primary }}>
    <div className="max-w-7xl mx-auto flex items-center justify-between">
      <div className="flex items-center gap-3 cursor-pointer group" onClick={onHome}>
        <span className="text-3xl">🌱</span>
        <div>
          <span className="font-bold text-2xl tracking-wide text-white">
            Eco<span style={{ color: THEME.accent }}>Plate</span>
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-mono" style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)' }}>
          <div className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
          PIPELINE READY
        </div>
      </div>
    </div>
  </nav>
);

export default NavBar;
