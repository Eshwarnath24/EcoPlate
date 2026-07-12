import React, { useState, useEffect, useRef } from 'react';
import { Scan, Layers, Cpu, GitMerge, ArrowRight, BarChart3, Leaf, Mail, ExternalLink, Zap, Target, TrendingDown } from 'lucide-react';
import { THEME, MOCK_BEFORE, MOCK_AFTER, PIPELINE_STAGES } from '../theme';
import Button from '../components/Button';

// --- Scroll-Reveal Wrapper ---
const Reveal = ({ children, delay = 0, className = '' }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(32px)',
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

// --- Animated Stat Counter ---
const AnimatedStat = ({ value, suffix = '', label, icon }) => {
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
    <div ref={ref} className="text-center py-6 group">
      <div className="flex justify-center mb-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
          style={{ backgroundColor: `${THEME.primary}10`, color: THEME.primary }}>
          {icon}
        </div>
      </div>
      <div className="text-4xl md:text-5xl font-bold tracking-tight" style={{ color: THEME.primary }}>
        {count}{suffix}
      </div>
      <div className="text-xs mt-2 font-mono uppercase tracking-[0.2em]" style={{ color: THEME.textMuted }}>{label}</div>
    </div>
  );
};

// --- Before/After Plate Visual ---
const PlateComparison = () => {
  const [hovered, setHovered] = useState(null);

  return (
    <div className="relative w-full h-[520px] md:h-[600px] rounded-3xl overflow-hidden shadow-2xl" style={{ border: `1px solid ${THEME.border}` }}>
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent group-hover:from-black/40 transition-all duration-500" />
          <div className="absolute left-0 right-0 h-[2px] animate-scan opacity-60 z-10" style={{ backgroundColor: THEME.success, boxShadow: `0 0 20px ${THEME.success}` }} />
          <div className="absolute bottom-8 left-8 z-20">
            <div className="backdrop-blur-md rounded-xl px-5 py-4 border" style={{ backgroundColor: 'rgba(31,77,58,0.85)', borderColor: 'rgba(255,255,255,0.15)' }}>
              <div className="text-[10px] font-mono mb-1 tracking-[0.2em] uppercase" style={{ color: THEME.accent }}>T0 — Before</div>
              <div className="text-base font-semibold text-white">Pre-Consumption</div>
            </div>
          </div>
          {hovered === 'before' && (
            <div className="absolute inset-0 pointer-events-none z-10">
              {/* Dal — bowl, upper-left area */}
              <div className="absolute top-[14%] left-[18%] w-[28%] h-[30%] border-2 rounded-lg animate-pulse" style={{ borderColor: THEME.success }}>
                <span className="absolute -top-5 left-0 text-[10px] font-mono px-2 py-0.5 rounded" style={{ color: THEME.success, backgroundColor: 'rgba(31,77,58,0.9)' }}>Dal (0.95)</span>
              </div>
              {/* Rice — right side, upper area */}
              <div className="absolute top-[12%] left-[53%] w-[30%] h-[34%] border-2 rounded-lg animate-pulse" style={{ borderColor: THEME.accent }}>
                <span className="absolute -top-5 right-0 text-[10px] font-mono px-2 py-0.5 rounded" style={{ color: THEME.accent, backgroundColor: 'rgba(31,77,58,0.9)' }}>Rice (0.93)</span>
              </div>
              {/* Chapati — bottom center */}
              <div className="absolute top-[56%] left-[16%] w-[44%] h-[24%] border-2 rounded-lg animate-pulse" style={{ borderColor: '#D9A441' }}>
                <span className="absolute -bottom-5 left-0 text-[10px] font-mono px-2 py-0.5 rounded" style={{ color: '#D9A441', backgroundColor: 'rgba(31,77,58,0.9)' }}>Chapati (0.91)</span>
              </div>
            </div>
          )}
        </div>

        {/* Center divider */}
        <div className="absolute top-0 bottom-0 left-1/2 w-[2px] bg-gradient-to-b from-transparent via-white/60 to-transparent z-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
          <div className="w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-xl border-2 shadow-xl" style={{ backgroundColor: THEME.primary, borderColor: 'rgba(255,255,255,0.3)' }}>
            <ArrowRight size={20} className="text-white" />
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent group-hover:from-black/40 transition-all duration-500" />
          <div className="absolute left-0 right-0 h-[2px] animate-scan opacity-60 z-10" style={{ backgroundColor: THEME.waste, boxShadow: `0 0 20px ${THEME.waste}`, animationDelay: '1s' }} />
          <div className="absolute bottom-8 right-8 z-20">
            <div className="backdrop-blur-md rounded-xl px-5 py-4 border" style={{ backgroundColor: 'rgba(31,77,58,0.85)', borderColor: 'rgba(255,255,255,0.15)' }}>
              <div className="text-[10px] font-mono mb-1 tracking-[0.2em] uppercase" style={{ color: THEME.waste }}>T1 — After</div>
              <div className="text-base font-semibold text-white">Post-Consumption</div>
            </div>
          </div>
          {hovered === 'after' && (
            <div className="absolute inset-0 pointer-events-none z-10">
              {/* Dal — bowl, partially consumed */}
              <div className="absolute top-[10%] left-[18%] w-[24%] h-[28%] border-2 rounded-lg animate-pulse" style={{ borderColor: THEME.waste }}>
                <span className="absolute -top-5 left-0 text-[10px] font-mono px-2 py-0.5 rounded" style={{ color: '#FCA5A5', backgroundColor: 'rgba(179,69,44,0.9)' }}>Dal −40%</span>
              </div>
              {/* Rice — scattered remains */}
              <div className="absolute top-[10%] left-[52%] w-[30%] h-[30%] border-2 rounded-lg animate-pulse" style={{ borderColor: THEME.waste }}>
                <span className="absolute -top-5 right-0 text-[10px] font-mono px-2 py-0.5 rounded" style={{ color: '#FCA5A5', backgroundColor: 'rgba(179,69,44,0.9)' }}>Rice −55%</span>
              </div>
              {/* Chapati — torn piece */}
              <div className="absolute top-[50%] left-[20%] w-[34%] h-[26%] border-2 rounded-lg animate-pulse" style={{ borderColor: THEME.waste }}>
                <span className="absolute -bottom-5 left-0 text-[10px] font-mono px-2 py-0.5 rounded" style={{ color: '#FCA5A5', backgroundColor: 'rgba(179,69,44,0.9)' }}>Chapati −30%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Corner brackets */}
      <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 z-30" style={{ borderColor: 'rgba(255,255,255,0.4)' }} />
      <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 z-30" style={{ borderColor: 'rgba(255,255,255,0.4)' }} />
      <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 z-30" style={{ borderColor: 'rgba(255,255,255,0.4)' }} />
      <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 z-30" style={{ borderColor: 'rgba(255,255,255,0.4)' }} />
    </div>
  );
};

// --- Section Divider ---
const SectionDivider = () => (
  <div className="flex items-center gap-4 max-w-xs mx-auto">
    <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${THEME.border})` }} />
    <Leaf size={14} style={{ color: THEME.accent }} />
    <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, transparent, ${THEME.border})` }} />
  </div>
);

