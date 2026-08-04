import React, { useState } from 'react';
import { ArrowRight, Layers, Leaf, Mail, ExternalLink, Zap, Target, TrendingDown, Scan, Cpu, GitMerge, BarChart3, ChefHat } from 'lucide-react';
import CodedNatureBackground from '../components/CodedNatureBackground';
import Reveal from '../components/Reveal';
import AnimatedStat from '../components/AnimatedStat';
import SectionDivider from '../components/SectionDivider';
import PlateComparison from '../components/PlateComparison';
import { THEME, PIPELINE_STAGES } from '../theme';

const Button = ({ children, onClick, className = '', variant = 'primary' }) => {
  const baseStyle = "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-300 active:scale-95";
  const style = variant === 'primary'
    ? { backgroundColor: THEME.primary, color: '#fff', border: 'none' }
    : { backgroundColor: 'transparent', borderColor: THEME.border, color: THEME.text, border: '2px solid' };

  return (
    <button onClick={onClick} className={`${baseStyle} ${className} hover:opacity-90`} style={style}>
      {children}
    </button>
  );
};

const Navbar = ({ onStart }) => (
  <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg border-b shadow-sm transition-all duration-300" style={{ backgroundColor: `${THEME.bg}CC`, borderColor: THEME.border }}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-16">

        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer transition-transform hover:scale-105" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: THEME.primary, color: '#fff' }}>
            <ChefHat size={18} />
          </div>
          <span className="text-xl font-bold tracking-wide drop-shadow-sm" style={{ color: THEME.text }}>
            Eco<span style={{ color: THEME.primary }}>Plate</span>
          </span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold" style={{ color: THEME.textMuted }}>
          <a href="#pipeline" className="hover:text-orange-500 transition-colors">Kitchen Flow</a>
          <a href="#tech" className="hover:text-orange-500 transition-colors">POS Stack</a>
          <a href="#team" className="hover:text-orange-500 transition-colors">Team</a>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <a href="https://github.com/Eshwarnath24/EcoPlate" target="_blank" rel="noopener noreferrer" className="hidden sm:flex w-9 h-9 rounded-full border items-center justify-center transition-all hover:shadow-md" style={{ borderColor: THEME.border, backgroundColor: THEME.surface, color: THEME.textMuted }} title="GitHub">
            <ExternalLink size={16} />
          </a>
          <Button onClick={onStart} className="px-5 py-2 text-sm shadow-md hover:shadow-lg">
            Launch Terminal
          </Button>
        </div>

      </div>
    </div>
  </nav>
);

