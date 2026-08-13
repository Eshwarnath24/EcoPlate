import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Play, CheckCircle2, Terminal, ScanLine } from 'lucide-react';
import { THEME, MOCK_BEFORE, MOCK_AFTER, PIPELINE_STAGES, MOCK_LOGS } from '../theme';
import Button from '../components/Button';
import { NetworkVisualizer } from '../components/loaders';

// --- Upload Zone Sub-component (Compact for multi-table) ---
const UploadZone = ({ title, subtitle, image, onClick }) => (
  <div 
    onClick={onClick}
    className="relative group cursor-pointer h-44 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden hover:border-orange-500/60"
    style={{ borderColor: image ? THEME.primary : THEME.border, backgroundColor: THEME.surface }}
  >
    {image ? (
      <>
        <img src={image} alt={title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center text-xs font-mono">
          <span className="px-2 py-0.5 rounded backdrop-blur-md font-bold shadow-sm text-[10px]" style={{ backgroundColor: `${THEME.success}90`, color: '#fff' }}>SYNCED</span>
          <span className="px-2 py-0.5 rounded backdrop-blur-md text-[10px]" style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: 'rgba(255,255,255,0.8)' }}>4K ✓</span>
        </div>
      </>
    ) : (
      <div className="text-center p-4 transition-colors relative z-10 flex flex-col items-center" style={{ color: THEME.textMuted }}>
        <div className="w-12 h-12 rounded-full border flex items-center justify-center mb-3 transition-colors group-hover:shadow-md" style={{ backgroundColor: `${THEME.primary}10`, borderColor: THEME.border }}>
          <Camera size={20} style={{ color: THEME.primary }} />
        </div>
        <h3 className="font-bold text-xs mb-0.5" style={{ color: THEME.text }}>{title}</h3>
        <p className="text-[10px] font-mono opacity-80">{subtitle}</p>
      </div>
    )}
  </div>
);

