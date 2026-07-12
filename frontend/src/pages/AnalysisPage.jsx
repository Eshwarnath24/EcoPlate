import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, Play, CheckCircle2, Terminal } from 'lucide-react';
import { THEME, MOCK_BEFORE, MOCK_AFTER, PIPELINE_STAGES, MOCK_LOGS } from '../theme';
import Button from '../components/Button';
import { NetworkVisualizer } from '../components/loaders';

// --- Upload Zone Sub-component ---
const UploadZone = ({ title, image, onClick }) => (
  <div 
    onClick={onClick}
    className="relative group cursor-pointer h-80 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden"
    style={{ borderColor: image ? THEME.primary : THEME.border, backgroundColor: image ? 'transparent' : THEME.surface }}
  >
    {image ? (
      <>
        <img src={image} alt={title} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center text-xs font-mono">
          <span className="px-2 py-1 rounded border backdrop-blur-md" style={{ backgroundColor: `${THEME.success}20`, color: THEME.success, borderColor: `${THEME.success}40` }}>LOADED</span>
          <span className="px-2 py-1 rounded backdrop-blur-md" style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.7)' }}>Shape: [1, 3, 800, 800]</span>
        </div>
      </>
    ) : (
      <div className="text-center p-6 transition-colors relative z-10 flex flex-col items-center" style={{ color: THEME.textMuted }}>
        <div className="w-16 h-16 rounded-full border flex items-center justify-center mb-4 transition-colors group-hover:shadow-md" style={{ backgroundColor: `${THEME.primary}08`, borderColor: THEME.border }}>
          <UploadCloud size={24} style={{ color: THEME.primary }} />
        </div>
        <h3 className="font-semibold text-sm mb-1" style={{ color: THEME.text }}>{title}</h3>
        <p className="text-xs font-mono opacity-60">Click to upload image</p>
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
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-semibold tracking-tight" style={{ color: THEME.text }}>Upload Meal Photos</h2>
        <p className="font-light" style={{ color: THEME.textMuted }}>Upload before and after meal photos for waste analysis.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <UploadZone title="Before Meal (T0)" image={images.before} onClick={() => handleMockUpload('before')} />
        <UploadZone title="After Meal (T1)" image={images.after} onClick={() => handleMockUpload('after')} />
      </div>

      <div className="flex justify-center pt-8">
        <Button onClick={onAnalyze} disabled={!isReady} className="w-full md:w-auto px-12 py-4">
          {isReady ? 'Start Analysis' : 'Upload Both Images'} <Play size={16} className={isReady ? 'animate-pulse' : ''} />
        </Button>
      </div>
    </div>
  );
};

