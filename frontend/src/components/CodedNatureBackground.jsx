import React, { useRef, useEffect } from 'react';
import { THEME } from '../theme';

// Scroll-Reactive Fire Particle Engine
// As user scrolls: flames grow taller, brighter, and at max scroll they reach the navbar
class Particle {
  constructor(canvasWidth, canvasHeight, type) {
    this.type = type;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.reset(true);
  }

  reset(initial = false) {
    this.x = Math.random() * this.canvasWidth;
    this.y = initial ? this.canvasHeight - Math.random() * 200 : this.canvasHeight + 10;
    this.life = 0;
    
    if (this.type === 'fire') {
      this.baseSize = 20 + Math.random() * 40;
      this.size = this.baseSize;
      this.baseMaxLife = 50 + Math.random() * 50;
      this.maxLife = this.baseMaxLife;
      this.baseVy = -(2 + Math.random() * 3);
      this.vx = (Math.random() - 0.5) * 1.5;
      this.vy = this.baseVy;
      this.hue = 40 + Math.random() * 20;
      this.baseHue = this.hue;
      this.baseShrink = 0.96;
    } else if (this.type === 'ember') {
      this.baseSize = 2 + Math.random() * 4;
      this.size = this.baseSize;
      this.baseMaxLife = 100 + Math.random() * 100;
      this.maxLife = this.baseMaxLife;
      this.baseVy = -(3 + Math.random() * 4);
      this.vx = (Math.random() - 0.5) * 3;
      this.vy = this.baseVy;
      this.hue = 10 + Math.random() * 30;
      this.baseHue = this.hue;
      this.angle = Math.random() * Math.PI * 2;
      this.spin = (Math.random() - 0.5) * 0.2;
    } else if (this.type === 'steam') {
      this.baseSize = 40 + Math.random() * 80;
      this.size = this.baseSize;
      this.baseMaxLife = 150 + Math.random() * 100;
      this.maxLife = this.baseMaxLife;
      this.vx = (Math.random() - 0.5) * 1;
      this.vy = -(1 + Math.random() * 1.5);
    }
  }

  // intensity: 0 (calm/top) to 1 (inferno/bottom of page)
  update(intensity) {
    this.life++;

    // Scale velocity: flames rise much faster as you scroll
    // At full scroll, flames are 3.5x faster → they reach the top of the screen
    const speedMul = 0.5 + intensity * 3.0;
    
    this.x += this.vx * (1 + intensity * 0.5);
    this.y += this.vy * speedMul;

    if (this.type === 'fire') {
      // At high scroll, flames shrink slower (live longer visually)
      const shrinkRate = this.baseShrink + intensity * 0.025; // 0.96 → 0.985
      this.size *= shrinkRate;
      // At high intensity, massively extend life so flames can travel full screen
      this.maxLife = this.baseMaxLife * (1 + intensity * 3);
      this.hue = this.baseHue - 0.5 - intensity * 0.3;
    } else if (this.type === 'ember') {
      this.angle += this.spin;
      this.x += Math.sin(this.angle) * (2 + intensity * 3);
      this.size *= 0.98 + intensity * 0.01;
      this.maxLife = this.baseMaxLife * (1 + intensity * 2);
    } else if (this.type === 'steam') {
      this.size += 0.5 + intensity * 0.5;
      this.x += Math.sin(this.life * 0.02) * (1 + intensity);
    }

    if (this.life > this.maxLife || this.size < 0.5 || this.y < -50) {
      this.reset();
    }
  }

