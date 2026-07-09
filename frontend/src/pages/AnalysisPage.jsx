import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, Play, CheckCircle2, Terminal } from 'lucide-react';
import { THEME, MOCK_BEFORE, MOCK_AFTER, PIPELINE_STAGES, MOCK_LOGS } from '../theme';
import Button from '../components/Button';
import { NetworkVisualizer } from '../components/loaders';

// --- Upload Zone Sub-component ---
const UploadZone = ({ title, image, onClick }) => (
  <div 
    onClick={onClick}
    className="relative group cursor-pointer h-80 rounded-xl border flex flex-col items-center justify-center transition-all overflow-hidden bg-[#050505]"
    style={{ borderColor: image ? THEME.borderHighlight : THEME.border }}
  >
    {image ? (
      <>
        <img src={image} alt={title} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center text-xs font-mono">
          <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded border border-green-500/30 backdrop-blur-md">LOADED</span>
          <span className="text-white/50 bg-black/50 px-2 py-1 rounded backdrop-blur-md">Shape: [1, 3, 800, 800]</span>
        </div>
      </>
    ) : (
      <>
        {/* Animated Dashed Border Effect */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30 group-hover:opacity-100 transition-opacity">
          <rect width="100%" height="100%" rx="12" fill="none" stroke="white" strokeWidth="2" strokeDasharray="10 10" className="dash-flow" />
        </svg>
        <div className="text-center p-6 text-gray-400 group-hover:text-white transition-colors relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors">
            <UploadCloud size={24} />
          </div>
          <h3 className="font-semibold text-sm mb-1">{title}</h3>
          <p className="text-xs font-mono opacity-50">Click to mount array</p>
        </div>
      </>
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
        <h2 className="text-3xl font-semibold tracking-tight">Data Ingestion</h2>
        <p className="text-gray-400 font-light">Supply input tensors (images) for inference. System expects standard RGB matrices.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <UploadZone title="State T0: Pre-Consumption" image={images.before} onClick={() => handleMockUpload('before')} />
        <UploadZone title="State T1: Post-Consumption" image={images.after} onClick={() => handleMockUpload('after')} />
      </div>

      <div className="flex justify-center pt-8">
        <Button onClick={onAnalyze} disabled={!isReady} className="w-full md:w-auto px-12 py-4">
          {isReady ? 'Execute Pipeline' : 'Awaiting Data Streams'} <Play size={16} className={isReady ? 'animate-pulse' : ''} />
        </Button>
      </div>
    </div>
  );
};

// --- Pipeline Visualization (The AI Engine) ---
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
    const stageTime = 3000; // 3 seconds per stage
    const timer = setTimeout(() => setCurrentStageIdx(prev => prev + 1), stageTime);
    
    // Simulate Logs for current stage
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

  // High-frequency tick for network pulsing effects
  useEffect(() => {
    const ticker = setInterval(() => setPulseTick(p => p + 1), 150);
    return () => clearInterval(ticker);
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const stage = PIPELINE_STAGES[currentStageIdx] || { id: 'done', name: 'Inference Complete', details: 'Aggregating tensors.' };
  const progressPercent = Math.min(100, (currentStageIdx / PIPELINE_STAGES.length) * 100);

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-[85vh] min-h-[700px] rounded-xl border overflow-hidden animate-in zoom-in-95 duration-700 bg-[#0A0A0A] shadow-2xl" style={{ borderColor: THEME.borderHighlight }}>
      
      {/* Top Header */}
      <div className="flex-none bg-[#111] border-b px-4 py-3 flex justify-between items-center relative" style={{ borderColor: THEME.border }}>
        {/* Progress Bar inside header */}
        <div className="absolute bottom-0 left-0 h-[2px] bg-blue-500 transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
        
        <div className="flex items-center gap-4">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500 border border-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)] animate-pulse" />
          </div>
          <span className="font-mono text-xs text-white/70 tracking-widest">CUDA:0 / MODEL_RUNNER</span>
        </div>
        <div className="font-mono text-[10px] text-white/40">
          LOSS: {(0.8 - (currentStageIdx * 0.12) + (Math.random() * 0.05)).toFixed(4)}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Stage Pipeline Steps */}
        <div className="w-64 shrink-0 border-r bg-[#050505] p-5 flex flex-col justify-center relative overflow-hidden" style={{ borderColor: THEME.border }}>
          {/* Faint background grid */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
          
          <div className="space-y-6 relative z-10">
            <div className="absolute left-[9px] top-4 bottom-4 w-[1px] bg-white/10 -z-10" />
            
            {PIPELINE_STAGES.map((s, i) => {
              const isActive = i === currentStageIdx;
              const isPast = i < currentStageIdx;
              return (
                <div key={s.id} className={`flex items-start gap-4 transition-all duration-500 ${isActive ? 'opacity-100 scale-105 translate-x-2' : isPast ? 'opacity-40' : 'opacity-20'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all duration-500
                    ${isActive ? `bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] border-transparent` : isPast ? 'bg-white/20 border-transparent' : 'bg-[#111] border border-white/20'}`}
                  >
                    {isPast ? <CheckCircle2 size={10} className="text-white" /> : <span className="text-[9px] font-bold text-white">{i+1}</span>}
                  </div>
                  <div>
                    <h4 className="font-mono font-semibold text-xs tracking-wider mb-1" style={{ color: isActive ? '#fff' : THEME.textMuted }}>{s.name}</h4>
                    {isActive && <p className="text-[10px] leading-relaxed text-gray-400 animate-in slide-in-from-left-2">{s.details}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Area: Viz + Terminal */}
        <div className="flex-1 flex flex-col bg-black relative">
          
          {/* Main SVG Visualizer */}
          <div className="flex-1 relative overflow-hidden flex items-center justify-center p-3">
            {/* Dual Image Background — Before (left) + After (right) */}
            <div className="absolute inset-0 flex transition-opacity duration-1000" style={{ opacity: currentStageIdx < 6 ? 0.12 : 0.04 }}>
              <div 
                className="w-1/2 h-full grayscale mix-blend-screen transition-all duration-1000"
                style={{ 
                  backgroundImage: `url(${MOCK_BEFORE})`, 
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  filter: (currentStageIdx === 1 || currentStageIdx === 2) ? 'contrast(200%) brightness(150%) blur(4px)' : 'blur(2px)',
                }}
              />
              <div 
                className="w-1/2 h-full grayscale mix-blend-screen transition-all duration-1000"
                style={{ 
                  backgroundImage: `url(${MOCK_AFTER})`, 
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  filter: (currentStageIdx === 4 || currentStageIdx === 5) ? 'contrast(200%) brightness(150%) blur(4px)' : 'blur(2px)',
                }}
              />
              {/* Gradient blend between the two */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/60 to-transparent" style={{ left: '30%', right: '30%' }} />
            </div>
            {/* T0/T1 labels */}
            <div className="absolute top-3 left-4 text-[9px] font-mono text-white/15 tracking-widest">T0</div>
            <div className="absolute top-3 right-4 text-[9px] font-mono text-white/15 tracking-widest">T1</div>
            
            <NetworkVisualizer stageId={stage.id} tick={pulseTick} />
          </div>

          {/* Live Terminal Output */}
          <div className="h-32 shrink-0 bg-[#0A0A0A] border-t p-3 font-mono text-[10px] sm:text-xs overflow-y-auto" style={{ borderColor: THEME.borderHighlight }}>
            <div className="flex items-center gap-2 text-white/30 mb-2 sticky top-0 bg-[#0A0A0A]">
              <Terminal size={14} /> stdout
            </div>
            {logs.map((log, i) => {
              // Defensive rendering string parsing and formatting in case of invalid data types
              if (!log) return null;
              const logStr = typeof log === 'string' ? log : JSON.stringify(log);
              
              return (
                <div key={i} className="mb-1 flex gap-3 animate-in slide-in-from-bottom-1 fade-in">
                  <span className="text-white/30 shrink-0">[{new Date().toISOString().split('T')[1].slice(0,-2)}]</span>
                  <span className={logStr.includes('[SYS]') ? 'text-blue-400' : logStr.includes('0.98') ? 'text-green-400' : 'text-gray-300'}>{logStr}</span>
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

// --- Analysis Page: combines UploadFlow and PipelineVisualization ---
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
