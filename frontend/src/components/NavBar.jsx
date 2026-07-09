import React from 'react';
import { Cpu } from 'lucide-react';
import { THEME } from '../theme';

const NavBar = ({ onHome }) => (
  <nav className="px-6 py-4 sticky top-0 z-50 backdrop-blur-xl bg-black/50 border-b" style={{ borderColor: THEME.border }}>
    <div className="max-w-6xl mx-auto flex items-center justify-between">
      <div className="flex items-center gap-3 cursor-pointer group" onClick={onHome}>
        <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 border border-white/10 overflow-hidden group-hover:border-white/30 transition-colors">
          <Cpu size={16} className="text-white/80 group-hover:text-white transition-colors z-10" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <span className="font-semibold tracking-wide">EcoPlate Research</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-mono">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          SYSTEM ONLINE
        </div>
      </div>
    </div>
  </nav>
);

export default NavBar;
