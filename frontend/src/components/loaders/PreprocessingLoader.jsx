import React from 'react';

// --- Preprocessing Stage Loader: Grid of nodes with convolution window ---
const PreprocessingLoader = ({ tick }) => {
  const nodes = [];
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const offset = Math.sin((tick + i + j) * 0.5) * 5;
      nodes.push(
        <circle key={`p-${i}-${j}`} cx={250 + i * 40 + offset} cy={60 + j * 40 + offset} r="2" fill="rgba(255,255,255,0.5)" />
      );
    }
  }
  return (
    <g>
      <rect x="230" y="40" width="340" height="320" fill="rgba(0,112,243,0.1)" stroke="#3B82F6" strokeWidth="1" strokeDasharray="10 5" className="dash-flow" />
      {nodes}
      {/* Convolution window */}
      <rect x={250 + ((tick / 2) % 7) * 40 - 10} y={60 + (Math.floor((tick / 2) / 7) % 7) * 40 - 10} width="60" height="60" fill="none" stroke="#fff" strokeWidth="2" className="transition-all duration-75" />
    </g>
  );
};

export default PreprocessingLoader;
