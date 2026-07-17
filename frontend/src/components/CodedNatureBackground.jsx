import React, { useRef, useMemo } from 'react';
import { Leaf } from 'lucide-react';

const PineTree = ({ className }) => (
  <svg width="60" height="200" viewBox="0 0 100 300" className={className}>
    <rect x="44" y="260" width="12" height="40" fill="#3E2723" />
    <path d="M50,130 L10,270 L90,270 Z" fill="#1B5E20" />
    <path d="M50,130 L50,270 L90,270 Z" fill="#0c3b10" />
    <path d="M50,60 L15,200 L85,200 Z" fill="#2E7D32" />
    <path d="M50,60 L50,200 L85,200 Z" fill="#154f19" />
    <path d="M50,0 L20,130 L80,130 Z" fill="#388E3C" />
    <path d="M50,0 L50,130 L80,130 Z" fill="#1b5e20" />
  </svg>
);

const OakTree = ({ className }) => (
  <svg width="100" height="150" viewBox="0 0 100 150" className={className}>
    <path d="M45,150 Q45,100 50,80 Q55,100 55,150 Z" fill="#4E342E" />
    <circle cx="30" cy="60" r="30" fill="#2b6b37" />
    <circle cx="70" cy="60" r="30" fill="#388E3C" />
    <circle cx="50" cy="35" r="35" fill="#4CAF50" />
    <circle cx="50" cy="75" r="25" fill="#1b5e20" />
    <path d="M20,60 A30,30 0 0,0 80,60 A35,35 0 0,1 20,60 Z" fill="#0c3b10" opacity="0.3" />
  </svg>
);

