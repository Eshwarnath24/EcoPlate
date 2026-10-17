import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ScanLine, Cpu, Layers, Zap, Sparkles, UploadCloud, ShieldCheck, CheckCircle2, Terminal } from 'lucide-react';
import { THEME, MODELS, PRESET_TEST_PLATES, API_BASE, MOCK_RESULTS, PIPELINE_STAGES, MOCK_LOGS } from '../theme';
import Button from '../components/Button';
import { NetworkVisualizer } from '../components/loaders';

// --- Model Selection Card ---
const ModelCard = ({ model, isSelected, onSelect }) => (
  <div
    onClick={onSelect}
    className={`relative group cursor-pointer p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col justify-between ${
      isSelected ? `${model.border} shadow-lg shadow-${model.color}/20 scale-[1.02]` : 'border-zinc-800 hover:border-zinc-700 opacity-75 hover:opacity-100'
    }`}
    style={{
      backgroundColor: isSelected ? 'rgba(24, 24, 27, 0.95)' : 'rgba(24, 24, 27, 0.6)',
      boxShadow: isSelected ? `0 0 24px ${model.color}25` : 'none'
    }}
  >
    {isSelected && (
      <div 
        className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase flex items-center gap-1 shadow-sm"
        style={{ backgroundColor: model.color, color: '#000' }}
      >
        <Sparkles size={11} /> ACTIVE MODEL
      </div>
    )}

    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs" style={{ backgroundColor: `${model.color}20`, color: model.color }}>
            {model.id === 'yolo' && <Zap size={16} />}
            {model.id === 'cnn' && <Layers size={16} />}
            {model.id === 'compare' && <Cpu size={16} />}
          </div>
          <span className="font-bold text-sm" style={{ color: THEME.text }}>{model.name}</span>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded" style={{ backgroundColor: `${model.color}15`, color: model.color }}>
          {model.badge}
        </span>
      </div>
      <p className="text-xs leading-relaxed" style={{ color: THEME.textMuted }}>
        {model.desc}
      </p>
    </div>

    <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono">
      <span style={{ color: model.color }}>{model.tag}</span>
      <span style={{ color: THEME.textMuted }}>Option A Constrained</span>
    </div>
  </div>
);


// --- Preset Test Plate Pill ---
const PresetPlatePill = ({ preset, isActive, onSelect }) => (
  <button
    type="button"
    onClick={onSelect}
    className={`px-3 py-2 rounded-xl text-left border transition-all duration-300 flex items-center gap-3 shrink-0 ${
      isActive ? 'border-orange-500 bg-orange-500/10 shadow-md shadow-orange-500/20' : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
    }`}
  >
    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-zinc-700 relative bg-zinc-800">
      <img src={preset.before_img} alt={preset.plate_id} className="w-full h-full object-cover" />
    </div>
    <div className="pr-1">
      <div className="flex items-center gap-2">
        <span className="font-mono font-bold text-xs" style={{ color: isActive ? THEME.primary : THEME.text }}>{preset.plate_id}</span>
        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded" style={{ backgroundColor: `${preset.badgeColor}20`, color: preset.badgeColor }}>
          {preset.badge}
        </span>
      </div>
      <div className="text-[11px] truncate max-w-[160px]" style={{ color: THEME.textMuted }}>{preset.title}</div>
    </div>
  </button>
);


