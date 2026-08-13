import React, { useState, useEffect } from 'react';
import { ArrowRight, Layers, TrendingDown, Utensils, DollarSign, ChefHat } from 'lucide-react';
import { THEME, MOCK_BEFORE, MOCK_AFTER, MOCK_RESULTS } from '../theme';
import { useCounter } from '../hooks';
import Button from '../components/Button';

// --- Helper for Thermal/Burner Heat Colors ---
const getThermalStyles = (wastePercent) => {
  if (wastePercent >= 60) return { color: '#ef4444', glow: 'rgba(239, 68, 68, 0.9)', glowRadius: '35px', label: 'CRITICAL HEAT', isCritical: true, containerBg: '#09090b', consumedBg: 'transparent' }; // Red Hot - completely charred
  if (wastePercent >= 40) return { color: '#f97316', glow: 'rgba(249, 115, 22, 0.7)', glowRadius: '20px', label: 'HIGH HEAT', containerBg: '#18181b', consumedBg: 'rgba(255,255,255,0.03)' }; // Orange - dark scorch
  if (wastePercent >= 20) return { color: '#eab308', glow: 'rgba(234, 179, 8, 0.4)', glowRadius: '10px', label: 'WARM', containerBg: '#27272a', consumedBg: 'rgba(255,255,255,0.06)' }; // Yellow - medium scorch
  return { color: '#06b6d4', glow: 'rgba(6, 182, 212, 0.2)', glowRadius: '5px', label: 'COOL SAFE', containerBg: THEME.surface, consumedBg: 'rgba(255,255,255,0.1)' }; // Cyan/Blue - no scorch
};

// --- Sub-component for animated result bars ---
const WasteBarItem = ({ item, delay, isHighest }) => {
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  // Convert waste percentage to an arbitrary mock dollar amount for the theme
  const wasteCost = (item.waste * 0.05).toFixed(2);
  const thermal = getThermalStyles(item.waste);

  return (
    <div className={`space-y-4 transition-all duration-700 ease-out ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-3">
          <div className="font-bold text-lg" style={{ color: THEME.text }}>{item.name}</div>
          <div className="text-xs font-mono px-2 py-1 rounded-md" style={{ color: thermal.color, borderColor: `${thermal.color}40`, border: '1px solid', backgroundColor: `${thermal.color}10` }}>
            {thermal.label}
          </div>
        </div>
        <div className="font-mono font-bold text-lg" style={{ color: thermal.color, textShadow: `0 0 10px ${thermal.glow}` }}>
          {show ? item.waste : 0}% Loss (${show ? wasteCost : '0.00'})
        </div>
      </div>
      
      {/* Progress Bar with Thermal Glow & Scorch Effect */}
      <div className={`h-5 w-full rounded-full overflow-hidden flex relative border transition-all duration-1000 ${isHighest ? 'ring-2 ring-orange-500/50 ring-offset-2 ring-offset-[#09090b]' : ''}`} 
           style={{ 
             backgroundColor: thermal.containerBg, // Fades from black to gray based on heat
             borderColor: isHighest ? '#ea580c' : (thermal.isCritical ? '#f97316' : THEME.border), // Lava border for highest
             boxShadow: isHighest ? 'inset 0 0 10px rgba(0,0,0,0.9), 0 0 15px rgba(234, 88, 12, 0.6)' : (thermal.isCritical ? 'inset 0 0 8px rgba(0,0,0,0.8), 0 0 5px rgba(249, 115, 22, 0.3)' : 'none')
           }}>
        {/* The Consumed Part (Empty shade that fades) */}
        <div 
          className="h-full transition-all duration-1000 ease-out" 
          style={{ width: show ? `${100 - item.waste}%` : '0%', backgroundColor: thermal.consumedBg }} 
        />
        {/* The Wasted Part (Hot/Molten Edge) */}
        <div 
          className={`h-full transition-all duration-1000 ease-out relative overflow-hidden ${thermal.isCritical ? 'animate-[flicker_0.15s_infinite_alternate]' : ''}`} 
          style={{ 
            width: show ? `${item.waste}%` : '0%', 
            backgroundColor: thermal.color,
            // Intense molten edge for highest/critical
            boxShadow: `0 0 ${thermal.glowRadius} ${thermal.glow}${isHighest || thermal.isCritical ? ', inset 0 0 6px #fef08a, inset 0 0 12px #ea580c, -2px 0 8px rgba(239, 68, 68, 0.8)' : ''}`,
            zIndex: thermal.isCritical ? 10 : 1
          }} 
        >
           {/* Animated Heat Shimmer */}
           <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full ${thermal.isCritical ? 'animate-[shimmer_0.8s_infinite]' : 'animate-[shimmer_1.5s_infinite]'}`} />
           {item.waste >= 60 && (
             <div className="absolute inset-0 bg-black/10 animate-[pulse_0.4s_infinite]" />
           )}
        </div>
      </div>
      
      <div className="flex justify-between text-xs font-mono" style={{ color: THEME.textMuted }}>
        <span>Plated Vol: {item.volStart}g</span>
        <span>Consumed: -{item.volStart - item.volEnd}g</span>
        <span style={{ color: thermal.color }}>Wasted Vol: {item.volEnd}g</span>
      </div>
      
      <style>{`
        @keyframes shimmer { 100% { transform: translateX(100%); } }
        @keyframes flicker {
          0% { opacity: 0.9; filter: brightness(1); }
          100% { opacity: 1; filter: brightness(1.4); }
        }
      `}</style>
    </div>
  );
};

