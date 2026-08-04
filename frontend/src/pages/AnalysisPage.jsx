import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Play, CheckCircle2, Terminal, ScanLine } from 'lucide-react';
import { THEME, MOCK_BEFORE, MOCK_AFTER, PIPELINE_STAGES, MOCK_LOGS } from '../theme';
import Button from '../components/Button';
import { NetworkVisualizer } from '../components/loaders';

// --- Upload Zone Sub-component ---
const UploadZone = ({ title, subtitle, image, onClick }) => (
  <div 
    onClick={onClick}
    className="relative group cursor-pointer h-80 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden"
    style={{ borderColor: image ? THEME.primary : THEME.border, backgroundColor: THEME.surface }}
  >
    {image ? (
      <>
        <img src={image} alt={title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center text-xs font-mono">
          <span className="px-2 py-1 rounded backdrop-blur-md font-bold shadow-sm" style={{ backgroundColor: `${THEME.success}90`, color: '#fff' }}>SYNCED</span>
          <span className="px-2 py-1 rounded backdrop-blur-md" style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: 'rgba(255,255,255,0.8)' }}>RES: 4K (PASS)</span>
        </div>
      </>
    ) : (
      <div className="text-center p-6 transition-colors relative z-10 flex flex-col items-center" style={{ color: THEME.textMuted }}>
        <div className="w-16 h-16 rounded-full border flex items-center justify-center mb-4 transition-colors group-hover:shadow-md" style={{ backgroundColor: `${THEME.primary}10`, borderColor: THEME.border }}>
          <Camera size={24} style={{ color: THEME.primary }} />
        </div>
        <h3 className="font-bold text-sm mb-1" style={{ color: THEME.text }}>{title}</h3>
        <p className="text-xs font-mono opacity-80">{subtitle}</p>
      </div>
    )}
  </div>
);

// --- Upload Flow (Data Ingestion) ---
const UploadFlow = ({ images, setImages, onAnalyze }) => {
  const handleMockUpload = (type) => {
    setImages(prev => ({ ...prev, [type]: type === 'before' ? MOCK_BEFORE : MOCK_AFTER }));
  };
  const isReady = images.before && images.after;

  return (
    <div className="max-w-4xl mx-auto space-y-16 animate-in slide-in-from-bottom-12 duration-700 fade-in pt-10">
      <div className="text-center space-y-6 mb-10 p-8 rounded-3xl flex flex-col items-center w-full backdrop-blur-md border shadow-sm mx-auto max-w-3xl" style={{ backgroundColor: THEME.surface, borderColor: THEME.border }}>
        <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border font-semibold text-xs tracking-[0.2em] uppercase shadow-sm" style={{ borderColor: `${THEME.primary}40`, backgroundColor: `${THEME.primary}10`, color: THEME.primary }}>
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: THEME.primary }} />
          POS Sync
        </div>
        <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight" style={{ color: THEME.text }}>Table Scans</h2>
        <p className="max-w-2xl mx-auto text-lg font-bold leading-relaxed" style={{ color: THEME.textMuted }}>Sync the service-out plate with the dish-return plate to calculate exact volumetric discrepancy and financial waste.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <UploadZone title="Service-Out (T0)" subtitle="Capture before leaving expeditor" image={images.before} onClick={() => handleMockUpload('before')} />
        <UploadZone title="Plate-Return (T1)" subtitle="Capture at dish pit return" image={images.after} onClick={() => handleMockUpload('after')} />
      </div>

      <div className="flex justify-center pt-8">
        <Button onClick={onAnalyze} disabled={!isReady} className="w-full md:w-auto px-12 py-4">
          {isReady ? 'Initialize Kitchen AI' : 'Awaiting POS Ticket Scans'} <ScanLine size={18} className={isReady ? 'animate-pulse' : ''} />
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

          {/* Live Terminal Output */}
          <div className="h-32 shrink-0 border-t p-3 font-mono text-[10px] sm:text-xs overflow-y-auto" style={{ backgroundColor: THEME.surface, borderColor: THEME.border }}>
            <div className="flex items-center gap-2 mb-2 sticky top-0" style={{ color: THEME.textMuted, backgroundColor: THEME.surface }}>
              <Terminal size={14} /> pos_sys.log
            </div>
            {logs.map((log, i) => {
              if (!log) return null;
              const logStr = typeof log === 'string' ? log : JSON.stringify(log);
              const isCost = logStr.includes('[Cost]') || logStr.includes('[SYS]');
              
              return (
                <div key={i} className="mb-1 flex gap-3 animate-in slide-in-from-bottom-1 fade-in">
                  <span style={{ color: THEME.textMuted }}>[{new Date().toISOString().split('T')[1].slice(0,-2)}]</span>
                  <span style={{ color: isCost ? THEME.accent : THEME.text, fontWeight: isCost ? 'bold' : 'normal' }}>{logStr}</span>
                </div>
              );
            })}
            <div ref={logsEndRef} />
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