// --- Upload Zone Sub-component (Supports Click & File Drop) ---
const UploadZone = ({ title, subtitle, image, onImageSelected }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onImageSelected(event.target.result, file);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div 
      onClick={() => fileInputRef.current?.click()}
      className="relative group cursor-pointer h-48 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden hover:border-orange-500/60"
      style={{ borderColor: image ? THEME.primary : THEME.border, backgroundColor: THEME.surface }}
    >
      <input 
        ref={fileInputRef}
        type="file" 
        accept="image/*" 
        className="hidden" 
        onChange={handleFileChange}
      />

      {image ? (
        <>
          <img src={image} alt={title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded backdrop-blur-md text-[10px] font-mono" style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: 'rgba(255,255,255,0.8)' }}>
            CHANGE ↺
          </div>
          <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center text-xs font-mono">
            <span className="px-2 py-0.5 rounded backdrop-blur-md font-bold shadow-sm text-[10px]" style={{ backgroundColor: `${THEME.success}90`, color: '#fff' }}>SYNCED</span>
            <span className="px-2 py-0.5 rounded backdrop-blur-md text-[10px]" style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: 'rgba(255,255,255,0.8)' }}>READY</span>
          </div>
        </>
      ) : (
        <div className="text-center p-4 transition-colors relative z-10 flex flex-col items-center" style={{ color: THEME.textMuted }}>
          <div className="w-12 h-12 rounded-full border flex items-center justify-center mb-3 transition-colors group-hover:shadow-md" style={{ backgroundColor: `${THEME.primary}10`, borderColor: THEME.border }}>
            <UploadCloud size={20} style={{ color: THEME.primary }} />
          </div>
          <h3 className="font-bold text-xs mb-0.5" style={{ color: THEME.text }}>{title}</h3>
          <p className="text-[10px] font-mono opacity-80">{subtitle}</p>
          <span className="text-[9px] mt-2 px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">Click or Drag & Drop</span>
        </div>
      )}
    </div>
  );
};