// --- Landing Page ---
const LandingPage = ({ onStart }) => (
  <div className="pb-0 pt-6">

    {/* ===== Hero Section ===== */}
    <section className="space-y-14 mb-28">
      <Reveal>
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border font-mono text-[11px] tracking-[0.15em] uppercase" style={{ borderColor: THEME.border, color: THEME.textMuted, backgroundColor: THEME.surface }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: THEME.success }} />
            Neural Pipeline Active — SDG 12: Responsible Consumption
          </div>
          <h1 className="text-6xl md:text-8xl font-bold leading-[1.05] tracking-tight" style={{ color: THEME.text }}>
            Your plate tells a story.
            <br />
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(135deg, ${THEME.primary}, ${THEME.success}, ${THEME.accent})`, WebkitBackgroundClip: 'text' }}>
              We read it.
            </span>
          </h1>
          <p className="text-lg md:text-xl leading-relaxed font-light max-w-2xl mx-auto" style={{ color: THEME.textMuted }}>
            EcoPlate uses a multi-stage deep learning pipeline to segment, classify, and match food items — estimating item-wise plate waste from before &amp; after meal photos.
          </p>
          <div className="flex items-center justify-center gap-5 pt-4">
            <Button onClick={onStart} className="px-12 py-5 text-lg">
              Try EcoPlate <ArrowRight size={20} />
            </Button>
            <Button variant="outline" className="px-10 py-5 text-lg" onClick={() => window.open('https://github.com/Eshwarnath24/EcoPlate', '_blank')}>
              <ExternalLink size={18} /> GitHub
            </Button>
          </div>
        </div>
      </Reveal>

      <Reveal delay={200}>
        <PlateComparison />
      </Reveal>
    </section>

    {/* ===== Stats Row ===== */}
    <Reveal>
      <section className="relative mb-28">
        <div className="absolute inset-0 rounded-3xl border shadow-sm" style={{ borderColor: THEME.border, backgroundColor: THEME.surface }} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-10 px-10 relative z-10">
          <AnimatedStat value={5} label="Pipeline Stages" icon={<Layers size={22} />} />
          <AnimatedStat value={5} label="Food Classes" icon={<Target size={22} />} />
          <AnimatedStat value={94} suffix="%" label="Avg Confidence" icon={<Zap size={22} />} />
          <AnimatedStat value={14} suffix="s" label="Inference Time" icon={<TrendingDown size={22} />} />
        </div>
      </section>
    </Reveal>

    <SectionDivider />

    {/* ===== How It Works — Full Pipeline ===== */}
    <section className="my-28">
      <Reveal>
        <div className="text-center space-y-5 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border font-mono text-[10px] tracking-[0.2em] uppercase" style={{ borderColor: THEME.border, color: THEME.accent, backgroundColor: THEME.surface }}>
            Architecture Overview
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight" style={{ color: THEME.text }}>How the Pipeline Works</h2>
          <p className="max-w-2xl mx-auto text-lg font-light" style={{ color: THEME.textMuted }}>
            A 5-stage neural pipeline — from raw image input to actionable waste analytics.
          </p>
        </div>
      </Reveal>

      <div className="relative">
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
              <Reveal key={step.id} delay={i * 100}>
                <div className={`flex items-center gap-6 ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  <div className={`flex-1 ${isLeft ? 'md:text-right' : 'md:text-left'}`}>
                    <div className="p-7 rounded-2xl border group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 inline-block w-full md:max-w-lg" style={{ backgroundColor: THEME.surface, borderColor: THEME.border }}>
                      <div className={`flex items-center gap-4 mb-4 ${isLeft ? 'md:flex-row-reverse' : ''}`}>
                        <div className="w-12 h-12 rounded-2xl border flex items-center justify-center group-hover:scale-110 transition-all shrink-0" style={{ backgroundColor: `${stageColors[i]}10`, borderColor: `${stageColors[i]}30`, color: stageColors[i] }}>
                          {icons[i]}
                        </div>
                        <div>
                          <div className="text-[10px] font-mono mb-1 font-semibold tracking-[0.2em]" style={{ color: stageColors[i] }}>STAGE {i + 1}</div>
                          <h3 className="font-bold text-lg" style={{ color: THEME.text }}>{step.name}</h3>
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: THEME.textMuted }}>{step.details}</p>
                    </div>
                  </div>

                  <div className="hidden md:flex w-10 h-10 rounded-full border-2 items-center justify-center shrink-0 z-10" style={{ backgroundColor: THEME.surface, borderColor: THEME.border }}>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: `${stageColors[i]}60` }} />
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
    <section className="my-28">
      <Reveal>
        <div className="text-center space-y-5 mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border font-mono text-[10px] tracking-[0.2em] uppercase" style={{ borderColor: THEME.border, color: THEME.accent, backgroundColor: THEME.surface }}>
            Technology
          </div>
          <h2 className="text-4xl font-bold tracking-tight" style={{ color: THEME.text }}>Built With</h2>
          <p className="max-w-xl mx-auto text-base font-light" style={{ color: THEME.textMuted }}>
            Industry-grade deep learning frameworks and modern web technologies.
          </p>
        </div>
      </Reveal>
      <Reveal delay={150}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {[
            { name: 'PyTorch', desc: 'Deep Learning' },
            { name: 'U-Net', desc: 'Segmentation' },
            { name: 'MobileNetV3', desc: 'Classification' },
            { name: 'Siamese Net', desc: 'Matching' },
            { name: 'OpenCV', desc: 'Image Processing' },
            { name: 'React', desc: 'Frontend' },
            { name: 'Vite', desc: 'Build Tool' },
            { name: 'Python', desc: 'Backend' },
          ].map((tech) => (
            <div key={tech.name} className="px-5 py-5 rounded-2xl border transition-all duration-300 cursor-default hover:shadow-md hover:-translate-y-0.5 text-center group" style={{ borderColor: THEME.border, backgroundColor: THEME.surface }}>
              <div className="font-semibold text-sm mb-1 group-hover:tracking-wider transition-all" style={{ color: THEME.text }}>{tech.name}</div>
              <div className="text-[10px] font-mono uppercase tracking-widest" style={{ color: THEME.textMuted }}>{tech.desc}</div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>

    <SectionDivider />

    {/* ===== Team ===== */}
    <section className="my-28">
      <Reveal>
        <div className="text-center space-y-5 mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border font-mono text-[10px] tracking-[0.2em] uppercase" style={{ borderColor: THEME.border, color: THEME.accent, backgroundColor: THEME.surface }}>
            Team
          </div>
          <h2 className="text-4xl font-bold tracking-tight" style={{ color: THEME.text }}>Meet the Team</h2>
          <p className="max-w-xl mx-auto text-base font-light" style={{ color: THEME.textMuted }}>
            Built by students passionate about AI and sustainable development.
          </p>
        </div>
      </Reveal>

      <Reveal delay={150}>
        <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {[
            { name: 'Gajula Eshwarnath', role: 'Full Stack · Deep Learning', email: 'gajulaeshwarnath24@gmail.com', github: 'Eshwarnath24' },
            { name: 'Kalepu Lohith', role: 'Full Stack · Deep Learning', email: 'lohithkalepu@gmail.com', github: 'Lohi712' },
          ].map((member) => (
            <div key={member.name} className="rounded-2xl border p-8 group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-center" style={{ backgroundColor: THEME.surface, borderColor: THEME.border }}>
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 transition-all group-hover:scale-105" style={{ background: `linear-gradient(135deg, ${THEME.primary}18, ${THEME.accent}18)`, border: `2px solid ${THEME.primary}25` }}>
                <span className="text-2xl font-bold" style={{ color: THEME.primary }}>
                  {member.name.split(' ').map(w => w[0]).join('')}
                </span>
              </div>
              <h3 className="font-bold text-lg mb-1" style={{ color: THEME.text }}>{member.name}</h3>
              <p className="text-xs font-mono mb-5 tracking-wide" style={{ color: THEME.textMuted }}>{member.role}</p>
              <div className="flex items-center justify-center gap-3">
                <a href={`mailto:${member.email}`} className="w-10 h-10 rounded-xl border flex items-center justify-center transition-all hover:shadow-md hover:scale-105" style={{ borderColor: THEME.border, color: THEME.textMuted }} title="Email">
                  <Mail size={16} />
                </a>
                {member.github && (
                  <a href={`https://github.com/${member.github}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl border flex items-center justify-center transition-all hover:shadow-md hover:scale-105" style={{ borderColor: THEME.border, color: THEME.textMuted }} title="GitHub">
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>

    {/* ===== Footer ===== */}
    <footer className="border-t pt-12 pb-10" style={{ borderColor: THEME.border }}>
      <div className="max-w-4xl mx-auto text-center space-y-5">
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl">🌱</span>
          <span className="font-bold text-lg tracking-wide" style={{ color: THEME.text }}>
            Eco<span style={{ color: THEME.accent }}>Plate</span>
          </span>
        </div>
        <p className="text-sm font-light max-w-md mx-auto" style={{ color: THEME.textMuted }}>
          Reducing food waste through intelligent plate analysis. Built for Neural Networks &amp; Deep Learning Course.
        </p>
        <div className="flex items-center justify-center gap-6 text-xs font-mono" style={{ color: THEME.textMuted }}>
          <span>© 2026 EcoPlate</span>
          <span style={{ color: THEME.border }}>·</span>
          <a href="https://github.com/Eshwarnath24/EcoPlate" target="_blank" rel="noopener noreferrer" className="hover:underline transition-colors" style={{ color: THEME.primary }}>
            GitHub
          </a>
          <span style={{ color: THEME.border }}>·</span>
          <span>SDG 12</span>
        </div>
      </div>
    </footer>
  </div>
);

export default LandingPage;