// --- Upload Flow (6 Tables with Before/After) ---
const UploadFlow = ({ images, setImages, onAnalyze }) => {
  const handleMockUpload = (tableIdx, type) => {
    setImages(prev => prev.map((table, i) => 
      i === tableIdx 
        ? { ...table, [type]: type === 'before' ? MOCK_BEFORE : MOCK_AFTER }
        : table
    ));
  };

  const completedTables = images.filter(t => t.before && t.after).length;
  const isReady = completedTables >= 1; // At least 1 table must have both scans

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in slide-in-from-bottom-12 duration-700 fade-in pt-10">
      {/* Header */}
      <div className="text-center space-y-5 mb-8 p-8 rounded-3xl flex flex-col items-center w-full backdrop-blur-md border shadow-sm mx-auto max-w-4xl" style={{ backgroundColor: THEME.surface, borderColor: THEME.border }}>
        <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border font-semibold text-xs tracking-[0.2em] uppercase shadow-sm" style={{ borderColor: `${THEME.primary}40`, backgroundColor: `${THEME.primary}10`, color: THEME.primary }}>
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: THEME.primary }} />
          POS Sync — Multi-Table
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight" style={{ color: THEME.text }}>Table Scans</h2>
        <p className="max-w-2xl mx-auto text-base font-bold leading-relaxed" style={{ color: THEME.textMuted }}>
          Sync the service-out plate with the dish-return plate for each table. Click on each zone to scan.
        </p>
        {/* Progress Counter */}
        <div className="flex items-center gap-3 mt-2">
          <div className="flex gap-1.5">
            {images.map((t, i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full transition-all duration-500"
                style={{
                  backgroundColor: t.before && t.after ? THEME.primary : t.before || t.after ? `${THEME.primary}50` : THEME.border,
                  boxShadow: t.before && t.after ? `0 0 8px ${THEME.primary}80` : 'none'
                }}
              />
            ))}
          </div>
          <span className="text-xs font-mono font-bold" style={{ color: THEME.textMuted }}>
            {completedTables}/6 TABLES READY
          </span>
        </div>
      </div>

      {/* 6 Table Rows */}
      <div className="space-y-5">
        {images.map((table, idx) => {
          const isComplete = table.before && table.after;
          return (
            <div 
              key={table.id} 
              className={`rounded-2xl border backdrop-blur-md p-4 transition-all duration-500 ${isComplete ? 'border-orange-500/40' : ''}`}
              style={{ 
                backgroundColor: isComplete ? `${THEME.surface}` : THEME.surface, 
                borderColor: isComplete ? undefined : THEME.border,
                boxShadow: isComplete ? `0 0 20px rgba(234, 88, 12, 0.08)` : 'none'
              }}
            >
              <div className="flex items-center gap-4 mb-3">
                {/* Table Number Badge */}
                <div 
                  className="w-9 h-9 rounded-lg flex items-center justify-center font-mono font-black text-sm shrink-0 border transition-all"
                  style={{ 
                    backgroundColor: isComplete ? THEME.primary : `${THEME.primary}15`,
                    color: isComplete ? '#fff' : THEME.primary,
                    borderColor: isComplete ? THEME.primary : `${THEME.primary}40`,
                    boxShadow: isComplete ? `0 0 12px ${THEME.primary}60` : 'none'
                  }}
                >
                  T{table.id}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm" style={{ color: THEME.text }}>Table {table.id}</h3>
                  <p className="text-[11px] font-mono" style={{ color: THEME.textMuted }}>
                    {isComplete ? '✓ Both scans synced' : table.before || table.after ? 'Partial — 1 scan remaining' : 'Awaiting scans'}
                  </p>
                </div>
                {isComplete && (
                  <div className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold tracking-wider" style={{ backgroundColor: `${THEME.success}20`, color: THEME.success, border: `1px solid ${THEME.success}40` }}>
                    READY
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <UploadZone 
                  title={`Service-Out (T0)`} 
                  subtitle={`Table ${table.id} — Before`} 
                  image={table.before} 
                  onClick={() => handleMockUpload(idx, 'before')} 
                />
                <UploadZone 
                  title={`Plate-Return (T1)`} 
                  subtitle={`Table ${table.id} — After`} 
                  image={table.after} 
                  onClick={() => handleMockUpload(idx, 'after')} 
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Button */}
      <div className="flex justify-center pt-6 pb-8">
        <Button onClick={onAnalyze} disabled={!isReady} className="w-full md:w-auto px-12 py-4">
          {isReady ? `Initialize Kitchen AI (${completedTables} Table${completedTables > 1 ? 's' : ''})` : 'Awaiting POS Ticket Scans'} <ScanLine size={18} className={isReady ? 'animate-pulse' : ''} />
        </Button>
      </div>
    </div>
  );
};

// --- Pipeline Visualization (The AI Engine) ---
// Note: Matches the Sleek Dark theme of the whole app now
const PipelineVisualization = ({ onComplete }) => {
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [pulseTick, setPulseTick] = useState(0);
  const [logs, setLogs] = useState([]);
  const logsEndRef = useRef(null);

  // Auto-advance stages
  useEffect(() => {
    if (currentStageIdx >= PIPELINE_STAGES.length) {
      const timer = setTimeout(onComplete, 2000);
      return () => clearTimeout(timer);
    }
    const stageTime = 3000;
    const timer = setTimeout(() => setCurrentStageIdx(prev => prev + 1), stageTime);
    
    const stageId = PIPELINE_STAGES[currentStageIdx]?.id;
    const stageLogs = MOCK_LOGS[stageId] || [];
    let logIdx = 0;
    const logInterval = setInterval(() => {
      if(logIdx < stageLogs.length) {
        setLogs(prev => [...prev, stageLogs[logIdx]]);
        logIdx++;
      }
    }, stageTime / (stageLogs.length + 1 || 1));

    return () => {
      clearTimeout(timer);
      clearInterval(logInterval);
    };
  }, [currentStageIdx, onComplete]);

  useEffect(() => {
    const ticker = setInterval(() => setPulseTick(p => p + 1), 150);
    return () => clearInterval(ticker);
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const stage = PIPELINE_STAGES[currentStageIdx] || { id: 'done', name: 'Analysis Complete', details: 'Aggregating waste costs.' };
  const progressPercent = Math.min(100, (currentStageIdx / PIPELINE_STAGES.length) * 100);

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-[85vh] min-h-[700px] rounded-xl border overflow-hidden animate-in zoom-in-95 duration-700 shadow-2xl" style={{ borderColor: THEME.border, backgroundColor: THEME.bg }}>
      
      {/* Top Header */}
      <div className="flex-none border-b px-4 py-3 flex justify-between items-center relative" style={{ backgroundColor: THEME.surface, borderColor: THEME.border }}>
        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 h-[2px] transition-all duration-1000" style={{ width: `${progressPercent}%`, backgroundColor: THEME.primary }} />
        
        <div className="flex items-center gap-4">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: THEME.waste }} />
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: THEME.accent }} />
            <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: THEME.success, boxShadow: `0 0 8px ${THEME.success}80` }} />
          </div>
          <span className="font-mono text-xs tracking-widest font-bold" style={{ color: THEME.textMuted }}>KITCHEN // AI_RUNNER</span>
        </div>
        <div className="font-mono text-[10px]" style={{ color: THEME.textMuted }}>
          TICKET: 402-A | LAT: {((Math.random() * 10) + 10).toFixed(1)}ms
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Stage Pipeline Steps */}
        <div className="w-64 shrink-0 border-r p-5 flex flex-col justify-center relative overflow-hidden" style={{ backgroundColor: THEME.surface, borderColor: THEME.border }}>
          {/* Faint background grid */}
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, ${THEME.border} 1px, transparent 0)`, backgroundSize: '20px 20px' }} />
          
          <div className="space-y-6 relative z-10">
            <div className="absolute left-[9px] top-4 bottom-4 w-[1px] -z-10" style={{ backgroundColor: THEME.border }} />
            
            {PIPELINE_STAGES.map((s, i) => {
              const isActive = i === currentStageIdx;
              const isPast = i < currentStageIdx;
              return (
                <div key={s.id} className={`flex items-start gap-4 transition-all duration-500 ${isActive ? 'opacity-100 scale-105 translate-x-2' : isPast ? 'opacity-50' : 'opacity-20'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all duration-500`}
                    style={{
                      backgroundColor: isActive ? THEME.primary : isPast ? `${THEME.primary}40` : THEME.surface,
                      border: isActive ? 'none' : isPast ? 'none' : `1px solid ${THEME.textMuted}`,
                      boxShadow: isActive ? `0 0 15px ${THEME.primary}80` : 'none',
                    }}
                  >
                    {isPast ? <CheckCircle2 size={10} color="#fff" /> : <span className="text-[9px] font-bold" style={{ color: isActive ? '#fff' : THEME.textMuted }}>{i+1}</span>}
                  </div>
                  <div>
                    <h4 className="font-mono font-semibold text-xs tracking-wider mb-1" style={{ color: isActive ? THEME.primary : THEME.textMuted }}>{s.name}</h4>
                    {isActive && <p className="text-[10px] leading-relaxed animate-in slide-in-from-left-2" style={{ color: THEME.text }}>{s.details}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Area: Viz + Terminal */}
        <div className="flex-1 flex flex-col relative" style={{ backgroundColor: THEME.bg }}>
          
          {/* Main SVG Visualizer */}
          <div className="flex-1 relative overflow-hidden flex items-center justify-center p-3">
            {/* Dual Image Background */}
            <div className="absolute inset-0 flex transition-opacity duration-1000" style={{ opacity: currentStageIdx < PIPELINE_STAGES.length ? 0.15 : 0.05 }}>
              <div 
                className="w-1/2 h-full grayscale transition-all duration-1000"
                style={{ 
                  backgroundImage: `url(${MOCK_BEFORE})`, 
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  filter: (currentStageIdx === 0 || currentStageIdx === 1) ? 'contrast(200%) brightness(150%) blur(4px)' : 'blur(2px)',
                  mixBlendMode: 'screen',
                }}
              />
              <div 
                className="w-1/2 h-full grayscale transition-all duration-1000"
                style={{ 
                  backgroundImage: `url(${MOCK_AFTER})`, 
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  filter: (currentStageIdx === 3 || currentStageIdx === 4) ? 'contrast(200%) brightness(150%) blur(4px)' : 'blur(2px)',
                  mixBlendMode: 'screen',
                }}
              />
              <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, transparent 30%, ${THEME.bg} 50%, transparent 70%)` }} />
            </div>
            {/* T0/T1 labels */}
            <div className="absolute top-3 left-4 text-[9px] font-mono tracking-widest font-bold" style={{ color: THEME.textMuted }}>T0 [SERVICE-OUT]</div>
            <div className="absolute top-3 right-4 text-[9px] font-mono tracking-widest font-bold" style={{ color: THEME.textMuted }}>T1 [PLATE-RETURN]</div>
            
            <NetworkVisualizer stageId={stage.id} tick={pulseTick} />
          </div>

          {/* POS Ticket Printer Output */}
          <div className="h-40 shrink-0 border-t relative flex flex-col" style={{ borderColor: THEME.border }}>
            {/* Receipt Paper */}
            <div 
              className="flex-1 overflow-y-auto px-5 pt-4 pb-6 font-mono text-[11px] sm:text-xs"
              style={{ 
                backgroundColor: '#faf6f0',
                color: '#1a1a1a',
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(0,0,0,0.04) 19px, rgba(0,0,0,0.04) 20px)',
              }}
            >
              {/* Receipt Header */}
              <div className="text-center mb-3 pb-2" style={{ borderBottom: '2px dashed #ccc' }}>
                <div className="font-bold text-sm tracking-widest">🍽️ ECOPLATE POS</div>
                <div className="text-[10px] text-gray-500 mt-1">KITCHEN AI — LIVE RECEIPT</div>
              </div>

              {logs.map((log, i) => {
                if (!log) return null;
                const logStr = typeof log === 'string' ? log : JSON.stringify(log);
                const isCost = logStr.includes('[Cost]') || logStr.includes('[SYS]');
                const isLast = i === logs.length - 1;
                
                return (
                  <div 
                    key={i} 
                    className={`mb-1.5 flex gap-2 ${isLast ? 'animate-[printLine_0.15s_ease-out]' : ''}`}
                    style={{ 
                      animationFillMode: 'forwards',
                    }}
                  >
                    <span className="text-gray-400 shrink-0 select-none">{String(i + 1).padStart(3, '0')}</span>
                    <span style={{ 
                      color: isCost ? '#b45309' : '#374151', 
                      fontWeight: isCost ? 'bold' : 'normal',
                      textDecoration: isCost ? 'underline' : 'none',
                      textDecorationStyle: isCost ? 'dotted' : undefined,
                    }}>
                      {logStr}
                    </span>
                  </div>
                );
              })}
              <div ref={logsEndRef} />
            </div>

            {/* Torn/Jagged Edge at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-4 overflow-hidden pointer-events-none" style={{ zIndex: 10 }}>
              <svg width="100%" height="16" preserveAspectRatio="none" viewBox="0 0 200 16" className="block">
                <path 
                  d="M0,0 L5,12 L10,2 L15,14 L20,4 L25,11 L30,1 L35,13 L40,3 L45,12 L50,2 L55,14 L60,4 L65,11 L70,1 L75,13 L80,3 L85,12 L90,2 L95,14 L100,4 L105,11 L110,1 L115,13 L120,3 L125,12 L130,2 L135,14 L140,4 L145,11 L150,1 L155,13 L160,3 L165,12 L170,2 L175,14 L180,4 L185,11 L190,1 L195,13 L200,3 L200,16 L0,16 Z" 
                  fill="#faf6f0" 
                />
              </svg>
            </div>

            {/* Printer Animation Keyframes */}
            <style>{`
              @keyframes printLine {
                0% { transform: translateY(-8px); opacity: 0; }
                40% { transform: translateX(1px) translateY(0); opacity: 0.7; }
                60% { transform: translateX(-1px); opacity: 0.9; }
                80% { transform: translateX(0.5px); opacity: 1; }
                100% { transform: translateX(0) translateY(0); opacity: 1; }
              }
            `}</style>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Analysis Page ---
const AnalysisPage = ({ images, setImages }) => {
  const [step, setStep] = useState('upload');
  const navigate = useNavigate();

  return (
    <>
      {step === 'upload' && (
        <UploadFlow images={images} setImages={setImages} onAnalyze={() => setStep('analyzing')} />
      )}
      {step === 'analyzing' && (
        <PipelineVisualization onComplete={() => navigate('/report')} />
      )}
    </>
  );
};

export default AnalysisPage;
