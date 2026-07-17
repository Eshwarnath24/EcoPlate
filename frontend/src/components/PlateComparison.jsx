import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { THEME } from '../theme';
import beforeImg from '../images/before_meal.png';
import afterImg from '../images/after_meal.png';

const PlateComparison = () => {
  const [hovered, setHovered] = useState(null);

  const scanStyle = `
    @keyframes scan {
      0% { top: 0%; }
      50% { top: 100%; }
      100% { top: 0%; }
    }
    .animate-scan { animation: scan 3s linear infinite; }
  `;

  return (
    <div className="relative w-full">
      <style>{scanStyle}</style>

      {/* Main Comparison Container (No overflow-hidden on this outer container to ensure child backdrop blurs work) */}
      <div className="relative w-full h-[520px] md:h-[600px] rounded-3xl shadow-2xl backdrop-blur-md" style={{ border: `1px solid rgba(255,255,255,0.45)`, backgroundColor: `rgba(255,255,255,0.1)` }}>
        <div className="absolute inset-0 flex">
          {/* Before side (Left half with rounded left corners) */}
          <div
            className="relative w-1/2 rounded-l-3xl overflow-hidden cursor-pointer group"
            onMouseEnter={() => setHovered('before')}
            onMouseLeave={() => setHovered(null)}
          >
            <div
              className="absolute inset-0 transition-all duration-700 group-hover:scale-110"
              style={{ backgroundImage: `url(${beforeImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent group-hover:from-black/55 transition-all duration-500" />
            <div className="absolute left-0 right-0 h-[2px] animate-scan opacity-60 z-10" style={{ backgroundColor: THEME.success, boxShadow: `0 0 20px ${THEME.success}` }} />
            
            {hovered === 'before' && (
              <div className="absolute inset-0 pointer-events-none z-10">
                <div className="absolute top-[14%] left-[18%] w-[28%] h-[30%] border-2 rounded-lg animate-pulse" style={{ borderColor: THEME.success, backgroundColor: 'rgba(76, 175, 80, 0.2)' }}>
                  <span className="absolute -top-6 left-0 text-[10px] font-mono px-2 py-0.5 rounded text-white" style={{ backgroundColor: THEME.success }}>Dal (0.95)</span>
                </div>
                <div className="absolute top-[12%] left-[53%] w-[30%] h-[34%] border-2 rounded-lg animate-pulse" style={{ borderColor: THEME.accent, backgroundColor: 'rgba(217, 164, 65, 0.2)' }}>
                  <span className="absolute -top-6 right-0 text-[10px] font-mono px-2 py-0.5 rounded text-white" style={{ backgroundColor: THEME.accent }}>Rice (0.93)</span>
                </div>
                <div className="absolute top-[56%] left-[16%] w-[44%] h-[24%] border-2 rounded-lg animate-pulse" style={{ borderColor: '#D9A441', backgroundColor: 'rgba(217, 164, 65, 0.2)' }}>
                  <span className="absolute -bottom-6 left-0 text-[10px] font-mono px-2 py-0.5 rounded text-white" style={{ backgroundColor: '#D9A441' }}>Chapati (0.91)</span>
                </div>
              </div>
            )}
          </div>

          {/* Center divider lines */}
          <div className="absolute top-0 bottom-0 left-1/2 w-[2px] bg-gradient-to-b from-transparent via-white/60 to-transparent z-30" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
            <div className="w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-xl border-2 shadow-xl" style={{ backgroundColor: THEME.primary, borderColor: 'rgba(255,255,255,0.3)' }}>
              <ArrowRight size={20} className="text-white" />
            </div>
          </div>

          {/* After side (Right half with rounded right corners) */}
          <div
            className="relative w-1/2 rounded-r-3xl overflow-hidden cursor-pointer group"
            onMouseEnter={() => setHovered('after')}
            onMouseLeave={() => setHovered(null)}
          >
            <div
              className="absolute inset-0 transition-all duration-700 group-hover:scale-110"
              style={{ backgroundImage: `url(${afterImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent group-hover:from-black/55 transition-all duration-500" />
            <div className="absolute left-0 right-0 h-[2px] animate-scan opacity-60 z-10" style={{ backgroundColor: THEME.waste, boxShadow: `0 0 20px ${THEME.waste}`, animationDelay: '1s' }} />
            
            {hovered === 'after' && (
              <div className="absolute inset-0 pointer-events-none z-10">
                <div className="absolute top-[10%] left-[18%] w-[24%] h-[28%] border-2 rounded-lg animate-pulse" style={{ borderColor: THEME.waste, backgroundColor: 'rgba(239, 68, 68, 0.2)' }}>
                  <span className="absolute -top-6 left-0 text-[10px] font-mono px-2 py-0.5 rounded text-white" style={{ backgroundColor: THEME.waste }}>Dal −40%</span>
                </div>
                <div className="absolute top-[10%] left-[52%] w-[30%] h-[30%] border-2 rounded-lg animate-pulse" style={{ borderColor: THEME.waste, backgroundColor: 'rgba(239, 68, 68, 0.2)' }}>
                  <span className="absolute -top-6 right-0 text-[10px] font-mono px-2 py-0.5 rounded text-white" style={{ backgroundColor: THEME.waste }}>Rice −55%</span>
                </div>
                <div className="absolute top-[50%] left-[20%] w-[34%] h-[26%] border-2 rounded-lg animate-pulse" style={{ borderColor: THEME.waste, backgroundColor: 'rgba(239, 68, 68, 0.2)' }}>
                  <span className="absolute -bottom-6 left-0 text-[10px] font-mono px-2 py-0.5 rounded text-white" style={{ backgroundColor: THEME.waste }}>Chapati −30%</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Decorative corner highlights */}
        <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 z-30" style={{ borderColor: 'rgba(255,255,255,0.4)' }} />
        <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 z-30" style={{ borderColor: 'rgba(255,255,255,0.4)' }} />
        <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 z-30" style={{ borderColor: 'rgba(255,255,255,0.4)' }} />
        <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 z-30" style={{ borderColor: 'rgba(255,255,255,0.4)' }} />

        {/* Floating Overlay Cards (Placed inside main container to render relative bottom, but sibling to halves so backdrop-filter blurs them perfectly) */}
        <div className="absolute bottom-8 left-8 z-30">
          <div 
            className="rounded-2xl px-6 py-4 border shadow-xl transition-all duration-300 hover:scale-105" 
            style={{ 
              backgroundColor: 'rgba(15, 38, 29, 0.45)', 
              borderColor: 'rgba(255,255,255,0.25)',
              backdropFilter: 'blur(36px)',
              WebkitBackdropFilter: 'blur(36px)'
            }}
          >
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-[0.2em] uppercase mb-2 text-white bg-[#D9A441]">T0 — Before</span>
            <h4 className="text-base font-bold text-white tracking-wide">Pre-Consumption</h4>
          </div>
        </div>

        <div className="absolute bottom-8 right-8 z-30">
          <div 
            className="rounded-2xl px-6 py-4 border shadow-xl transition-all duration-300 hover:scale-105" 
            style={{ 
              backgroundColor: 'rgba(56, 22, 15, 0.45)', 
              borderColor: 'rgba(255,255,255,0.25)',
              backdropFilter: 'blur(36px)',
              WebkitBackdropFilter: 'blur(36px)'
            }}
          >
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-[0.2em] uppercase mb-2 text-white bg-[#EF4444]">T1 — After</span>
            <h4 className="text-base font-bold text-white tracking-wide">Post-Consumption</h4>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlateComparison;
