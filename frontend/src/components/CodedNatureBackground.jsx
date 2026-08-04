import React, { useRef, useEffect } from 'react';
import { THEME } from '../theme';

// Complex Particle Engine for Realistic Fire, Steam, and Embers
class Particle {
  constructor(canvasWidth, canvasHeight, type) {
    this.type = type; // 'fire', 'ember', 'steam'
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.reset(true);
  }

  reset(initial = false) {
    // Distribute across the very bottom of the screen
    this.x = Math.random() * this.canvasWidth;
    this.y = initial ? this.canvasHeight - Math.random() * 200 : this.canvasHeight + 10;
    this.life = 0;
    
    if (this.type === 'fire') {
      this.size = 20 + Math.random() * 40;
      this.maxLife = 50 + Math.random() * 50;
      this.vx = (Math.random() - 0.5) * 1.5;
      this.vy = -(2 + Math.random() * 3);
      // Fire colors: Yellow/White base -> Orange -> Red
      this.hue = 40 + Math.random() * 20; // 40-60 (Yellow/Orange)
    } else if (this.type === 'ember') {
      this.size = 2 + Math.random() * 4;
      this.maxLife = 100 + Math.random() * 100;
      this.vx = (Math.random() - 0.5) * 3;
      this.vy = -(3 + Math.random() * 4);
      this.hue = 10 + Math.random() * 30; // 10-40 (Red/Orange)
      this.angle = Math.random() * Math.PI * 2;
      this.spin = (Math.random() - 0.5) * 0.2;
    } else if (this.type === 'steam') {
      this.size = 40 + Math.random() * 80;
      this.maxLife = 150 + Math.random() * 100;
      this.vx = (Math.random() - 0.5) * 1;
      this.vy = -(1 + Math.random() * 1.5);
    }
  }

  update() {
    this.life++;
    
    // Physics
    this.x += this.vx;
    this.y += this.vy;

    if (this.type === 'fire') {
      this.size *= 0.96; // Shrink as it rises
      this.hue -= 0.5; // Turn from yellow -> red
    } else if (this.type === 'ember') {
      this.angle += this.spin;
      this.x += Math.sin(this.angle) * 2; // Erratic wandering
      this.size *= 0.98;
    } else if (this.type === 'steam') {
      this.size += 0.5; // Expand as it rises
      this.x += Math.sin(this.life * 0.02) * 1; // Gentle sway
    }

    // Reset if dead or completely off-screen
    if (this.life > this.maxLife || this.size < 0.5 || this.y < -100) {
      this.reset();
    }
  }

  draw(ctx) {
    const lifeRatio = this.life / this.maxLife;
    
    if (this.type === 'fire') {
      const opacity = 1 - Math.pow(lifeRatio, 2); // Stays bright then fades fast
      const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
      // Core is bright, edge is saturated
      gradient.addColorStop(0, `hsla(${this.hue}, 100%, 70%, ${opacity})`);
      gradient.addColorStop(0.3, `hsla(${this.hue - 10}, 100%, 50%, ${opacity * 0.8})`);
      gradient.addColorStop(1, `hsla(${this.hue - 20}, 100%, 30%, 0)`);
      
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      
    } else if (this.type === 'ember') {
      const opacity = (1 - lifeRatio) * Math.abs(Math.sin(this.life * 0.1)); // Flickering
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `hsla(${this.hue}, 100%, 60%, ${opacity})`;
      ctx.shadowBlur = 10;
      ctx.shadowColor = `hsl(${this.hue}, 100%, 50%)`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0; // Reset
      
    } else if (this.type === 'steam') {
      const opacity = (1 - lifeRatio) * 0.15; // Very faint
      const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false }); // Optimize for non-transparent canvas
    
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

    // Initialize massive particle pool
    const particles = [];
    const numFire = Math.floor(width / 10); // Scale fire with screen width
    const numEmbers = 40;
    const numSteam = 30;

    for (let i = 0; i < numFire; i++) particles.push(new Particle(width, height, 'fire'));
    for (let i = 0; i < numEmbers; i++) particles.push(new Particle(width, height, 'ember'));
    for (let i = 0; i < numSteam; i++) particles.push(new Particle(width, height, 'steam'));

    // High performance render loop
    const render = () => {
      // Clear background cleanly
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = THEME.bg; // Use dark background
      ctx.fillRect(0, 0, width, height);

      // Draw subtle tile grid for kitchen vibe
      ctx.strokeStyle = THEME.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for(let x = 0; x < width; x += 120) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
      for(let y = 0; y < height; y += 120) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
      ctx.stroke();

      // Sort rendering order: Steam (back) -> Fire (mid) -> Embers (front)
      // We actually just render them in order of creation because composite handles blending perfectly
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw(ctx);
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
      {/* Heavy vignette for deep dark mode focus */}
      <div className="absolute inset-0 z-10 pointer-events-none" style={{ background: `radial-gradient(circle at center, transparent 30%, ${THEME.bg} 100%)` }} />
    </div>
  );
};

export default CodedNatureBackground;
