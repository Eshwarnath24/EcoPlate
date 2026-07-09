import React, { useState, useEffect, useRef } from 'react';
import { Scan, Layers, Cpu, GitMerge, Database, Zap, ArrowRight, Activity, ChevronRight, Eye, BarChart3, Utensils, Mail, ExternalLink } from 'lucide-react';
import { THEME, MOCK_BEFORE, MOCK_AFTER, PIPELINE_STAGES } from '../theme';
import Button from '../components/Button';

// --- Animated Stat Counter ---
const AnimatedStat = ({ value, suffix = '', label }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const step = () => {
          start += Math.ceil(value / 40);
          if (start >= value) { setCount(value); return; }
          setCount(start);
          requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl font-light tracking-tight text-white">
        {count}{suffix}
      </div>
      <div className="text-xs text-gray-500 mt-2 font-mono uppercase tracking-widest">{label}</div>
    </div>
  );
};

// --- Before/After Plate Visual ---
const PlateComparison = () => {
  const [hovered, setHovered] = useState(null);

  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border bg-[#050505]" style={{ borderColor: THEME.borderHighlight }}>
      {/* Split images */}
      <div className="absolute inset-0 flex">
        {/* Before side */}
        <div
          className="relative w-1/2 overflow-hidden cursor-pointer group"
          onMouseEnter={() => setHovered('before')}
          onMouseLeave={() => setHovered(null)}
        >
          <div
            className="absolute inset-0 transition-all duration-700 group-hover:scale-110"
            style={{ backgroundImage: `url(${MOCK_BEFORE})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          />
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-500" />
          {/* Tech overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-30 group-hover:opacity-60 transition-opacity">
            <div className="absolute inset-0" style={{
              backgroundImage: 'linear-gradient(rgba(16,185,129,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.3) 1px, transparent 1px)',
              backgroundSize: '25px 25px'
            }} />
          </div>
          {/* Scanning line */}
          <div className="absolute left-0 right-0 h-[2px] bg-green-400 shadow-[0_0_20px_rgba(16,185,129,0.8)] animate-scan opacity-60 z-10" />
          {/* Label */}
          <div className="absolute bottom-6 left-6 z-20">
            <div className="bg-black/70 backdrop-blur-md rounded-lg px-4 py-3 border border-white/10">
              <div className="text-[10px] font-mono text-green-400 mb-1 tracking-widest">T0 — BEFORE</div>
              <div className="text-sm font-semibold text-white">Pre-Consumption</div>
            </div>
          </div>
          {/* Bounding boxes on hover */}
          {hovered === 'before' && (
            <div className="absolute inset-0 pointer-events-none z-10">
              <div className="absolute top-[20%] left-[15%] w-[30%] h-[25%] border-2 border-green-400/60 rounded animate-pulse">
                <span className="absolute -top-5 left-0 text-[9px] font-mono text-green-400 bg-black/60 px-1 rounded">Rice (0.94)</span>
              </div>
              <div className="absolute top-[50%] left-[40%] w-[25%] h-[20%] border-2 border-blue-400/60 rounded animate-pulse">
                <span className="absolute -top-5 left-0 text-[9px] font-mono text-blue-400 bg-black/60 px-1 rounded">Dal (0.96)</span>
              </div>
              <div className="absolute top-[30%] right-[15%] w-[20%] h-[30%] border-2 border-purple-400/60 rounded animate-pulse">
                <span className="absolute -top-5 left-0 text-[9px] font-mono text-purple-400 bg-black/60 px-1 rounded">Curry (0.87)</span>
              </div>
            </div>
          )}
        </div>

        {/* Center divider */}
        <div className="absolute top-0 bottom-0 left-1/2 w-[2px] bg-gradient-to-b from-transparent via-white/40 to-transparent z-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
          <div className="w-10 h-10 rounded-full bg-black border-2 border-white/30 flex items-center justify-center backdrop-blur-xl">
            <ArrowRight size={16} className="text-white" />
          </div>
        </div>

        {/* After side */}
        <div
          className="relative w-1/2 overflow-hidden cursor-pointer group"
          onMouseEnter={() => setHovered('after')}
          onMouseLeave={() => setHovered(null)}
        >
          <div
            className="absolute inset-0 transition-all duration-700 group-hover:scale-110"
            style={{ backgroundImage: `url(${MOCK_AFTER})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          />
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-500" />
          {/* Tech overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-30 group-hover:opacity-60 transition-opacity">
            <div className="absolute inset-0" style={{
              backgroundImage: 'linear-gradient(rgba(239,68,68,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(239,68,68,0.3) 1px, transparent 1px)',
              backgroundSize: '25px 25px'
            }} />
          </div>
          {/* Scanning line */}
          <div className="absolute left-0 right-0 h-[2px] bg-red-400 shadow-[0_0_20px_rgba(239,68,68,0.8)] animate-scan opacity-60 z-10" style={{ animationDelay: '1s' }} />
          {/* Label */}
          <div className="absolute bottom-6 right-6 z-20">
            <div className="bg-black/70 backdrop-blur-md rounded-lg px-4 py-3 border border-white/10">
              <div className="text-[10px] font-mono text-red-400 mb-1 tracking-widest">T1 — AFTER</div>
              <div className="text-sm font-semibold text-white">Post-Consumption</div>
            </div>
          </div>
          {/* Waste indicators on hover */}
          {hovered === 'after' && (
            <div className="absolute inset-0 pointer-events-none z-10">
              <div className="absolute top-[20%] left-[15%] w-[30%] h-[25%] border-2 border-red-400/60 rounded animate-pulse">
                <span className="absolute -top-5 left-0 text-[9px] font-mono text-red-400 bg-black/60 px-1 rounded">−35% waste</span>
              </div>
              <div className="absolute top-[50%] left-[40%] w-[25%] h-[20%] border-2 border-red-400/40 rounded animate-pulse">
                <span className="absolute -top-5 left-0 text-[9px] font-mono text-red-400 bg-black/60 px-1 rounded">−54% waste</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Corner UI brackets */}
      <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-white/30 z-30" />
      <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-white/30 z-30" />
      <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-white/30 z-30" />
      <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-white/30 z-30" />
    </div>
  );
};

// --- Landing Page ---
const LandingPage = ({ onStart }) => (
  <div className="space-y-28 animate-in fade-in duration-1000 pb-24 pt-8">

    {/* ===== Hero Section ===== */}
    <section className="space-y-16">
      {/* Text content centered */}
      <div className="text-center space-y-8 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border font-mono text-[10px] tracking-widest uppercase" style={{ borderColor: THEME.border, color: THEME.textMuted }}>
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Neural Pipeline Active — SDG 12: Responsible Consumption
        </div>
        <h1 className="text-5xl md:text-7xl font-semibold leading-[1.1] tracking-tight glow-text" style={{ color: THEME.text }}>
          Your plate tells a story.
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
            We read it.
          </span>
        </h1>
        <p className="text-lg md:text-xl leading-relaxed font-light text-gray-400 max-w-2xl mx-auto">
          EcoPlate uses a multi-stage deep learning pipeline to segment, classify, and match food items — estimating item-wise plate waste instantly from before &amp; after meal photos.
        </p>
        <div className="flex items-center justify-center gap-4 pt-2">
          <Button onClick={onStart} className="px-10 py-4 text-base">
            Try EcoPlate <ArrowRight size={18} />
          </Button>
          <Button variant="outline" className="px-8 py-4" onClick={() => window.open('https://github.com/Eshwarnath24/EcoPlate', '_blank')}>
            GitHub Repo
          </Button>
        </div>
      </div>

      {/* Plate Comparison Visual */}
      <PlateComparison />
    </section>

    {/* ===== Stats Row ===== */}
    <section className="relative">
      <div className="absolute inset-0 rounded-2xl border" style={{ borderColor: THEME.border, background: 'linear-gradient(135deg, rgba(59,130,246,0.03), rgba(121,40,202,0.03))' }} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 px-8 relative z-10">
        <AnimatedStat value={7} label="Pipeline Stages" />
        <AnimatedStat value={5} label="Food Classes" />
        <AnimatedStat value={94} suffix="%" label="Avg Confidence" />
        <AnimatedStat value={14} suffix="s" label="Inference Time" />
      </div>
    </section>

    {/* ===== How It Works — Full Pipeline ===== */}
    <section className="space-y-14">
      <div className="text-center space-y-4">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">How the Pipeline Works</h2>
        <p className="max-w-2xl mx-auto font-light text-gray-400">
          A 7-stage neural pipeline — from raw image input to actionable waste analytics.
        </p>
      </div>

      <div className="relative">
        {/* Vertical connecting line */}
        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-blue-500/30 via-purple-500/20 to-transparent -translate-x-1/2" />

        <div className="space-y-6">
          {PIPELINE_STAGES.map((step, i) => {
            const isLeft = i % 2 === 0;
            const icons = [
              <Eye size={20} />,
              <Scan size={20} />,
              <Layers size={20} />,
              <Cpu size={20} />,
              <GitMerge size={20} />,
              <BarChart3 size={20} />,
              <Activity size={20} />,
            ];
            return (
              <div key={step.id} className={`flex items-center gap-6 ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                {/* Card */}
                <div className={`flex-1 ${isLeft ? 'md:text-right' : 'md:text-left'}`}>
                  <div className="bg-[#0A0A0A] p-6 rounded-xl border group hover:bg-[#111] hover:border-white/20 transition-all duration-300 inline-block max-w-md" style={{ borderColor: THEME.border }}>
                    <div className={`flex items-center gap-3 mb-3 ${isLeft ? 'md:flex-row-reverse' : ''}`}>
                      <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 group-hover:text-white group-hover:border-white/30 group-hover:scale-110 transition-all shrink-0">
                        {icons[i]}
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-blue-400/70 mb-0.5">STAGE {i + 1}</div>
                        <h3 className="font-semibold text-sm text-white">{step.name}</h3>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{step.details}</p>
                  </div>
                </div>

                {/* Center dot */}
                <div className="hidden md:flex w-8 h-8 rounded-full bg-[#0A0A0A] border border-white/20 items-center justify-center shrink-0 z-10 group">
                  <div className="w-3 h-3 rounded-full bg-blue-500/50" />
                </div>

                {/* Spacer for other side */}
                <div className="flex-1 hidden md:block" />
              </div>
            );
          })}
        </div>
      </div>
    </section>

    {/* ===== Tech Stack ===== */}
    <section className="space-y-10">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-semibold tracking-tight">Built With</h2>
      </div>
      <div className="flex flex-wrap justify-center gap-4">
        {[
          'PyTorch', 'U-Net', 'MobileNetV3', 'Siamese Network', 'OpenCV', 'React', 'Vite',
        ].map((tech) => (
          <div key={tech} className="px-5 py-2.5 rounded-lg border bg-white/[0.02] hover:bg-white/[0.05] transition-colors font-mono text-sm text-gray-400 hover:text-white" style={{ borderColor: THEME.border }}>
            {tech}
          </div>
        ))}
      </div>
    </section>

    {/* ===== Contact Us ===== */}
    <section className="space-y-10">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-semibold tracking-tight">Contact Us</h2>
        <p className="max-w-xl mx-auto font-light text-gray-400">
          Have questions or want to collaborate? Reach out to the team.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5 max-w-lg mx-auto">
        {[
          { name: 'Eshwarnath G', role: 'Full Stack · DL · Pipelines', email: 'eshwarnath@example.com', github: 'Eshwarnath24' },
          { name: 'Lohith', role: 'Full Stack · DL · Pipelines', email: 'lohith@example.com', github: '' },
        ].map((member) => (
          <div key={member.name} className="bg-[#0A0A0A] rounded-xl border p-6 group hover:bg-[#111] hover:border-white/20 transition-all duration-300 text-center" style={{ borderColor: THEME.border }}>
            {/* Avatar */}
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center mx-auto mb-4 group-hover:border-white/30 transition-colors">
              <span className="text-lg font-semibold text-white/70 group-hover:text-white transition-colors">
                {member.name.split(' ').map(w => w[0]).join('')}
              </span>
            </div>
            <h3 className="font-semibold text-sm text-white mb-1">{member.name}</h3>
            <p className="text-xs text-gray-500 font-mono mb-4">{member.role}</p>
            <div className="flex items-center justify-center gap-3">
              <a href={`mailto:${member.email}`} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/30 transition-all" title="Email">
                <Mail size={14} />
              </a>
              {member.github && (
                <a href={`https://github.com/${member.github}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/30 transition-all" title="GitHub">
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>

    {/* ===== CTA ===== */}
    <section className="text-center space-y-6 pt-8">
      <div className="inline-flex items-center gap-2 text-gray-500 font-mono text-xs">
        <Utensils size={14} /> Built for Neural Networks &amp; Deep Learning Course
      </div>
      <div>
        <Button onClick={onStart} className="px-12 py-5 text-lg">
          Analyze Your Plate <ChevronRight size={20} />
        </Button>
      </div>
    </section>
  </div>
);

export default LandingPage;
