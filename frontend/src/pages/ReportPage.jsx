import React, { useState, useEffect } from 'react';
import { ArrowRight, Layers } from 'lucide-react';
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
    <div className={`space-y-3 transition-all duration-700 ease-out ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-3">
          <div className="font-semibold text-white">{item.name}</div>
          <div className="text-[10px] font-mono text-blue-400 border border-blue-400/30 bg-blue-400/10 px-1.5 py-0.5 rounded">
            conf: {item.conf}
          </div>
        </div>
        <div className="font-mono font-semibold" style={{ color: item.waste > 40 ? THEME.waste : THEME.text }}>
          {show ? item.waste : 0}% Waste
        </div>
      </div>
      
      {/* Progress Bar Container - styled like Vercel metrics */}
      <div className="h-2 w-full bg-[#1A1A1A] rounded-full overflow-hidden flex relative shadow-inner">
        {/* Consumed part */}
        <div 
          className="h-full transition-all duration-1000 ease-out bg-white/20" 
          style={{ width: show ? `${100 - item.waste}%` : '0%' }} 
        />
        {/* Wasted part */}
        <div 
          className="h-full transition-all duration-1000 ease-out relative overflow-hidden" 
          style={{ width: show ? `${item.waste}%` : '0%', backgroundColor: THEME.waste }} 
        >
           {/* Animated shine on the waste part */}
           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        </div>
      </div>
      
      <div className="flex justify-between text-[10px] text-gray-500 font-mono">
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
    <div className="max-w-5xl mx-auto space-y-12 animate-in slide-in-from-bottom-12 duration-1000 fade-in pt-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b pb-6" style={{ borderColor: THEME.border }}>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-mono text-green-500 uppercase tracking-widest">Inference Complete</span>
          </div>
          <h2 className="text-4xl font-semibold tracking-tight text-white">Analytics Report</h2>
        </div>
        <div className="font-mono text-xs text-gray-500 mt-4 md:mt-0 text-right">
          <p>SESSION_ID: {Math.random().toString(36).substring(7).toUpperCase()}</p>
          <p>LATENCY: 14.2s (GPU)</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Column: Overall Score & Context */}
        <div className="space-y-6">
          {/* Main Score Card */}
          <div className="bg-[#0A0A0A] rounded-2xl p-8 border relative overflow-hidden group" style={{ borderColor: THEME.borderHighlight }}>
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-widest">Total Estimated Waste</h3>
            <div className="flex items-baseline gap-2">
              <div className="text-7xl font-light tracking-tighter" style={{ color: overallScore > 30 ? THEME.waste : THEME.text }}>
                {overallScore}
              </div>
              <span className="text-2xl text-gray-500">%</span>
            </div>
            <p className="text-xs text-gray-500 mt-4 font-mono">Volume computed via spatial mask intersection.</p>
          </div>

          {/* Reference Images */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-[10px] font-mono text-gray-500 uppercase flex justify-between">
                <span>Input (T0)</span>
                <span>[1,3,H,W]</span>
              </div>
              <img src={MOCK_BEFORE} alt="Before" className="w-full h-32 object-cover rounded-lg border border-white/10 opacity-70 hover:opacity-100 transition-opacity" />
            </div>
            <div className="space-y-2">
              <div className="text-[10px] font-mono text-gray-500 uppercase flex justify-between">
                <span>Target (T1)</span>
                <span>[1,3,H,W]</span>
              </div>
              <img src={MOCK_AFTER} alt="After" className="w-full h-32 object-cover rounded-lg border border-white/10 opacity-70 hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>

        {/* Right Column: Deep Breakdown */}
        <div className="md:col-span-2 bg-[#0A0A0A] rounded-2xl p-8 border" style={{ borderColor: THEME.borderHighlight }}>
          <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Layers size={18} className="text-blue-400" /> Item-wise Classification Matrix
            </h3>
            <span className="text-xs font-mono bg-white/5 px-2 py-1 rounded text-gray-400">Sort: Confidence (Desc)</span>
          </div>
          
          <div className="space-y-8">
            {MOCK_RESULTS.items.map((item, idx) => (
              <WasteBarItem key={idx} item={item} delay={idx * 200} />
            ))}
          </div>

          <div className="mt-12 pt-6 border-t flex justify-end gap-4" style={{ borderColor: THEME.border }}>
            <Button onClick={() => window.print()} variant="outline" className="px-6">
              Export CSV
            </Button>
            <Button onClick={onReset} className="px-8">
              Run New Inference <ArrowRight size={16}/>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPage;