// --- Pipeline Visualization (The AI Engine) ---
// NOTE: The pipeline viz panel stays dark — it's a "terminal/code window" embedded in the warm app
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

  const stage = PIPELINE_STAGES[currentStageIdx] || { id: 'done', name: 'Inference Complete', details: 'Aggregating tensors.' };
  const progressPercent = Math.min(100, (currentStageIdx / PIPELINE_STAGES.length) * 100);

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-[85vh] min-h-[700px] rounded-xl border overflow-hidden animate-in zoom-in-95 duration-700 shadow-xl" style={{ borderColor: THEME.border, backgroundColor: '#1A1A18' }}>
      
      {/* Top Header — dark green bar */}
      <div className="flex-none border-b px-4 py-3 flex justify-between items-center relative" style={{ backgroundColor: THEME.primary, borderColor: 'rgba(255,255,255,0.1)' }}>
        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 h-[2px] transition-all duration-1000" style={{ width: `${progressPercent}%`, backgroundColor: THEME.accent }} />
        
        <div className="flex items-center gap-4">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#B3452C' }} />
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#D9A441' }} />
            <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" style={{ boxShadow: '0 0 8px rgba(74,222,128,0.6)' }} />
          </div>
          <span className="font-mono text-xs text-white/80 tracking-widest">🌱 EcoPlate / MODEL_RUNNER</span>
        </div>
        <div className="font-mono text-[10px] text-white/50">
          LOSS: {(0.8 - (currentStageIdx * 0.12) + (Math.random() * 0.05)).toFixed(4)}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Stage Pipeline Steps */}
        <div className="w-64 shrink-0 border-r p-5 flex flex-col justify-center relative overflow-hidden" style={{ backgroundColor: '#141413', borderColor: 'rgba(255,255,255,0.08)' }}>
          {/* Faint background grid */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.5) 1px, transparent 0)', backgroundSize: '20px 20px' }} />
          
          <div className="space-y-6 relative z-10">
            <div className="absolute left-[9px] top-4 bottom-4 w-[1px] bg-white/10 -z-10" />
            
            {PIPELINE_STAGES.map((s, i) => {
              const isActive = i === currentStageIdx;
              const isPast = i < currentStageIdx;
              return (
                <div key={s.id} className={`flex items-start gap-4 transition-all duration-500 ${isActive ? 'opacity-100 scale-105 translate-x-2' : isPast ? 'opacity-40' : 'opacity-20'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all duration-500`}
                    style={{
                      backgroundColor: isActive ? THEME.accent : isPast ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                      border: isActive ? 'none' : isPast ? 'none' : '1px solid rgba(255,255,255,0.2)',
                      boxShadow: isActive ? `0 0 15px ${THEME.accent}80` : 'none',
                    }}
                  >
                    {isPast ? <CheckCircle2 size={10} className="text-white" /> : <span className="text-[9px] font-bold text-white">{i+1}</span>}
                  </div>
                  <div>
                    <h4 className="font-mono font-semibold text-xs tracking-wider mb-1" style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.4)' }}>{s.name}</h4>
                    {isActive && <p className="text-[10px] leading-relaxed text-gray-400 animate-in slide-in-from-left-2">{s.details}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Area: Viz + Terminal */}
        <div className="flex-1 flex flex-col relative" style={{ backgroundColor: '#0F0F0E' }}>
          
          {/* Main SVG Visualizer */}
          <div className="flex-1 relative overflow-hidden flex items-center justify-center p-3">
            {/* Dual Image Background */}
            <div className="absolute inset-0 flex transition-opacity duration-1000" style={{ opacity: currentStageIdx < PIPELINE_STAGES.length ? 0.1 : 0.03 }}>
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
              <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, transparent 30%, rgba(15,15,14,0.7) 50%, transparent 70%)' }} />
            </div>
            {/* T0/T1 labels */}
            <div className="absolute top-3 left-4 text-[9px] font-mono tracking-widest" style={{ color: 'rgba(255,255,255,0.12)' }}>T0</div>
            <div className="absolute top-3 right-4 text-[9px] font-mono tracking-widest" style={{ color: 'rgba(255,255,255,0.12)' }}>T1</div>
            
            <NetworkVisualizer stageId={stage.id} tick={pulseTick} />
          </div>

          {/* Live Terminal Output */}
          <div className="h-32 shrink-0 border-t p-3 font-mono text-[10px] sm:text-xs overflow-y-auto" style={{ backgroundColor: '#0A0A09', borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-2 mb-2 sticky top-0" style={{ color: 'rgba(255,255,255,0.3)', backgroundColor: '#0A0A09' }}>
              <Terminal size={14} /> stdout
            </div>
            {logs.map((log, i) => {
              if (!log) return null;
              const logStr = typeof log === 'string' ? log : JSON.stringify(log);
              
              return (
                <div key={i} className="mb-1 flex gap-3 animate-in slide-in-from-bottom-1 fade-in">
                  <span style={{ color: 'rgba(255,255,255,0.25)' }}>[{new Date().toISOString().split('T')[1].slice(0,-2)}]</span>
                  <span style={{ color: logStr.includes('[SYS]') ? THEME.accent : 'rgba(255,255,255,0.6)' }}>{logStr}</span>
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
const AnalysisPage = ({ images, setImages, appState, setAppState }) => {
  return (
    <>
      {appState === 'upload' && (
        <UploadFlow images={images} setImages={setImages} onAnalyze={() => setAppState('analyzing')} />
      )}
      {appState === 'analyzing' && (
        <PipelineVisualization onComplete={() => setAppState('results')} />
      )}
    </>
  );
};

export default AnalysisPage;
