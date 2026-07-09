import React from 'react';

const GlobalStyles = () => (
  <style>{`
    @keyframes scan {
      0% { top: 0%; opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { top: 100%; opacity: 0; }
    }
    .animate-scan { animation: scan 2s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
    
    @keyframes matrix-rain {
      0% { background-position: 0% -100%; }
      100% { background-position: 0% 200%; }
    }
    .animate-matrix { background-image: linear-gradient(0deg, transparent 0%, rgba(0, 112, 243, 0.2) 50%, transparent 100%); background-size: 100% 200%; animation: matrix-rain 3s linear infinite; }
    
    @keyframes float-iso {
      0%, 100% { transform: translateY(0) rotateX(60deg) rotateZ(45deg); }
      50% { transform: translateY(-10px) rotateX(60deg) rotateZ(45deg); }
    }
    .iso-plane { transform: rotateX(60deg) rotateZ(45deg); transform-style: preserve-3d; }
    .iso-plane-float { animation: float-iso 4s ease-in-out infinite; }
    
    .dash-flow { stroke-dasharray: 10; animation: dash 1s linear infinite; }
    @keyframes dash { to { stroke-dashoffset: -20; } }

    .glow-text { text-shadow: 0 0 10px rgba(255,255,255,0.3); }
    
    /* Sleek scrollbar for terminal */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
  `}</style>
);

export default GlobalStyles;