// --- Upload Flow ---
const UploadFlow = ({ images, setImages, selectedModel, setSelectedModel, onAnalyze }) => {
  const [activePreset, setActivePreset] = useState(PRESET_TEST_PLATES[0].plate_id);

  // Load a preset plate pair into Table 1
  const handleSelectPreset = (preset) => {
    setActivePreset(preset.plate_id);
    setImages(prev => prev.map((table, i) => 
      i === 0 
        ? { ...table, before: preset.before_img, after: preset.after_img, activePreset: preset }
        : table
    ));
  };

  // Initialize with the first preset if Table 1 is empty
  useEffect(() => {
    if (!images[0].before && !images[0].after) {
      handleSelectPreset(PRESET_TEST_PLATES[0]);
    }
  }, []);

  const handleCustomImage = (tableIdx, type, dataUrl, file) => {
    setImages(prev => prev.map((table, i) => 
      i === tableIdx 
        ? { ...table, [type]: dataUrl, [`${type}File`]: file, activePreset: null }
        : table
    ));
    setActivePreset(null);
  };

  const isReady = images[0].before && images[0].after;

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in slide-in-from-bottom-12 duration-700 fade-in pt-4">
      
      {/* 1. Header Banner */}
      <div className="text-center space-y-4 p-8 rounded-3xl flex flex-col items-center w-full backdrop-blur-md border shadow-sm mx-auto max-w-4xl" style={{ backgroundColor: THEME.surface, borderColor: THEME.border }}>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border font-semibold text-xs tracking-[0.2em] uppercase shadow-sm" style={{ borderColor: `${THEME.primary}40`, backgroundColor: `${THEME.primary}10`, color: THEME.primary }}>
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: THEME.primary }} />
          EcoPlate AI • Dual-Model Waste Analytics
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight" style={{ color: THEME.text }}>Dining Plate Analysis</h1>
        <p className="max-w-2xl mx-auto text-sm md:text-base leading-relaxed" style={{ color: THEME.textMuted }}>
          Upload before-meal and after-meal photographs, or choose a held-out test scenario. The pipeline applies Option A Hough basin containment (<span className="font-mono text-cyan-400">0.96r</span>) and Closed-World glare elimination.
        </p>
      </div>

      {/* 2. Model Selection Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 font-bold text-sm tracking-wide" style={{ color: THEME.text }}>
            <Cpu size={16} style={{ color: THEME.primary }} />
            <span>1. SELECT NEURAL NETWORK ARCHITECTURE</span>
          </div>
          <span className="text-xs font-mono text-zinc-400">Trained on Indian Mess Dataset</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.values(MODELS).map((m) => (
            <ModelCard
              key={m.id}
              model={m}
              isSelected={selectedModel === m.id}
              onSelect={() => setSelectedModel(m.id)}
            />
          ))}
        </div>
      </div>

      {/* 3. Preset Test Plates Gallery */}
      <div className="space-y-3 p-5 rounded-2xl border" style={{ backgroundColor: THEME.surface, borderColor: THEME.border }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm tracking-wide" style={{ color: THEME.text }}>
            <ShieldCheck size={16} className="text-emerald-400" />
            <span>2. PRESET HELD-OUT TEST SCENARIOS (1-CLICK BENCHMARK)</span>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            Never Seen During Training
          </span>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {PRESET_TEST_PLATES.map((preset) => (
            <PresetPlatePill
              key={preset.plate_id}
              preset={preset}
              isActive={activePreset === preset.plate_id}
              onSelect={() => handleSelectPreset(preset)}
            />
          ))}
        </div>

        {activePreset && (
          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono">
            <span style={{ color: THEME.textMuted }}>
              Scenario: <strong className="text-zinc-200">{PRESET_TEST_PLATES.find(p => p.plate_id === activePreset)?.scenario}</strong>
            </span>
            <span className="text-orange-400">
              Benchmark Waste: {PRESET_TEST_PLATES.find(p => p.plate_id === activePreset)?.benchmark_waste}%
            </span>
          </div>
        )}
      </div>

      {/* 4. Active Plate Pair Scans */}
      <div 
        className="rounded-2xl border backdrop-blur-md p-6 space-y-4"
        style={{ backgroundColor: THEME.surface, borderColor: THEME.border }}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-sm bg-orange-600/20 text-orange-400 border border-orange-500/40">
              P1
            </div>
            <div>
              <h3 className="font-bold text-sm" style={{ color: THEME.text }}>
                {activePreset ? `Test Plate ${activePreset} Selected` : 'Custom Uploaded Dining Plate Pair'}
              </h3>
              <p className="text-xs font-mono" style={{ color: THEME.textMuted }}>
                {images[0].before && images[0].after ? '✓ Both Before & After captures ready for segmentation' : 'Awaiting image uploads'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
              Target: <strong className="text-orange-400 uppercase">{selectedModel}</strong>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UploadZone 
            title="Service-Out (T0: Before Meal)" 
            subtitle="Initial Plated Food Portion" 
            image={images[0].before} 
            onImageSelected={(dataUrl, file) => handleCustomImage(0, 'before', dataUrl, file)} 
          />
          <UploadZone 
            title="Plate-Return (T1: After Meal)" 
            subtitle="Post-Consumption Leftovers" 
            image={images[0].after} 
            onImageSelected={(dataUrl, file) => handleCustomImage(0, 'after', dataUrl, file)} 
          />
        </div>
      </div>

      {/* 5. Action Button */}
      <div className="flex flex-col items-center pt-2 pb-8 gap-3">
        <Button 
          onClick={onAnalyze} 
          disabled={!isReady} 
          className="w-full md:w-auto px-12 py-4 text-base font-bold shadow-xl shadow-orange-600/20"
        >
          {isReady ? `Run Food Waste Estimation (${MODELS[selectedModel]?.name})` : 'Awaiting Plate Images'} 
          <ScanLine size={18} className={isReady ? 'animate-pulse' : ''} />
        </Button>
        <p className="text-xs font-mono text-zinc-500">
          Option A Invariant: 0 px Rim Bleed • Closed-World Glare Pruning • Hardware: RTX 3050
        </p>
      </div>

    </div>
  );
};


