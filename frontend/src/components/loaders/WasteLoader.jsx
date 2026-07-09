import React from 'react';

// --- Waste/Volumetric Diff Stage Loader: Shrinking circle representing volume loss ---
const WasteLoader = ({ tick }) => {
  const scale = 1 - ((tick % 20) / 20) * 0.6; // shrinks from 1 to 0.4
  return (
    <g style={{ transform: 'translate(400px, 200px)' }}>
      {/* Base Area (T0) */}
      <circle cx="0" cy="0" r="100" fill="none" stroke="rgba(255,255,255,0.2)" strokeDasharray="4" />
      <text x="-40" y="-110" fill="#fff" className="font-mono text-xs opacity-50">Vol T0</text>
      
      {/* Shrunk Area (T1) */}
      <g style={{ transform: `scale(${scale})`, transition: 'transform 0.1s linear' }}>
        <circle cx="0" cy="0" r="100" fill="rgba(239, 68, 68, 0.2)" stroke="#EF4444" strokeWidth="3" />
      </g>
      
      {/* Dynamic calculation text */}
      <text x="-40" y="130" fill="#EF4444" className="font-mono text-lg font-bold">
        - {Math.floor((1 - scale) * 100)}%
      </text>
    </g>
  );
};

export default WasteLoader;
