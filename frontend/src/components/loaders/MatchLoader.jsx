import React from 'react';

// --- Siamese Matching Stage Loader: Two latent embeddings converging ---
const MatchLoader = ({ tick }) => {
  const isMatched = tick % 10 > 5;
  return (
    <g>
      {/* T0 Network */}
      <circle cx="200" cy="150" r="40" fill="none" stroke="#fff" strokeDasharray="5" className={isMatched ? '' : 'animate-spin'} style={{ transformOrigin: '200px 150px' }} />
      <text x="180" y="155" fill="#fff" className="font-mono text-xs">Latent 0</text>
      
      {/* T1 Network */}
      <circle cx="200" cy="250" r="40" fill="none" stroke="#fff" strokeDasharray="5" className={isMatched ? '' : 'animate-spin'} style={{ transformOrigin: '200px 250px' }} />
      <text x="180" y="255" fill="#fff" className="font-mono text-xs">Latent 1</text>

      {/* Connecting Paths */}
      <path d="M 240 150 C 350 150, 400 200, 500 200" fill="none" stroke={isMatched ? '#7928CA' : '#333'} strokeWidth="3" className={isMatched ? 'dash-flow' : ''} />
      <path d="M 240 250 C 350 250, 400 200, 500 200" fill="none" stroke={isMatched ? '#7928CA' : '#333'} strokeWidth="3" className={isMatched ? 'dash-flow' : ''} />

      {/* Comparator */}
      <circle cx="500" cy="200" r="30" fill={isMatched ? '#7928CA' : '#222'} stroke="#fff" strokeWidth="2" className="transition-all duration-300" />
      <text x="540" y="205" fill="#fff" className="font-mono text-sm opacity-80">
        Sim = {isMatched ? '0.842' : '...'}
      </text>
    </g>
  );
};

export default MatchLoader;
