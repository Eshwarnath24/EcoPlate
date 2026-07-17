import React from 'react';

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,400;1,500&family=Inter:wght@300;400;500;600;700&display=swap');
    
    body { font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
    
    .font-serif-italic {
      font-family: 'Playfair Display', Georgia, serif;
      font-style: italic;
    }

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
    .animate-matrix { background-image: linear-gradient(0deg, transparent 0%, rgba(31, 77, 58, 0.15) 50%, transparent 100%); background-size: 100% 200%; animation: matrix-rain 3s linear infinite; }
    
    .dash-flow { stroke-dasharray: 10; animation: dash 1s linear infinite; }
    @keyframes dash { to { stroke-dashoffset: -20; } }

    .glow-text { text-shadow: none; }
    
    /* Warm scrollbar */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #C9C5BB; border-radius: 10px; }
    ::-webkit-scrollbar-thumb:hover { background: #8A8580; }
  `}</style>
);

export default GlobalStyles;

