import React from 'react';
import { Scan, Layers, Cpu, GitMerge, Database, Zap } from 'lucide-react';
import { THEME, MOCK_BEFORE } from '../theme';
import Button from '../components/Button';

// --- Scanner Visualizer Hero ---
const ScannerVisualizer = () => {
  return (
    <div className="relative w-full h-[500px] rounded-2xl border bg-[#050505] overflow-hidden flex items-center justify-center group" style={{ borderColor: THEME.borderHighlight }}>
      {/* Base Image */}
      <div className="absolute inset-0 opacity-40 grayscale group-hover:grayscale-0 transition-all duration-1000" style={{ backgroundImage: `url(${MOCK_BEFORE})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      
      {/* Tech Overlays */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Scanning Line */}
        <div className="absolute left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)] animate-scan z-20" />
        {/* Matrix Overlay */}
        <div className="absolute inset-0 animate-matrix opacity-30 z-10" />
        {/* Grid Overlay */}
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `linear-gradient(cyan 1px, transparent 1px), linear-gradient(90deg, cyan 1px, transparent 1px)`, backgroundSize: '20px 20px', mixBlendMode: 'overlay' }} />
      </div>

      {/* Central Interface Elements */}
      <div className="relative z-30 flex flex-col items-center gap-4 pointer-events-none">
        <div className="w-24 h-24 rounded-full border border-white/20 backdrop-blur-md bg-white/5 flex items-center justify-center">
          <Scan size={32} className="text-white opacity-80" />
        </div>
        <div className="px-4 py-1.5 rounded-md backdrop-blur-md bg-black/60 border border-white/10 font-mono text-xs tracking-widest text-white/70">
          AWAITING_INPUT_TENSOR
        </div>
      </div>

      {/* Corner UI */}
      <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-white/50" />
      <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-white/50" />
      <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-white/50" />
      <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-white/50" />
    </div>
  );
};

// --- Landing Page ---
const LandingPage = ({ onStart }) => (
  <div className="space-y-32 animate-in fade-in duration-1000 pb-20 pt-10">
    <section className="grid lg:grid-cols-2 gap-16 items-center">
      <div className="space-y-10">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border font-mono text-[10px] tracking-widest uppercase" style={{ borderColor: THEME.border, color: THEME.textMuted }}>
            <Zap size={12} className="text-blue-400" /> Model Architecture V2.1
          </div>
          <h1 className="text-5xl md:text-6xl font-semibold leading-tight tracking-tight glow-text" style={{ color: THEME.text }}>
            Computer Vision for <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Waste Analytics.</span>
          </h1>
          <p className="text-lg leading-relaxed max-w-lg font-light text-gray-400">
            A multi-stage neural pipeline designed to segment, classify, and match food items to accurately compute waste across complex institutional datasets in real-time.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={onStart} className="px-8 py-4">
            Initialize Pipeline
          </Button>
          <Button variant="outline" className="px-8 py-4" onClick={() => window.open('https://github.com', '_blank')}>
            View Architecture
          </Button>
        </div>
      </div>
      <ScannerVisualizer />
    </section>

    {/* Architecture Diagram Section */}
    <section className="space-y-16">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-semibold tracking-tight">Pipeline Architecture</h2>
        <p className="max-w-2xl mx-auto font-light text-gray-400">Deep learning models orchestrated sequentially to guarantee segmentation precision and class accuracy.</p>
      </div>

      <div className="grid md:grid-cols-4 gap-4 relative">
        <div className="hidden md:block absolute top-1/2 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent -z-10" />
        
        {[
          { icon: <Layers size={20}/>, title: "U-Net Segment", desc: "Pixel-perfect multi-class food masking." },
          { icon: <Cpu size={20}/>, title: "ResNet-50", desc: "Deep feature extraction & classification." },
          { icon: <GitMerge size={20}/>, title: "Siamese Match", desc: "Latent space cross-state diffing." },
          { icon: <Database size={20}/>, title: "Volumetric Calc", desc: "Area delta to mass estimation." }
        ].map((step, i) => (
          <div key={i} className="bg-[#0A0A0A] p-6 rounded-xl border backdrop-blur-sm relative group hover:bg-[#111] transition-all duration-300" style={{ borderColor: THEME.border }}>
            <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-white/70 group-hover:text-white group-hover:border-white/30 transition-all group-hover:scale-110">
              {step.icon}
            </div>
            <h3 className="font-semibold text-sm mb-2">{step.title}</h3>
            <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  </div>
);

export default LandingPage;
