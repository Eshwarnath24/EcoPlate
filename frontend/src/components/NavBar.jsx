import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChefHat, ArrowLeft, Flame, ExternalLink, Utensils, Camera, BarChart3, Radio } from 'lucide-react';
import { THEME } from '../theme';

// Stainless Steel Screw Rivet Component
const MetalRivet = () => (
  <div className="w-3 h-3 rounded-full bg-gradient-to-tr from-gray-700 via-gray-300 to-gray-800 shadow border border-gray-900 flex items-center justify-center shrink-0">
    <div className="w-1.5 h-[1px] bg-gray-950 rotate-45" />
  </div>
);

const NavBar = ({ onHome, onBack }) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(scrollHeight > 0 ? Math.min(scrollTop / scrollHeight, 1) : 0);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const tickets = [
    { id: 'home', number: '#101', label: 'EXPEDITOR', sub: 'Overview', path: '/', icon: <Utensils size={13} /> },
    { id: 'analysis', number: '#102', label: 'DISH PIT', sub: 'Scan Plate', path: '/analysis', icon: <Camera size={13} /> },
    { id: 'report', number: '#103', label: 'ANALYTICS', sub: 'Chef Report', path: '/report', icon: <BarChart3 size={13} /> },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      {/* ===== Stainless Steel Expeditor Rail ===== */}
      <div 
        className="relative border-b backdrop-blur-xl transition-all duration-500"
        style={{
          backgroundColor: scrollProgress > 0.05 ? 'rgba(10, 10, 12, 0.95)' : 'rgba(15, 15, 18, 0.85)',
          borderColor: scrollProgress > 0.1 ? 'rgba(234, 88, 12, 0.3)' : 'rgba(255, 255, 255, 0.1)',
          boxShadow: scrollProgress > 0.05 
            ? '0 10px 30px rgba(0, 0, 0, 0.8), 0 4px 20px rgba(234, 88, 12, 0.15)' 
            : '0 4px 20px rgba(0, 0, 0, 0.6)'
        }}
      >
        {/* Steel Rail Top Brushed Shine Track */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-gray-400/50 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 relative">
            
            {/* Left: Brand Logo & Back Action */}
            <div className="flex items-center gap-3">
              <MetalRivet />
              
              {location.pathname !== '/' && (
                <button 
                  onClick={() => navigate(-1)} 
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 shadow-inner"
                >
                  <ArrowLeft size={13} />
                  <span className="hidden sm:inline">BACK</span>
                </button>
              )}

              {/* Logo Badge */}
              <div 
                className="flex items-center gap-2 cursor-pointer group transition-transform active:scale-95" 
                onClick={() => navigate('/')}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-orange-500 to-amber-600 text-white border border-orange-400/40 group-hover:scale-105 transition-transform">
                  <ChefHat size={20} />
                </div>
                <span className="text-xl font-extrabold tracking-wide text-white drop-shadow-md hidden sm:inline font-sans">
                  Eco<span className="text-orange-500">Plate</span>
                </span>
              </div>
            </div>

            {/* Center: Stainless Steel Kitchen Ticket Rail Navigation */}
            <div className="flex items-center gap-3 sm:gap-4 relative">
              {/* Stainless Steel Background Rail Track Bar */}
              <div className="absolute -inset-x-3 inset-y-2 rounded-xl bg-gradient-to-r from-gray-800/80 via-gray-700/60 to-gray-800/80 border border-gray-600/30 shadow-inner pointer-events-none hidden sm:block" />

              {tickets.map((t) => {
                const isActive = location.pathname === t.path;
                return (
                  <div key={t.id} className="relative z-10">
                    <button
                      onClick={() => navigate(t.path)}
                      className={`group relative flex items-center gap-2.5 px-4 py-2 rounded-xl font-mono transition-all duration-300 cursor-pointer border ${
                        isActive
                          ? 'bg-[#faf6f0] text-gray-900 border-orange-500 shadow-lg shadow-orange-500/25 scale-105 -translate-y-0.5'
                          : 'bg-gray-900/80 text-gray-300 border-gray-700/60 hover:bg-gray-800 hover:border-gray-500 hover:text-white'
                      }`}
                      style={{
                        backgroundImage: isActive 
                          ? 'repeating-linear-gradient(0deg, transparent, transparent 15px, rgba(0,0,0,0.03) 15px, rgba(0,0,0,0.03) 16px)'
                          : 'none'
                      }}
                    >
                      {/* Metal Ticket Roller Clip / Clip notch */}
                      <div className={`absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-2 rounded-t-sm border border-gray-500 shadow-sm z-20 ${
                        isActive ? 'bg-gradient-to-b from-gray-200 to-gray-500' : 'bg-gradient-to-b from-gray-600 to-gray-800'
                      }`} />

                      {/* Icon */}
                      <span className={isActive ? 'text-orange-600' : 'text-gray-400 group-hover:text-orange-400'}>
                        {t.icon}
                      </span>

                      {/* Ticket Label & Details */}
                      <div className="flex flex-col text-left">
                        <div className="flex items-center gap-1.5 leading-none">
                          <span className={`font-black text-xs tracking-wide ${isActive ? 'text-gray-900' : 'text-gray-200'}`}>
                            {t.label}
                          </span>
                          <span className={`text-[9px] font-bold ${isActive ? 'text-orange-600' : 'text-gray-500'}`}>
                            {t.number}
                          </span>
                        </div>
                        <span className={`text-[9.5px] font-medium leading-none mt-1 ${isActive ? 'text-gray-600' : 'text-gray-400'}`}>
                          {t.sub}
                        </span>
                      </div>

                      {/* Active Live Indicator Badge */}
                      {isActive && (
                        <span className="ml-1 px-1.5 py-0.5 rounded text-[8px] font-black bg-red-600 text-white tracking-widest animate-pulse shadow">
                          LIVE
                        </span>
                      )}

                      {/* Torn paper serrated bottom accent for active ticket */}
                      {isActive && (
                        <div className="absolute -bottom-1.5 left-2 right-2 h-1.5 overflow-hidden pointer-events-none">
                          <svg width="100%" height="6" preserveAspectRatio="none" viewBox="0 0 100 6">
                            <path d="M0,0 L5,5 L10,0 L15,5 L20,0 L25,5 L30,0 L35,5 L40,0 L45,5 L50,0 L55,5 L60,0 L65,5 L70,0 L75,5 L80,0 L85,5 L90,0 L95,5 L100,0 L100,6 L0,6 Z" fill="#faf6f0" />
                          </svg>
                        </div>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Right: Heat Status & POS Online Badge */}
            <div className="flex items-center gap-3">
              {/* Heat Indicator */}
              <div
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-white/5 border border-white/10 shadow-inner"
                style={{
                  borderColor: scrollProgress > 0.5 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(234, 88, 12, 0.3)',
                  color: scrollProgress > 0.5 ? '#ef4444' : '#f97316'
                }}
              >
                <Flame size={14} className="animate-pulse" />
                <span className="text-[10.5px] tracking-wider">
                  {scrollProgress < 0.33 ? 'HEAT: LOW' : scrollProgress < 0.66 ? 'HEAT: MED' : 'HEAT: HIGH'}
                </span>
              </div>

              {/* POS Status Badge */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10.5px] font-mono font-bold bg-white/5 border border-white/10 text-emerald-400 shadow-inner">
                <Radio size={12} className="animate-pulse" />
                <span>POS ONLINE</span>
              </div>

              {/* GitHub Link */}
              <a 
                href="https://github.com/Eshwarnath24/EcoPlate" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hidden lg:flex w-9 h-9 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 items-center justify-center text-gray-300 hover:text-white transition-colors shadow-inner hover:border-orange-500/40"
                title="GitHub Repository"
              >
                <ExternalLink size={14} />
              </a>

              <MetalRivet />
            </div>

          </div>
        </div>

        {/* Rail Bottom Subtle Edge Line */}
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />
      </div>
    </nav>
  );
};

export default NavBar;