const LandingPage = ({ onStart }) => (
  <div className="pb-0 pt-20 relative min-h-screen font-sans selection:bg-orange-500/30">
    <style>{`html { scroll-behavior: smooth; }`}</style>
    <Navbar onStart={onStart} />
    <CodedNatureBackground />
    
    {/* ===== Hero Section ===== */}
    <section className="space-y-14 mb-28 mt-12 relative z-10 px-4">
      <Reveal direction="from-bottom">
        <div className="text-center space-y-8 max-w-4xl mx-auto p-8 md:p-12">

          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border font-mono text-[11px] tracking-[0.15em] uppercase shadow-sm backdrop-blur-sm" style={{ borderColor: THEME.border, backgroundColor: THEME.surface, color: THEME.primary }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: THEME.success }} />
            POS Sync Active — Smart Kitchen Analytics
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold leading-[1.05] tracking-tight animate-in fade-in duration-700" style={{ color: THEME.text, textShadow: '0px 4px 20px rgba(0,0,0,0.5)' }}>
            Your kitchen <span className="font-serif-italic font-medium" style={{ color: THEME.accent }}>tells a story.</span>
            <br />
            <span className="relative inline-block mt-4 px-6 py-2 select-none">
              <span className="absolute inset-0 rounded-2xl border shadow-sm -rotate-1" style={{ backgroundColor: `${THEME.primary}20`, borderColor: `${THEME.primary}40` }}></span>
              <span className="relative text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(135deg, ${THEME.primary}, ${THEME.accent})`, WebkitBackgroundClip: 'text', textShadow: 'none' }}>
                We read it.
              </span>
            </span>
          </h1>

          <div className="max-w-2xl mx-auto backdrop-blur-md border rounded-2xl p-6 shadow-xl" style={{ backgroundColor: THEME.surface, borderColor: THEME.border }}>
            <p className="text-base md:text-lg leading-relaxed font-semibold" style={{ color: THEME.textMuted }}>
              EcoPlate uses an advanced neural pipeline integrated directly into your restaurant's flow. It segments plates, links to POS tickets, and instantly calculates food cost discrepancies from plate returns.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-4">
            <Button onClick={onStart} className="w-full sm:w-auto px-12 py-4 text-lg shadow-lg hover:scale-105 group">
              Start Scanning <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform duration-300" />
            </Button>
            <Button variant="outline" className="w-full sm:w-auto px-10 py-4 text-lg hover:scale-105 group" onClick={() => window.open('https://github.com/Eshwarnath24/EcoPlate', '_blank')}>
              <ExternalLink size={18} className="group-hover:scale-110 transition-transform duration-300" /> View Source
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
    <div className="relative z-10 w-full rounded-t-[3rem] pt-16 mt-12 border-t"
      style={{
        background: `linear-gradient(160deg, ${THEME.surface}, ${THEME.bg})`,
        borderColor: THEME.border,
        boxShadow: '0 -20px 60px rgba(0,0,0,0.5)'
      }}>

      {/* ===== Stats Row ===== */}
      <section className="relative mb-28 max-w-6xl mx-auto px-4">
        <Reveal direction="zoom-in">
          <div className="absolute inset-0 rounded-3xl border shadow-lg mx-4" style={{ borderColor: THEME.border, backgroundColor: `${THEME.surface}80` }} />
        </Reveal>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-10 px-10 relative z-10">
          <Reveal delay={0} direction="from-bottom"><AnimatedStat value={6} label="Kitchen Flow Stages" icon={<Layers size={22} />} /></Reveal>
          <Reveal delay={100} direction="from-bottom"><AnimatedStat value={40} label="Menu Items Mapped" icon={<Target size={22} />} /></Reveal>
          <Reveal delay={200} direction="from-bottom"><AnimatedStat value={96} suffix="%" label="Ingredient Precision" icon={<Zap size={22} />} /></Reveal>
          <Reveal delay={300} direction="from-bottom"><AnimatedStat value={450} suffix="ms" label="Scan Speed" icon={<TrendingDown size={22} />} /></Reveal>
        </div>
      </section>

      <SectionDivider />

      {/* ===== How It Works — Full Pipeline ===== */}
      <section id="pipeline" className="my-28 relative z-10 px-4 scroll-mt-24">
        <Reveal direction="from-bottom">
          <div className="text-center space-y-6 mb-16 p-8 rounded-3xl flex flex-col items-center w-full backdrop-blur-md border shadow-sm" style={{ backgroundColor: THEME.surface, borderColor: THEME.border }}>
            <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border font-semibold text-xs tracking-[0.2em] uppercase shadow-sm" style={{ borderColor: `${THEME.primary}40`, backgroundColor: `${THEME.primary}10`, color: THEME.primary }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: THEME.primary }} />
              Kitchen Integration
            </div>
            <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight" style={{ color: THEME.text }}>
              The Expeditor <span className="font-serif-italic font-medium" style={{ color: THEME.accent }}>Pipeline</span>
            </h2>
            <p className="max-w-2xl mx-auto text-lg md:text-xl font-medium leading-relaxed" style={{ color: THEME.textMuted }}>
              Seamlessly integrates with your POS to calculate real-time volumetric plate waste and financial loss.
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
                <Target size={24} />,
                <Zap size={24} />,
                <Cpu size={24} />,
                <GitMerge size={24} />,
                <BarChart3 size={24} />,
              ];
              const stageColors = [THEME.primary, THEME.success, THEME.accent, THEME.primary, THEME.waste, THEME.success];
              return (
                <Reveal key={step.id} delay={i * 150} direction={isLeft ? 'from-left' : 'from-right'}>
                  <div className={`flex flex-col md:flex-row items-center gap-6 ${isLeft ? '' : 'md:flex-row-reverse'}`}>
                    <div className={`flex-1 w-full ${isLeft ? 'md:text-right flex md:justify-end' : 'md:text-left flex md:justify-start'}`}>
                      <div className="p-8 rounded-2xl border backdrop-blur-md group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 w-full md:max-w-md text-left" style={{ backgroundColor: THEME.bg, borderColor: THEME.border }}>
                        <div className={`flex items-center gap-4 mb-4 ${isLeft ? 'md:flex-row-reverse' : ''}`}>
                          <div className="w-12 h-12 rounded-2xl border flex items-center justify-center group-hover:scale-110 transition-all shrink-0 shadow-md" style={{ borderColor: `${stageColors[i]}30`, backgroundColor: `${stageColors[i]}10`, color: stageColors[i] }}>
                            {icons[i]}
                          </div>
                          <div className={isLeft ? 'md:text-right' : ''}>
                            <div className="text-xs font-bold tracking-[0.2em]" style={{ color: stageColors[i] }}>STEP {i + 1}</div>
                            <h3 className="font-extrabold text-xl tracking-tight" style={{ color: THEME.text }}>{step.name}</h3>
                          </div>
                        </div>
                        <p className="text-[15px] leading-relaxed" style={{ color: THEME.textMuted }}>{step.details}</p>
                      </div>
                    </div>

                    <div className="hidden md:flex w-10 h-10 rounded-full border-2 items-center justify-center shrink-0 z-10 backdrop-blur-md" style={{ borderColor: THEME.border, backgroundColor: THEME.bg }}>
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
          <div className="text-center space-y-6 mb-14 p-8 rounded-3xl flex flex-col items-center w-full backdrop-blur-md border shadow-sm" style={{ backgroundColor: THEME.surface, borderColor: THEME.border }}>
            <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border font-semibold text-xs tracking-[0.2em] uppercase shadow-sm" style={{ borderColor: `${THEME.primary}40`, backgroundColor: `${THEME.primary}10`, color: THEME.primary }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: THEME.primary }} />
              Technology
            </div>
            <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight" style={{ color: THEME.text }}>
              Built <span className="font-serif-italic font-medium" style={{ color: THEME.accent }}>For Scale</span>
            </h2>
            <p className="max-w-xl mx-auto text-lg md:text-xl font-medium leading-relaxed" style={{ color: THEME.textMuted }}>
              Enterprise-grade vision models deployed directly at the edge.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {[
            { name: 'PyTorch', desc: 'Core Engine' },
            { name: 'U-Net', desc: 'Segmentation' },
            { name: 'MobileNetV3', desc: 'Classification' },
            { name: 'Siamese Net', desc: 'Ticket Match' },
            { name: 'OpenCV', desc: 'Vision Utils' },
            { name: 'React', desc: 'Dashboard' },
            { name: 'Tailwind CSS', desc: 'UI Tokens' },
            { name: 'Python', desc: 'API Layer' },
          ].map((tech, i) => (
            <Reveal key={tech.name} delay={i * 50} direction="zoom-in">
              <div className="px-6 py-7 rounded-2xl border backdrop-blur-md transition-all duration-300 cursor-default hover:shadow-lg hover:-translate-y-1 hover:border-orange-500/50 text-center group h-full" style={{ backgroundColor: THEME.surface, borderColor: THEME.border }}>
                <div className="font-bold text-lg mb-2 group-hover:text-orange-500 transition-colors" style={{ color: THEME.text, fontFamily: 'Plus Jakarta Sans' }}>{tech.name}</div>
                <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: THEME.accent, fontFamily: 'Plus Jakarta Sans' }}>{tech.desc}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <SectionDivider />

      {/* ===== Team ===== */}
      <section id="team" className="my-28 relative z-10 px-4 scroll-mt-24">
        <Reveal direction="from-bottom">
          <div className="text-center space-y-6 mb-14 p-8 rounded-3xl flex flex-col items-center w-full backdrop-blur-md border shadow-sm" style={{ backgroundColor: THEME.surface, borderColor: THEME.border }}>
            <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border font-semibold text-xs tracking-[0.2em] uppercase shadow-sm" style={{ borderColor: `${THEME.primary}40`, backgroundColor: `${THEME.primary}10`, color: THEME.primary }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: THEME.primary }} />
              Founders
            </div>
            <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight" style={{ color: THEME.text }}>
              Meet the <span className="font-serif-italic font-medium" style={{ color: THEME.accent }}>Chefs</span>
            </h2>
            <p className="max-w-xl mx-auto text-lg md:text-xl font-medium leading-relaxed" style={{ color: THEME.textMuted }}>
              Engineering solutions for sustainable and profitable kitchens.
            </p>
          </div>
        </Reveal>

        <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {[
            { name: 'Gajula Eshwarnath', role: 'Full Stack · Deep Learning', email: 'gajulaeshwarnath24@gmail.com', github: 'Eshwarnath24' },
            { name: 'Kalepu Lohith', role: 'Full Stack · Deep Learning', email: 'lohithkalepu@gmail.com', github: 'Lohi712' },
          ].map((member, i) => (
            <Reveal key={member.name} delay={i * 150} direction="from-bottom">
              <div className="rounded-3xl border p-8 group hover:shadow-2xl hover:-translate-y-2 hover:-rotate-2 transition-all duration-300 text-center backdrop-blur-md h-full" style={{ backgroundColor: THEME.surface, borderColor: THEME.border }}>
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 transition-all group-hover:scale-110 shadow-md border-2" style={{ background: `linear-gradient(to bottom right, ${THEME.bg}, ${THEME.surface})`, borderColor: THEME.primary }}>
                  <span className="text-2xl font-bold tracking-wider" style={{ color: THEME.text }}>
                    {member.name.split(' ').map(w => w[0]).join('')}
                  </span>
                </div>
                <h3 className="font-extrabold text-xl mb-1" style={{ color: THEME.text }}>{member.name}</h3>
                <p className="text-xs font-bold mb-5 tracking-widest uppercase" style={{ color: THEME.primary }}>{member.role}</p>
                <div className="flex items-center justify-center gap-3">
                  <a href={`mailto:${member.email}`} className="w-10 h-10 rounded-xl border flex items-center justify-center transition-all hover:shadow-md hover:scale-110 hover:border-orange-500/50" style={{ backgroundColor: THEME.bg, borderColor: THEME.border, color: THEME.textMuted }} title="Email">
                    <Mail size={16} />
                  </a>
                  {member.github && (
                    <a href={`https://github.com/${member.github}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl border flex items-center justify-center transition-all hover:shadow-md hover:scale-110 hover:border-orange-500/50" style={{ backgroundColor: THEME.bg, borderColor: THEME.border, color: THEME.textMuted }} title="GitHub">
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
      <footer className="border-t pt-14 pb-12 relative z-10 backdrop-blur-lg px-4" style={{ backgroundColor: `${THEME.bg}F0`, borderColor: THEME.border }}>
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="flex items-center justify-center gap-2">
            <span className="text-3xl drop-shadow-sm"><ChefHat size={32} style={{ color: THEME.primary }} /></span>
            <span className="font-extrabold text-2xl tracking-wide drop-shadow-sm" style={{ color: THEME.text }}>
              Eco<span style={{ color: THEME.primary }}>Plate</span>
            </span>
          </div>
          <p className="text-base font-semibold max-w-lg mx-auto leading-relaxed" style={{ color: THEME.textMuted }}>
            Reducing food waste and optimizing kitchen profitability.
            <br />
            <span className="text-sm font-medium" style={{ color: THEME.border }}>Built for Neural Networks &amp; Deep Learning Course.</span>
          </p>
          <div className="flex items-center justify-center gap-6 text-sm font-semibold tracking-wide" style={{ color: THEME.textMuted }}>
            <span>© 2026 EcoPlate Kitchen Analytics</span>
            <span style={{ color: THEME.border }}>•</span>
            <a href="https://github.com/Eshwarnath24/EcoPlate" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 underline decoration-2 underline-offset-4 transition-colors">
              GitHub
            </a>
            <span style={{ color: THEME.border }}>•</span>
            <span className="px-2.5 py-0.5 rounded border text-xs uppercase tracking-wider font-bold" style={{ backgroundColor: `${THEME.primary}20`, borderColor: `${THEME.primary}40`, color: THEME.primary }}>SDG 12</span>
          </div>
        </div>
      </footer>

    </div>
    {/* End of Container */}

  </div>
);

export default LandingPage;