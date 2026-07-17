import React, { useState } from 'react';
import { ArrowRight, Layers, Leaf, Mail, ExternalLink, Zap, Target, TrendingDown, Scan, Cpu, GitMerge, BarChart3 } from 'lucide-react';
import CodedNatureBackground from '../components/CodedNatureBackground';
import Reveal from '../components/Reveal';
import AnimatedStat from '../components/AnimatedStat';
import SectionDivider from '../components/SectionDivider';
import PlateComparison from '../components/PlateComparison';

const THEME = {
  primary: '#1F4D3A',
  success: '#4CAF50',
  accent: '#D9A441',
  waste: '#EF4444',
  surface: '#F8FAFC',
  border: '#E2E8F0',
  text: '#0F172A',
  textMuted: '#64748B'
};

const PIPELINE_STAGES = [
  { id: 1, name: 'Semantic Segmentation', details: <span>Isolates distinct food items and boundaries from the background using a customized <strong className="font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">U-Net architecture</strong>.</span> },
  { id: 2, name: 'Feature Extraction', details: <span>Generates deep, multidimensional embeddings for each detected food cluster to capture textures and colors.</span> },
  { id: 3, name: 'Item Classification', details: <span>Identifies specific food categories (e.g., Rice, Dal, Chapati) utilizing a fine-tuned <strong className="font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">MobileNetV3</strong>.</span> },
  { id: 4, name: 'Siamese Matching', details: <span>Correlates pre-consumption and post-consumption food items across plates using a <strong className="font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">Siamese Network</strong>.</span> },
  { id: 5, name: 'Waste Analytics', details: <span>Calculates the volumetric and pixel-wise area differences to accurately estimate item-wise waste percentages.</span> }
];

const Button = ({ children, onClick, className = '', variant = 'primary' }) => {
  const baseStyle = "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-300 active:scale-95";
  const style = variant === 'primary'
    ? { backgroundColor: THEME.primary, color: 'white', border: 'none' }
    : { backgroundColor: 'transparent', borderColor: THEME.border, color: THEME.text, border: '2px solid' };

  return (
    <button onClick={onClick} className={`${baseStyle} ${className} hover:opacity-90`} style={style}>
      {children}
    </button>
  );
};

const Navbar = ({ onStart }) => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-white/40 backdrop-blur-lg border-b shadow-sm transition-all duration-300" style={{ borderColor: 'rgba(255,255,255,0.4)' }}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-16">

        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer transition-transform hover:scale-105" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-sm" style={{ border: `1px solid ${THEME.primary}30` }}>
            🌱
          </div>
          <span className="text-xl font-bold tracking-wide drop-shadow-sm" style={{ color: THEME.text }}>
            Eco<span style={{ color: THEME.primary }}>Plate</span>
          </span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold" style={{ color: THEME.textMuted }}>
          <a href="#pipeline" className="hover:text-[#1F4D3A] transition-colors">Pipeline</a>
          <a href="#tech" className="hover:text-[#1F4D3A] transition-colors">Technology</a>
          <a href="#team" className="hover:text-[#1F4D3A] transition-colors">Team</a>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <a href="https://github.com/Eshwarnath24/EcoPlate" target="_blank" rel="noopener noreferrer" className="hidden sm:flex w-9 h-9 rounded-full border bg-white/50 items-center justify-center transition-all hover:shadow-md hover:bg-white" style={{ borderColor: 'rgba(226, 232, 240, 1)', color: THEME.textMuted }} title="GitHub">
            <ExternalLink size={16} />
          </a>
          <Button onClick={onStart} className="px-5 py-2 text-sm shadow-md hover:shadow-lg">
            Try App
          </Button>
        </div>

      </div>
    </div>
  </nav>
);

