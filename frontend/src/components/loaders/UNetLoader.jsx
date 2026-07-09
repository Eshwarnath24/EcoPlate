import React from 'react';

// --- U-Net Stage Loader: Iconic U-shaped encoder-decoder with skip connections ---
const UNetLoader = ({ tick }) => {
  const layers = [
    { x: 100, y: 50, h: 60, isLeft: true },
    { x: 180, y: 100, h: 50, isLeft: true },
    { x: 260, y: 150, h: 40, isLeft: true },
    { x: 340, y: 200, h: 30, isLeft: true },
    { x: 420, y: 250, h: 20, isBot: true }, // Bottleneck
    { x: 500, y: 200, h: 30 },
    { x: 580, y: 150, h: 40 },
    { x: 660, y: 100, h: 50 },
    { x: 740, y: 50, h: 60 },
  ];

  const phase = tick % layers.length;

  return (
    <g className="iso-plane-float" style={{ transformOrigin: 'center' }}>
      {/* Skip connections */}
      <path d="M 120 80 L 720 80" stroke="rgba(255,255,255,0.2)" strokeDasharray="5" fill="none" />
      <path d="M 200 125 L 640 125" stroke="rgba(255,255,255,0.2)" strokeDasharray="5" fill="none" />
      <path d="M 280 170 L 560 170" stroke="rgba(255,255,255,0.2)" strokeDasharray="5" fill="none" />
      
      {/* Firing skip connections */}
      {phase > 4 && phase < 8 && (
        <path d={`M ${layers[8 - phase].x + 20} ${layers[8 - phase].y + 30} L ${layers[phase].x - 20} ${layers[phase].y + 30}`} stroke="#10B981" strokeWidth="3" className="dash-flow" fill="none" />
      )}

      {/* Layer Blocks */}
      {layers.map((l, i) => {
        const isActive = phase === i;
        return (
          <g key={`u-${i}`}>
            <rect 
              x={l.x} y={l.y} width="20" height={l.h} 
              fill={isActive ? '#3B82F6' : 'rgba(59,130,246,0.2)'}
              stroke={isActive ? '#fff' : 'none'}
              rx="4"
              className="transition-all duration-300"
            />
            {/* Connecting lines down/up */}
            {i < layers.length - 1 && (
              <line x1={l.x + 10} y1={l.y + l.h} x2={layers[i + 1].x + 10} y2={layers[i + 1].y} stroke="rgba(255,255,255,0.3)" />
            )}
          </g>
        );
      })}
    </g>
  );
};

export default UNetLoader;