const CodedNatureBackground = () => {
  const leaves = useRef([...Array(15)].map(() => {
    const greens = ['#2e7d32', '#4CAF50', '#66bb6a', '#1b5e20'];
    return {
      left: Math.random() * 100,
      animationDuration: 10 + Math.random() * 15,
      animationDelay: Math.random() * -20, // Negative delay so they are already falling on load
      size: 12 + Math.random() * 14,
      endX: (Math.random() - 0.5) * 300,
      rot1: Math.random() * 360,
      rot2: Math.random() * 360 + 360,
      color: greens[Math.floor(Math.random() * greens.length)]
    };
  }));

  const birds = useMemo(() => {
    return Array.from({ length: 10 }).map((_, i) => ({
      id: i,
      top: 5 + Math.random() * 30, // Random height in the sky
      delay: Math.random() * -40,  // Staggered start times
      duration: 20 + Math.random() * 20, // Varying flight speeds
      scale: 0.15 + Math.random() * 0.35, // Varying depths
    }));
  }, []);

  // Dynamically generate a layered forest layout
  const foregroundTrees = useMemo(() => {
    const trees = [];

    const addTreeLayer = (side, startX, width) => {
      // 1. Back Layer (Small, far away)
      for (let i = 0; i < 6; i++) {
        trees.push({
          id: `${side}-back-${i}`,
          x: startX + Math.random() * width,
          yOffset: 10 + Math.random() * 15, // Fixed: Anchored much closer to the ground
          scale: 0.35 + Math.random() * 0.25, // Very small
          type: Math.random() > 0.3 ? 'pine' : 'oak',
          opacity: 0.6 + Math.random() * 0.3,
          zIndex: 1
        });
      }

      // 2. Middle Layer (Medium size, standard distance)
      for (let i = 0; i < 4; i++) {
        trees.push({
          id: `${side}-mid-${i}`,
          x: startX + Math.random() * width,
          yOffset: -5 + Math.random() * 15, // Fixed: Placed tightly around the baseline
          scale: 0.7 + Math.random() * 0.3, // Normal size
          type: Math.random() > 0.25 ? 'pine' : 'oak',
          opacity: 0.85 + Math.random() * 0.15,
          zIndex: 2
        });
      }

      // 3. Front Layer (Huge, close up, framing the screen)
      for (let i = 0; i < 3; i++) {
        trees.push({
          id: `${side}-front-${i}`,
          x: startX + Math.random() * width,
          yOffset: -35 + Math.random() * 20, // Fixed: Pushed well down to overlap the foreground edge
          scale: 1.3 + Math.random() * 0.6, // Huge!
          type: Math.random() > 0.5 ? 'pine' : 'oak',
          opacity: 1, // Fully opaque
          zIndex: 3
        });
      }
    };

    // Add layered trees to both left and right sides
    addTreeLayer('left', -15, 40);
    addTreeLayer('right', 75, 40);

    // Sort by zIndex first, then visually from top-to-bottom for correct overlap
    return trees.sort((a, b) => {
      if (a.zIndex !== b.zIndex) return a.zIndex - b.zIndex;
      return b.yOffset - a.yOffset;
    });
  }, []);

  // Jagged paths for background mountain tree lines
  const treeLinePath1 = useMemo(() => {
    let p = "M0,100 ";
    for (let i = 0; i <= 1000; i += 7) {
      p += `L${i + (Math.random() * 4 - 2)},${60 + Math.random() * 25} L${i + 3.5},100 `;
    }
    p += "L1000,100 Z";
    return p;
  }, []);

  const treeLinePath2 = useMemo(() => {
    let p = "M0,100 ";
    for (let i = 0; i <= 1000; i += 12) {
      p += `L${i + (Math.random() * 6 - 3)},${30 + Math.random() * 40} L${i + 6},100 `;
    }
    p += "L1000,100 Z";
    return p;
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[-1] bg-[#e6f4f1]">
      <style>{`
        @keyframes rippleMove {
          0% { background-position: 0% 0%; }
          100% { background-position: 100px 0%; }
        }
        @keyframes mistFloat {
          0% { transform: translateX(-5%); }
          100% { transform: translateX(5%); }
        }
        @keyframes cloudFloat {
          0% { transform: translateX(-15vw); opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { transform: translateX(115vw); opacity: 0; }
        }
        @keyframes leafFall {
          0% { transform: translate3d(0, -10vh, 0) rotate(var(--rot1)); opacity: 0; }
          10% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translate3d(var(--endX), 110vh, 0) rotate(var(--rot2)); opacity: 0; }
        }
        @keyframes birdFly {
          0% { transform: translate(-10vw, 10vh) scale(var(--scale)); opacity: 0; }
          10% { opacity: 0.7; }
          90% { opacity: 0.7; }
          100% { transform: translate(110vw, -10vh) scale(var(--scale)); opacity: 0; }
        }
        @keyframes birdBob {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(15px); }
        }
        .water-ripples {
          background-image: repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(255,255,255,0.15) 5px, rgba(255,255,255,0.15) 6px);
          animation: rippleMove 4s linear infinite;
          background-size: 100px 100%;
        }
        .sun-rays {
          background: repeating-conic-gradient(from 0deg, transparent 0deg 10deg, rgba(255, 255, 255, 0.2) 10deg 20deg);
          animation: spinRays 60s linear infinite;
        }
        @keyframes spinRays { 100% { transform: rotate(360deg); } }
      `}</style>

      {/* Dynamic Sky Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#87CEEB] via-[#b6e3f2] to-[#f4f9f9]" />

      {/* Glowing Sun with Rays */}
      <div className="absolute top-[8%] right-[15%] w-40 h-40 flex items-center justify-center">
        <div className="absolute inset-[-100%] rounded-full sun-rays blur-xl opacity-60" />
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white to-[#FFF9C4] shadow-[0_0_100px_40px_rgba(255,249,196,0.8)] animate-[pulse_6s_ease-in-out_infinite]" />
      </div>

      {/* Floating Clouds */}
      <div className="absolute top-[12%] left-0 w-[400px] h-[150px] opacity-70" style={{ animation: 'cloudFloat 60s linear infinite -10s' }}>
        <svg viewBox="0 0 200 100" fill="#ffffff" className="w-full h-full filter drop-shadow-md">
          <path d="M50,70 Q40,70 40,55 Q40,40 60,40 Q65,20 90,20 Q115,20 120,40 Q140,35 150,50 Q160,65 140,70 Z" />
        </svg>
      </div>
      <div className="absolute top-[25%] left-0 w-[250px] h-[100px] opacity-60" style={{ animation: 'cloudFloat 45s linear infinite -30s' }}>
        <svg viewBox="0 0 200 100" fill="#ffffff" className="w-full h-full filter drop-shadow-sm">
          <path d="M50,70 Q40,70 40,55 Q40,40 60,40 Q65,20 90,20 Q115,20 120,40 Q140,35 150,50 Q160,65 140,70 Z" />
        </svg>
      </div>

      {/* Animated Birds */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[5]">
        {birds.map((bird) => (
          <div
            key={bird.id}
            className="absolute left-0"
            style={{
              top: `${bird.top}%`,
              '--scale': bird.scale,
              animation: `birdFly ${bird.duration}s linear ${bird.delay}s infinite`,
            }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              style={{ animation: `birdBob ${bird.duration * 0.1}s ease-in-out infinite` }}
            >
              {/* Simple classic V-shaped bird */}
              <path d="M2,12 Q8,6 12,12 Q16,6 22,12 Q12,10 2,12 Z" fill="#2d3748" opacity="0.8" />
            </svg>
          </div>
        ))}
      </div>

      {/* Background Mountains */}
      <svg className="absolute bottom-[25%] w-full h-[60%] min-w-[1200px] z-[1]" preserveAspectRatio="none" viewBox="0 0 1000 400">
        <defs>
          <linearGradient id="mtn-back" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#75a8a1" />
            <stop offset="100%" stopColor="#b5d6d1" />
          </linearGradient>
        </defs>
        <path fill="url(#mtn-back)" d="M0,400 L0,200 Q80,120 150,180 T350,100 T550,190 T750,130 T900,180 L1000,120 L1000,400 Z" />
      </svg>

      {/* Distant Forest Line (Back) */}
      <svg className="absolute bottom-[25%] w-full h-[15%] min-w-[1200px] z-[2] opacity-40" preserveAspectRatio="none" viewBox="0 0 1000 100">
        <path d={treeLinePath1} fill="#1a423a" />
      </svg>

      {/* Midground Mountains */}
      <svg className="absolute bottom-[22%] w-full h-[50%] min-w-[1200px] z-[3]" preserveAspectRatio="none" viewBox="0 0 1000 400">
        <defs>
          <linearGradient id="mtn-mid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f8a7e" />
            <stop offset="100%" stopColor="#8dbab2" />
          </linearGradient>
        </defs>
        <path fill="url(#mtn-mid)" d="M0,400 L0,250 Q120,150 250,220 T500,140 T700,240 T900,160 L1000,220 L1000,400 Z" />
      </svg>

      {/* Distant Forest Line (Front) */}
      <svg className="absolute bottom-[21%] w-full h-[20%] min-w-[1200px] z-[4] opacity-60" preserveAspectRatio="none" viewBox="0 0 1000 100">
        <path d={treeLinePath2} fill="#143b2f" />
      </svg>

      {/* Rolling Hills */}
      <svg className="absolute bottom-[15%] w-full h-[25%] min-w-[1200px] z-[6]" preserveAspectRatio="none" viewBox="0 0 1000 200">
        <defs>
          <linearGradient id="hill-back" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2b6b47" />
            <stop offset="100%" stopColor="#1e4d33" />
          </linearGradient>
          <linearGradient id="hill-front" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#328a59" />
            <stop offset="100%" stopColor="#205c3b" />
          </linearGradient>
        </defs>
        {/* Continuous Back Hills */}
        <path fill="url(#hill-back)" d="M0,200 L0,120 Q 250,50 500,130 T 1000,100 L1000,200 Z" />
        {/* Continuous Front Hills */}
        <path fill="url(#hill-front)" d="M0,200 L0,160 Q 300,90 600,160 T 1000,140 L1000,200 Z" />
      </svg>

      {/* The Pond */}
      <div className="absolute bottom-0 w-full h-[18%] z-[7]">
        <div className="absolute inset-0 bg-gradient-to-b from-[#255243] to-[#122b24]" />
        <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10" />
        <div className="absolute inset-0 opacity-40">
          <div className="absolute inset-0 water-ripples scale-y-50 origin-top" />
        </div>
      </div>

      {/* Dense Foreground Forest (Left & Right) */}
      <div className="absolute bottom-[15.5%] w-full h-[40%] z-[10] pointer-events-none drop-shadow-2xl">
        {foregroundTrees.map((tree) => (
          <div
            key={tree.id}
            className="absolute bottom-0 transition-transform"
            style={{
              left: `${tree.x}%`,
              transform: `scale(${tree.scale})`,
              transformOrigin: 'bottom center',
              marginBottom: `${tree.yOffset}px`,
              opacity: tree.opacity,
              zIndex: tree.zIndex
            }}
          >
            {tree.type === 'pine' ? <PineTree /> : <OakTree />}
          </div>
        ))}
      </div>

      {/* Mist */}
      <div className="absolute bottom-[20%] w-full h-[15%] flex z-[8] opacity-50 mix-blend-screen pointer-events-none">
        <div
          className="w-[200%] h-full rounded-[100%]"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 70%)',
            filter: 'blur(35px)',
            animation: 'mistFloat 25s ease-in-out infinite alternate'
          }}
        />
      </div>

      {/* Falling Green Leaves */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[20]">
        {leaves.current.map((leaf, i) => (
          <div
            key={i}
            className="absolute top-0"
            style={{
              left: `${leaf.left}%`,
              color: leaf.color,
              animation: `leafFall ${leaf.animationDuration}s linear ${leaf.animationDelay}s infinite`,
              '--endX': `${leaf.endX}px`,
              '--rot1': `${leaf.rot1}deg`,
              '--rot2': `${leaf.rot2}deg`
            }}
          >
            {/* Using the imported Leaf icon from lucide-react */}
            <Leaf size={leaf.size} fill="currentColor" className="opacity-80 drop-shadow-md" />
          </div>
        ))}
      </div>

    </div>
  );
};

export default CodedNatureBackground;