const LandingPage = ({ onStart }) => (
  <div className="pb-0 pt-20 relative min-h-screen font-sans selection:bg-green-200">
    <style>{`html { scroll-behavior: smooth; }`}</style>
    <Navbar onStart={onStart} />
    <CodedNatureBackground />

    {/* ===== Hero Section ===== */}
    <section className="space-y-14 mb-28 mt-12 relative z-10 px-4">
      <Reveal direction="from-bottom">
        <div className="text-center space-y-8 max-w-4xl mx-auto p-8 md:p-12">

          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border font-mono text-[11px] tracking-[0.15em] uppercase shadow-sm bg-white/20 backdrop-blur-sm" style={{ borderColor: 'rgba(255,255,255,0.4)', color: THEME.primary }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: THEME.success }} />
            Neural Pipeline Active — SDG 12: Responsible Consumption
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold leading-[1.05] tracking-tight text-slate-900 animate-in fade-in duration-700" style={{ textShadow: '0px 0px 45px rgba(255,255,255,1), 0px 2px 4px rgba(0,0,0,0.08)' }}>
            Your plate <span className="font-serif-italic font-medium text-emerald-900">tells a story.</span>
            <br />
            <span className="relative inline-block mt-4 px-6 py-2 select-none">
              <span className="absolute inset-0 rounded-2xl bg-emerald-50/90 border border-emerald-100/80 shadow-sm -rotate-1"></span>
              <span className="relative text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(135deg, ${THEME.primary}, ${THEME.success})`, WebkitBackgroundClip: 'text', textShadow: 'none' }}>
                We read it.
              </span>
            </span>
          </h1>

          <div className="max-w-2xl mx-auto bg-white/45 backdrop-blur-md border border-white/50 rounded-2xl p-6 shadow-sm">
            <p className="text-base md:text-lg leading-relaxed font-semibold text-slate-800">
              EcoPlate uses a multi-stage deep learning pipeline to segment, classify, and match food items — estimating item-wise plate waste from before &amp; after meal photos.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-4">
            <Button onClick={onStart} className="w-full sm:w-auto px-12 py-4 text-lg shadow-lg hover:scale-105 group">
              Try EcoPlate <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform duration-300" />
            </Button>
            <Button variant="outline" className="w-full sm:w-auto px-10 py-4 text-lg bg-white/40 backdrop-blur-sm hover:bg-white/80 hover:scale-105 border-slate-400 group" onClick={() => window.open('https://github.com/Eshwarnath24/EcoPlate', '_blank')}>
              <ExternalLink size={18} className="group-hover:scale-110 transition-transform duration-300" /> GitHub
            </Button>
          </div>
        </div>
      </Reveal>

      <Reveal delay={200} direction="zoom-in">
        <div className="max-w-6xl mx-auto">
          <PlateComparison />
        </div>
      </Reveal>
    </section>

    {/* ===== Container for Stats, Pipeline, Tech Stack, Team, Footer ===== */}
    {/* Explicitly 30% white and blue with heavy blur */}
    <div className="relative z-10 w-full rounded-t-[3rem] pt-16 mt-12 border-t"
      style={{
        background: 'linear-gradient(160deg, rgba(255, 255, 255, 0.3), rgba(219, 234, 254, 0.3))',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        boxShadow: '0 -20px 60px rgba(0,0,0,0.05)'
      }}>

      {/* ===== Stats Row ===== */}
      <section className="relative mb-28 max-w-6xl mx-auto px-4">
        <Reveal direction="zoom-in">
          <div className="absolute inset-0 rounded-3xl border shadow-sm mx-4" style={{ borderColor: 'rgba(255,255,255,0.6)', backgroundColor: 'rgba(255,255,255,0.4)' }} />
        </Reveal>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-10 px-10 relative z-10">
          <Reveal delay={0} direction="from-bottom"><AnimatedStat value={5} label="Pipeline Stages" icon={<Layers size={22} />} /></Reveal>
          <Reveal delay={100} direction="from-bottom"><AnimatedStat value={12} label="Food Classes" icon={<Target size={22} />} /></Reveal>
          <Reveal delay={200} direction="from-bottom"><AnimatedStat value={94} suffix="%" label="Avg Confidence" icon={<Zap size={22} />} /></Reveal>
          <Reveal delay={300} direction="from-bottom"><AnimatedStat value={850} suffix="ms" label="Inference Speed" icon={<TrendingDown size={22} />} /></Reveal>
        </div>
      </section>

      <SectionDivider />

      {/* ===== How It Works — Full Pipeline ===== */}
      <section id="pipeline" className="my-28 relative z-10 px-4 scroll-mt-24">
        <Reveal direction="from-bottom">
          <div className="text-center space-y-6 mb-16 p-8 rounded-3xl flex flex-col items-center w-full bg-white/45 backdrop-blur-md border border-white/50 shadow-sm">
            <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border font-semibold text-xs tracking-[0.2em] uppercase shadow-sm bg-emerald-50/90" style={{ borderColor: 'rgba(31, 77, 58, 0.25)', color: THEME.primary }}>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Architecture Overview
            </div>
            <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900">
              How the Pipeline <span className="font-serif-italic font-medium text-emerald-800">Works</span>
            </h2>
            <p className="max-w-2xl mx-auto text-lg md:text-xl font-medium text-slate-700 leading-relaxed">
              A 5-stage neural pipeline — from raw image input to actionable waste analytics.
            </p>
          </div>
        </Reveal>

        <div className="relative max-w-5xl mx-auto">
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-[2px] -translate-x-1/2" style={{ background: `linear-gradient(to bottom, ${THEME.primary}40, ${THEME.accent}30, transparent)` }} />

          <div className="space-y-6">
            {PIPELINE_STAGES.map((step, i) => {
              const isLeft = i % 2 === 0;
              const icons = [
                <Scan size={24} />,
                <Layers size={24} />,
                <Cpu size={24} />,
                <GitMerge size={24} />,
                <BarChart3 size={24} />,
              ];
              const stageColors = [THEME.primary, THEME.success, THEME.accent, THEME.primary, THEME.waste];
              return (
                <Reveal key={step.id} delay={i * 150} direction={isLeft ? 'from-left' : 'from-right'}>
                  <div className={`flex flex-col md:flex-row items-center gap-6 ${isLeft ? '' : 'md:flex-row-reverse'}`}>
                    <div className={`flex-1 w-full ${isLeft ? 'md:text-right flex md:justify-end' : 'md:text-left flex md:justify-start'}`}>
                      <div className="p-8 rounded-2xl border backdrop-blur-md group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 w-full md:max-w-md text-left bg-white/80" style={{ borderColor: 'rgba(255,255,255,0.9)' }}>
                        <div className={`flex items-center gap-4 mb-4 ${isLeft ? 'md:flex-row-reverse' : ''}`}>
                          <div className="w-12 h-12 rounded-2xl border flex items-center justify-center group-hover:scale-110 transition-all shrink-0 bg-white shadow-md" style={{ borderColor: `${stageColors[i]}30`, color: stageColors[i] }}>
                            {icons[i]}
                          </div>
                          <div className={isLeft ? 'md:text-right' : ''}>
                            <div className="text-xs font-bold tracking-[0.2em]" style={{ color: stageColors[i] }}>STAGE {i + 1}</div>
                            <h3 className="font-extrabold text-xl tracking-tight text-slate-900">{step.name}</h3>
                          </div>
                        </div>
                        <p className="text-[15px] leading-relaxed text-slate-700">{step.details}</p>
                      </div>
                    </div>

                    <div className="hidden md:flex w-10 h-10 rounded-full border-2 items-center justify-center shrink-0 z-10 bg-white/80 backdrop-blur-md" style={{ borderColor: 'rgba(255,255,255,0.9)' }}>
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: `${stageColors[i]}90` }} />
                    </div>

                    <div className="flex-1 hidden md:block" />
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ===== Tech Stack ===== */}
      <section id="tech" className="my-28 relative z-10 px-4 scroll-mt-24">
        <Reveal direction="from-bottom">
          <div className="text-center space-y-6 mb-14 p-8 rounded-3xl flex flex-col items-center w-full bg-white/45 backdrop-blur-md border border-white/50 shadow-sm">
            <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border font-semibold text-xs tracking-[0.2em] uppercase shadow-sm bg-emerald-50/90" style={{ borderColor: 'rgba(31, 77, 58, 0.25)', color: THEME.primary }}>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Technology
            </div>
            <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900">
              Built <span className="font-serif-italic font-medium text-emerald-800">With</span>
            </h2>
            <p className="max-w-xl mx-auto text-lg md:text-xl font-medium text-slate-700 leading-relaxed">
              Industry-grade deep learning frameworks and modern web technologies.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {[
            { name: 'PyTorch', desc: 'Deep Learning' },
            { name: 'U-Net', desc: 'Segmentation' },
            { name: 'MobileNetV3', desc: 'Classification' },
            { name: 'Siamese Net', desc: 'Matching' },
            { name: 'OpenCV', desc: 'Image Processing' },
            { name: 'React', desc: 'Frontend' },
            { name: 'Tailwind CSS', desc: 'Styling' },
            { name: 'Python', desc: 'Backend' },
          ].map((tech, i) => (
            <Reveal key={tech.name} delay={i * 50} direction="zoom-in">
              <div className="px-6 py-7 rounded-2xl border bg-white/80 backdrop-blur-md transition-all duration-300 cursor-default hover:shadow-lg hover:-translate-y-1 hover:border-emerald-600/30 text-center group h-full" style={{ borderColor: 'rgba(255,255,255,0.9)' }}>
                <div className="font-bold text-lg mb-2 group-hover:text-[#1F4D3A] transition-colors text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>{tech.name}</div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-emerald-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>{tech.desc}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <SectionDivider />

      {/* ===== Team ===== */}
      <section id="team" className="my-28 relative z-10 px-4 scroll-mt-24">
        <Reveal direction="from-bottom">
          <div className="text-center space-y-6 mb-14 p-8 rounded-3xl flex flex-col items-center w-full bg-white/45 backdrop-blur-md border border-white/50 shadow-sm">
            <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border font-semibold text-xs tracking-[0.2em] uppercase shadow-sm bg-emerald-50/90" style={{ borderColor: 'rgba(31, 77, 58, 0.25)', color: THEME.primary }}>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Team
            </div>
            <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900">
              Meet the <span className="font-serif-italic font-medium text-emerald-800">Team</span>
            </h2>
            <p className="max-w-xl mx-auto text-lg md:text-xl font-medium text-slate-700 leading-relaxed">
              Built by students passionate about AI and sustainable development.
            </p>
          </div>
        </Reveal>

        <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {[
            { name: 'Gajula Eshwarnath', role: 'Full Stack · Deep Learning', email: 'gajulaeshwarnath24@gmail.com', github: 'Eshwarnath24' },
            { name: 'Kalepu Lohith', role: 'Full Stack · Deep Learning', email: 'lohithkalepu@gmail.com', github: 'Lohi712' },
          ].map((member, i) => (
            <Reveal key={member.name} delay={i * 150} direction="from-bottom">
              <div className="rounded-3xl border p-8 group hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 text-center bg-white/80 backdrop-blur-md h-full" style={{ borderColor: 'rgba(255,255,255,0.9)' }}>
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 bg-gradient-to-br from-emerald-50 to-white transition-all group-hover:scale-110 shadow-md border-2" style={{ borderColor: 'rgba(31, 77, 58, 0.15)' }}>
                  <span className="text-2xl font-bold tracking-wider text-emerald-800">
                    {member.name.split(' ').map(w => w[0]).join('')}
                  </span>
                </div>
                <h3 className="font-extrabold text-xl mb-1 text-slate-800">{member.name}</h3>
                <p className="text-xs font-bold mb-5 tracking-widest text-emerald-800 uppercase">{member.role}</p>
                <div className="flex items-center justify-center gap-3">
                  <a href={`mailto:${member.email}`} className="w-10 h-10 rounded-xl border bg-white flex items-center justify-center transition-all hover:shadow-md hover:scale-110 hover:border-emerald-600/30" style={{ borderColor: 'rgba(226, 232, 240, 1)', color: THEME.primary }} title="Email">
                    <Mail size={16} />
                  </a>
                  {member.github && (
                    <a href={`https://github.com/${member.github}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl border bg-white flex items-center justify-center transition-all hover:shadow-md hover:scale-110 hover:border-emerald-600/30" style={{ borderColor: 'rgba(226, 232, 240, 1)', color: THEME.primary }} title="GitHub">
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="border-t pt-14 pb-12 relative z-10 bg-white/85 backdrop-blur-lg px-4" style={{ borderColor: 'rgba(31, 77, 58, 0.12)' }}>
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="flex items-center justify-center gap-2">
            <span className="text-3xl drop-shadow-sm">🌱</span>
            <span className="font-extrabold text-2xl tracking-wide drop-shadow-sm text-slate-900">
              Eco<span style={{ color: THEME.primary }}>Plate</span>
            </span>
          </div>
          <p className="text-base font-semibold max-w-lg mx-auto text-slate-700 leading-relaxed">
            Reducing food waste through intelligent plate analysis.
            <br />
            <span className="text-sm font-medium text-slate-500">Built for Neural Networks &amp; Deep Learning Course.</span>
          </p>
          <div className="flex items-center justify-center gap-6 text-sm font-semibold tracking-wide text-slate-600">
            <span>© 2026 EcoPlate</span>
            <span className="text-slate-300">•</span>
            <a href="https://github.com/Eshwarnath24/EcoPlate" target="_blank" rel="noopener noreferrer" className="text-emerald-800 hover:text-emerald-950 underline decoration-2 underline-offset-4 transition-colors">
              GitHub
            </a>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-800 px-2.5 py-0.5 bg-emerald-50 rounded border border-emerald-100 text-xs uppercase tracking-wider font-bold">SDG 12</span>
          </div>
        </div>
      </footer>

    </div>
    {/* End of Container */}

  </div>
);

export default LandingPage;