// --- Pipeline Visualization Screen ---
const PipelineVisualization = ({ selectedModel, onComplete }) => {
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [logs, setLogs] = useState([]);
  const logsEndRef = useRef(null);

  useEffect(() => {
    if (currentStageIdx >= PIPELINE_STAGES.length) {
      const timer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 1000);
      return () => clearTimeout(timer);
    }

    const stageTime = 1400;
    const timer = setTimeout(() => setCurrentStageIdx(prev => prev + 1), stageTime);
    
    const stageId = PIPELINE_STAGES[currentStageIdx]?.id;
    const stageLogs = (stageId && MOCK_LOGS[stageId]) ? MOCK_LOGS[stageId] : [];
    let logIdx = 0;
    const logInterval = setInterval(() => {
      if (logIdx < stageLogs.length) {
        const item = stageLogs[logIdx];
        if (item) {
          setLogs(prev => [...prev, item]);
        }
        logIdx++;
      }
    }, stageTime / (stageLogs.length + 1 || 1));

    return () => {
      clearTimeout(timer);
      clearInterval(logInterval);
    };
  }, [currentStageIdx, onComplete]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const activeModel = MODELS[selectedModel] || MODELS.yolo;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pt-6">
      
      {/* Top Banner */}
      <div className="text-center space-y-3 p-6 rounded-3xl border backdrop-blur-md" style={{ backgroundColor: THEME.surface, borderColor: THEME.border }}>
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono font-bold tracking-widest uppercase bg-orange-500/10 text-orange-400 border border-orange-500/30">
          <div className="w-2 h-2 rounded-full animate-ping bg-orange-500" />
          Processing with {activeModel?.name}
        </div>
        <h2 className="text-3xl font-extrabold" style={{ color: THEME.text }}>
          Option A Semantic Verification Engine
        </h2>
        <p className="text-xs font-mono text-zinc-400">
          Hough Spatial Containment (0.96r) • Rim Clipping • Closed-World Semantic Filter (C_after ⊆ C_before)
        </p>
      </div>

      {/* Stage Progress Pills */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        {PIPELINE_STAGES.map((stage, idx) => {
          const isDone = idx < currentStageIdx;
          const isCurrent = idx === currentStageIdx;
          return (
            <div 
              key={stage.id}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                isDone ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-400' :
                isCurrent ? 'border-orange-500 bg-orange-500/20 text-orange-400 shadow-md shadow-orange-500/20' :
                'border-zinc-800 bg-zinc-900/40 text-zinc-500'
              }`}
            >
              <div className="text-[10px] font-mono font-bold">{isDone ? '✓ DONE' : isCurrent ? 'RUNNING' : `STAGE ${idx + 1}`}</div>
              <div className="text-xs font-bold truncate mt-1">{stage.name.split(':')[1] || stage.name}</div>
            </div>
          );
        })}
      </div>

      {/* Terminal Receipt Box */}
      <div className="rounded-2xl border p-5 font-mono text-xs overflow-hidden shadow-2xl" style={{ backgroundColor: '#09090b', borderColor: THEME.border }}>
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 text-zinc-400 mb-3">
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-orange-400" />
            <span>ECOPLATE AI AUDIT LOG</span>
          </div>
          <span className="text-[10px] text-zinc-500">GPU: NVIDIA RTX 3050 Laptop</span>
        </div>

        <div className="h-64 overflow-y-auto space-y-1.5 scrollbar-thin pr-2">
          {logs.filter(Boolean).map((log, i) => {
            const logStr = typeof log === 'string' ? log : String(log || '');
            const isPass = logStr.includes('PASS') || logStr.includes('Verified');
            const isHough = logStr.includes('Hough');
            return (
              <div key={i} className="flex gap-2 text-zinc-300">
                <span className="text-zinc-600 select-none">{String(i + 1).padStart(3, '0')}</span>
                <span className={isPass ? 'text-emerald-400' : isHough ? 'text-cyan-400' : ''}>
                  {logStr}
                </span>
              </div>
            );
          })}
          <div ref={logsEndRef} />
        </div>
      </div>

    </div>
  );
};


// --- Main Analysis Page Wrapper ---
const AnalysisPage = ({ images, setImages, selectedModel, setSelectedModel, setAnalysisResult }) => {
  const [step, setStep] = useState('upload');
  const navigate = useNavigate();

  const handleStartAnalysis = async () => {
    setStep('analyzing');

    try {
      // Prepare FormData for the backend API
      const formData = new FormData();
      formData.append('model_type', selectedModel);

      // Extract files from state or fetch blob from local preset image URL
      const beforeSource = images[0].before;
      const afterSource = images[0].after;

      let beforeBlob, afterBlob;

      if (images[0].beforeFile) {
        beforeBlob = images[0].beforeFile;
      } else {
        const resp = await fetch(beforeSource);
        beforeBlob = await resp.blob();
      }

      if (images[0].afterFile) {
        afterBlob = images[0].afterFile;
      } else {
        const resp = await fetch(afterSource);
        afterBlob = await resp.blob();
      }

      formData.append('before_image', beforeBlob, 'before.jpg');
      formData.append('after_image', afterBlob, 'after.jpg');

      // Call live Dual-Model Backend API (Try Render first, then Localhost)
      // Render free tier cold-starts can take 30-60s, so we use a generous timeout
      const endpointConfigs = [
        { url: `${API_BASE}/api/analyze-plate`, timeoutMs: 120000, label: 'Render' },
        { url: 'http://localhost:8000/api/analyze-plate', timeoutMs: 10000, label: 'Localhost' }
      ];
      // Deduplicate by URL
      const seen = new Set();
      const uniqueConfigs = endpointConfigs.filter(c => {
        if (seen.has(c.url)) return false;
        seen.add(c.url);
        return true;
      });

      let response = null;
      let lastError = null;

      for (const config of uniqueConfigs) {
        try {
          console.log(`[EcoPlate API] Attempting ${config.label} connection to: ${config.url} (timeout: ${config.timeoutMs / 1000}s)`);
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

          const res = await fetch(config.url, {
            method: 'POST',
            body: formData,
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (res.ok) {
            response = res;
            console.log(`[EcoPlate API] ✅ Connected successfully via ${config.label}: ${config.url}`);
            break;
          } else {
            const errText = await res.text().catch(() => '');
            console.warn(`[EcoPlate API] ${config.label} returned status ${res.status}: ${errText}`);
          }
        } catch (e) {
          lastError = e;
          const reason = e.name === 'AbortError' ? `Timed out after ${config.timeoutMs / 1000}s` : e.message;
          console.warn(`[EcoPlate API] ${config.label} failed: ${reason}`);
        }
      }

      if (!response) {
        throw lastError || new Error('Both Render and Localhost backend endpoints are currently unreachable.');
      }

      const result = await response.json();
      console.log('[EcoPlate API Success]', result);
      setAnalysisResult(result);

    } catch (err) {
      console.error('[EcoPlate API Error]', err);
      const reason = err.name === 'AbortError'
        ? 'Backend server is still waking up (Render free tier). Please wait 30-60 seconds and try again.'
        : `Backend unreachable: ${err.message}`;
      alert(`⚠️ Analysis Failed\n\n${reason}\n\nMake sure the backend server is running.`);
      setStep('upload');
      return;
    }
  };

  return (
    <>
      {step === 'upload' && (
        <UploadFlow 
          images={images} 
          setImages={setImages} 
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          onAnalyze={handleStartAnalysis} 
        />
      )}
      {step === 'analyzing' && (
        <PipelineVisualization 
          selectedModel={selectedModel}
          onComplete={() => navigate('/report')} 
        />
      )}
    </>
  );
};

const roundNum = (n) => Math.round(n * 100) / 100;

export default AnalysisPage;