// --- Report Page (Results Dashboard) ---
const ReportPage = ({ onReset }) => {
  const overallScore = useCounter(MOCK_RESULTS.overall, 1500);
  
  return (
    <div className="max-w-7xl mx-auto space-y-14 animate-in slide-in-from-bottom-12 duration-1000 fade-in pt-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b pb-8" style={{ borderColor: THEME.border }}>
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: THEME.success }} />
            <span className="text-sm font-mono uppercase tracking-widest font-bold" style={{ color: THEME.success }}>Analysis Complete</span>
          </div>
          <h2 className="text-5xl font-bold tracking-tight" style={{ color: THEME.text }}>Executive Chef Dashboard</h2>
        </div>
        <div className="font-mono text-sm mt-4 md:mt-0 text-right font-bold" style={{ color: THEME.textMuted }}>
          <p>TICKET_ID: #402-A</p>
          <p>STATION: Expeditor-1</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Column: Overall Score & Context */}
        <div className="space-y-8">
          {/* Main Score Card */}
          <div className="rounded-2xl p-10 border relative overflow-hidden group shadow-lg" style={{ backgroundColor: THEME.surface, borderColor: THEME.border }}>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(135deg, ${THEME.waste}20, transparent)` }} />
            <h3 className="text-base font-semibold mb-4 uppercase tracking-widest" style={{ color: THEME.textMuted }}>Total Financial Loss</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-light" style={{ color: THEME.textMuted }}>$</span>
              <div className="text-8xl font-light tracking-tighter" style={{ color: overallScore > 30 ? THEME.waste : THEME.text }}>
                {((overallScore * 0.12)).toFixed(2)}
              </div>
            </div>
            <p className="text-sm mt-6 font-mono" style={{ color: THEME.textMuted }}>Financial waste calculated from volumetric discrepancy against standard recipe costs.</p>
          </div>

          {/* Summary Stats */}
          <div className="rounded-2xl p-8 border shadow-sm" style={{ backgroundColor: THEME.surface, borderColor: THEME.border }}>
            <h3 className="text-base font-bold mb-6" style={{ color: THEME.text }}>Ticket Summary</h3>
            <div className="space-y-5">
              {[
                { label: 'Menu Item Matched', value: 'Thali Special', icon: <Utensils size={18} /> },
                { label: 'Highest Cost Loss', value: 'Chapati ($3.50)', icon: <TrendingDown size={18} /> },
                { label: 'Efficiency Rating', value: 'Needs Optimization', icon: <DollarSign size={18} /> },
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-4 py-2">
                  <div className="w-10 h-10 rounded-lg border flex items-center justify-center shrink-0" style={{ backgroundColor: `${THEME.primary}10`, borderColor: THEME.border, color: THEME.primary }}>
                    {stat.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-mono" style={{ color: THEME.textMuted }}>{stat.label}</div>
                    <div className="font-semibold text-sm" style={{ color: THEME.text }}>{stat.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reference Images */}
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-3">
              <div className="text-xs font-mono uppercase font-semibold" style={{ color: THEME.textMuted }}>
                Service Out
              </div>
              <img src={MOCK_BEFORE} alt="Before" className="w-full h-44 object-cover rounded-xl border shadow-sm hover:shadow-md transition-shadow" style={{ borderColor: THEME.border }} />
            </div>
            <div className="space-y-3">
              <div className="text-xs font-mono uppercase font-semibold" style={{ color: THEME.textMuted }}>
                Plate Return
              </div>
              <img src={MOCK_AFTER} alt="After" className="w-full h-44 object-cover rounded-xl border shadow-sm hover:shadow-md transition-shadow" style={{ borderColor: THEME.border }} />
            </div>
          </div>
        </div>

        {/* Right Column: Deep Breakdown */}
        <div className="md:col-span-2 rounded-2xl p-10 border shadow-lg" style={{ backgroundColor: THEME.surface, borderColor: THEME.border }}>
          <div className="flex justify-between items-center mb-10 border-b pb-5" style={{ borderColor: THEME.border }}>
            <h3 className="text-xl font-bold flex items-center gap-3" style={{ color: THEME.text }}>
              <Layers size={22} style={{ color: THEME.primary }} /> Ingredient Cost Breakdown
            </h3>
            <span className="text-xs font-mono px-3 py-1.5 rounded-md font-bold" style={{ backgroundColor: THEME.bg, color: THEME.textMuted, border: `1px solid ${THEME.border}` }}>Sort: Highest Loss</span>
          </div>
          
          <div className="space-y-10">
            {MOCK_RESULTS.items.sort((a,b) => b.waste - a.waste).map((item, idx) => (
              <WasteBarItem key={idx} item={item} delay={idx * 200} isHighest={idx === 0} />
            ))}
          </div>

          <div className="mt-14 pt-8 border-t flex justify-end gap-5" style={{ borderColor: THEME.border }}>
            <Button onClick={() => window.print()} variant="outline" className="px-8 py-4 text-base">
              Export POS Receipt
            </Button>
            <Button onClick={onReset} className="px-10 py-4 text-base">
              Scan Next Ticket <ArrowRight size={18}/>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPage;