  draw(ctx, intensity) {
    const lifeRatio = this.life / this.maxLife;
    // Brightness: significantly brighter as you scroll
    const brightnessMul = 1 + intensity * 1.2;
    
    if (this.type === 'fire') {
      const opacity = Math.min((1 - Math.pow(lifeRatio, 1.5)) * brightnessMul, 1);
      // Size grows dramatically with scroll
      const sizeBoost = 1 + intensity * 1.5;
      const drawSize = this.size * sizeBoost;
      
      if (drawSize < 1) return;
      
      const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, drawSize);
      const lightBoost = Math.floor(intensity * 25);
      gradient.addColorStop(0, `hsla(${this.hue + intensity * 10}, 100%, ${75 + lightBoost}%, ${opacity})`);
      gradient.addColorStop(0.3, `hsla(${this.hue}, 100%, ${55 + lightBoost}%, ${opacity * 0.8})`);
      gradient.addColorStop(0.7, `hsla(${this.hue - 15}, 100%, ${35 + lightBoost * 0.5}%, ${opacity * 0.3})`);
      gradient.addColorStop(1, `hsla(${this.hue - 25}, 100%, 25%, 0)`);
      
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(this.x, this.y, drawSize, 0, Math.PI * 2);
      ctx.fill();
      
    } else if (this.type === 'ember') {
      const baseFlicker = Math.abs(Math.sin(this.life * 0.1));
      const opacity = Math.min((1 - lifeRatio) * baseFlicker * brightnessMul, 1);
      const drawSize = this.size * (1 + intensity * 0.8);
      
      if (drawSize < 0.5) return;
      
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `hsla(${this.hue}, 100%, ${60 + intensity * 20}%, ${opacity})`;
      ctx.shadowBlur = 12 + intensity * 15;
      ctx.shadowColor = `hsl(${this.hue}, 100%, ${55 + intensity * 25}%)`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, drawSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
    } else if (this.type === 'steam') {
      // Steam fades as fire gets intense
      const steamOpacity = (1 - lifeRatio) * 0.15 * (1 - intensity * 0.7);
      if (steamOpacity < 0.005) return;
      
      const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${steamOpacity})`);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

const CodedNatureBackground = () => {
  const canvasRef = useRef(null);
  const scrollIntensityRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      scrollIntensityRef.current = scrollHeight > 0 ? Math.min(scrollTop / scrollHeight, 1) : 0;
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    
    let animationFrameId;
    let width = window.innerWidth;
    let height = window.innerHeight;
    
    canvas.width = width;
    canvas.height = height;

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);

    // Particle pool — more fire for taller flames
    const particles = [];
    const numFire = Math.floor(width / 7); // More fire particles
    const numEmbers = 60;
    const numSteam = 25;

    for (let i = 0; i < numFire; i++) particles.push(new Particle(width, height, 'fire'));
    for (let i = 0; i < numEmbers; i++) particles.push(new Particle(width, height, 'ember'));
    for (let i = 0; i < numSteam; i++) particles.push(new Particle(width, height, 'steam'));

    let smoothIntensity = 0;

    const render = () => {
      const target = scrollIntensityRef.current;
      smoothIntensity += (target - smoothIntensity) * 0.05;

      // Background: gets slightly brighter/warmer as you scroll
      ctx.globalCompositeOperation = 'source-over';
      const bgBrightness = Math.floor(9 + smoothIntensity * 6); // 9 → 15
      ctx.fillStyle = `rgb(${bgBrightness}, ${bgBrightness}, ${Math.floor(bgBrightness * 1.1)})`;
      ctx.fillRect(0, 0, width, height);

      // Grid — fades out with scroll
      const gridOpacity = Math.max(1 - smoothIntensity * 0.8, 0.15);
      ctx.strokeStyle = `rgba(39, 39, 42, ${gridOpacity})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < width; x += 120) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
      for (let y = 0; y < height; y += 120) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
      ctx.stroke();

      // Wide ambient heat glow from bottom — grows to cover entire screen at max scroll
      const glowCoverage = 0.15 + smoothIntensity * 0.85; // 15% → 100% of screen height
      const glowHeight = height * glowCoverage;
      const heatGlow = ctx.createLinearGradient(0, height, 0, height - glowHeight);
      heatGlow.addColorStop(0, `rgba(234, 88, 12, ${0.10 + smoothIntensity * 0.20})`);
      heatGlow.addColorStop(0.3, `rgba(245, 158, 11, ${0.04 + smoothIntensity * 0.12})`);
      heatGlow.addColorStop(0.7, `rgba(239, 68, 68, ${smoothIntensity * 0.06})`);
      heatGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = heatGlow;
      ctx.fillRect(0, height - glowHeight, width, glowHeight);

      // Render particles
      ctx.globalCompositeOperation = 'source-over';
      for (let i = 0; i < particles.length; i++) {
        particles[i].update(smoothIntensity);
        particles[i].draw(ctx, smoothIntensity);
      }

      animationFrameId = requestAnimationFrame(render);
    };
    
    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full block" 
      />
      {/* Vignette */}
      <div className="absolute inset-0 z-10 pointer-events-none" style={{ background: `radial-gradient(circle at center, transparent 30%, ${THEME.bg} 100%)` }} />
    </div>
  );
};

export default CodedNatureBackground;
