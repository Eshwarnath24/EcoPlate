import React, { useState, useEffect } from 'react';
import { ArrowRight, Layers, TrendingDown, Utensils } from 'lucide-react';
import { THEME, MOCK_BEFORE, MOCK_AFTER, MOCK_RESULTS } from '../theme';
import { useCounter } from '../hooks';
import Button from '../components/Button';

// --- Sub-component for animated result bars ---
const WasteBarItem = ({ item, delay }) => {
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div className={`space-y-4 transition-all duration-700 ease-out ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-3">
          <div className="font-bold text-lg" style={{ color: THEME.text }}>{item.name}</div>
          <div className="text-xs font-mono px-2 py-1 rounded-md" style={{ color: THEME.primary, borderColor: `${THEME.primary}30`, border: '1px solid', backgroundColor: `${THEME.primary}08` }}>
            conf: {item.conf}
          </div>
        </div>
        <div className="font-mono font-bold text-lg" style={{ color: item.waste > 40 ? THEME.waste : THEME.text }}>
          {show ? item.waste : 0}% Waste
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="h-4 w-full rounded-full overflow-hidden flex relative" style={{ backgroundColor: THEME.border }}>
        <div 
          className="h-full transition-all duration-1000 ease-out rounded-l-full" 
          style={{ width: show ? `${100 - item.waste}%` : '0%', backgroundColor: `${THEME.success}40` }} 
        />
        <div 
          className="h-full transition-all duration-1000 ease-out relative overflow-hidden rounded-r-full" 
          style={{ width: show ? `${item.waste}%` : '0%', backgroundColor: THEME.waste }} 
        >
           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        </div>
      </div>
      
      <div className="flex justify-between text-xs font-mono" style={{ color: THEME.textMuted }}>
        <span>T0 Vol: {item.volStart}g</span>
        <span>Delta: -{item.volStart - item.volEnd}g</span>
        <span>T1 Vol (Waste): {item.volEnd}g</span>
      </div>
      
      <style>{`@keyframes shimmer { 100% { transform: translateX(100%); } }`}</style>
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
            <span className="text-sm font-mono uppercase tracking-widest" style={{ color: THEME.success }}>Analysis Complete</span>
          </div>
          <h2 className="text-5xl font-bold tracking-tight" style={{ color: THEME.text }}>Analytics Report</h2>
        </div>
        <div className="font-mono text-sm mt-4 md:mt-0 text-right" style={{ color: THEME.textMuted }}>
          <p>SESSION_ID: {Math.random().toString(36).substring(7).toUpperCase()}</p>
          <p>LATENCY: 14.2s</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Column: Overall Score & Context */}
        <div className="space-y-8">
          {/* Main Score Card */}
          <div className="rounded-2xl p-10 border relative overflow-hidden group shadow-sm" style={{ backgroundColor: THEME.surface, borderColor: THEME.border }}>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(135deg, ${THEME.waste}10, transparent)` }} />
            <h3 className="text-base font-semibold mb-4 uppercase tracking-widest" style={{ color: THEME.textMuted }}>Total Estimated Waste</h3>
            <div className="flex items-baseline gap-3">
              <div className="text-8xl font-light tracking-tighter" style={{ color: overallScore > 30 ? THEME.waste : THEME.text }}>
                {overallScore}
              </div>
              <span className="text-3xl" style={{ color: THEME.textMuted }}>%</span>
            </div>
            <p className="text-sm mt-6 font-mono" style={{ color: THEME.textMuted }}>Volume computed via spatial mask intersection.</p>
          </div>

          {/* Summary Stats */}
          <div className="rounded-2xl p-8 border shadow-sm" style={{ backgroundColor: THEME.surface, borderColor: THEME.border }}>
            <h3 className="text-base font-bold mb-6" style={{ color: THEME.text }}>Quick Summary</h3>
            <div className="space-y-5">
              {[
                { label: 'Items Detected', value: '5 classes', icon: <Utensils size={18} /> },
                { label: 'Highest Waste', value: 'Chapati (70%)', icon: <TrendingDown size={18} /> },
                { label: 'Lowest Waste', value: 'Vegetables (18%)', icon: <Layers size={18} /> },
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-4 py-2">
                  <div className="w-10 h-10 rounded-lg border flex items-center justify-center shrink-0" style={{ backgroundColor: `${THEME.primary}08`, borderColor: THEME.border, color: THEME.primary }}>
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
                Before (T0)
              </div>
              <img src={MOCK_BEFORE} alt="Before" className="w-full h-44 object-cover rounded-xl border shadow-sm hover:shadow-md transition-shadow" style={{ borderColor: THEME.border }} />
            </div>
            <div className="space-y-3">
              <div className="text-xs font-mono uppercase font-semibold" style={{ color: THEME.textMuted }}>
                After (T1)
              </div>
              <img src={MOCK_AFTER} alt="After" className="w-full h-44 object-cover rounded-xl border shadow-sm hover:shadow-md transition-shadow" style={{ borderColor: THEME.border }} />
            </div>
          </div>
        </div>

        {/* Right Column: Deep Breakdown */}
        <div className="md:col-span-2 rounded-2xl p-10 border shadow-sm" style={{ backgroundColor: THEME.surface, borderColor: THEME.border }}>
          <div className="flex justify-between items-center mb-10 border-b pb-5" style={{ borderColor: THEME.border }}>
            <h3 className="text-xl font-bold flex items-center gap-3" style={{ color: THEME.text }}>
              <Layers size={22} style={{ color: THEME.primary }} /> Item-wise Breakdown
            </h3>
            <span className="text-xs font-mono px-3 py-1.5 rounded-md" style={{ backgroundColor: `${THEME.primary}08`, color: THEME.textMuted }}>Sort: Confidence (Desc)</span>
          </div>
          
          <div className="space-y-10">
            {MOCK_RESULTS.items.map((item, idx) => (
              <WasteBarItem key={idx} item={item} delay={idx * 200} />
            ))}
          </div>

          <div className="mt-14 pt-8 border-t flex justify-end gap-5" style={{ borderColor: THEME.border }}>
            <Button onClick={() => window.print()} variant="outline" className="px-8 py-4 text-base">
              Export CSV
            </Button>
            <Button onClick={onReset} className="px-10 py-4 text-base">
              Analyze Again <ArrowRight size={18}/>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPage;
