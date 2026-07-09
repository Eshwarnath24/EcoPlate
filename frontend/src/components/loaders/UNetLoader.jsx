import React from 'react';

// --- U-Net Segmentation Loader ---
// Classic encoder-decoder U-shape with skip connections, data pulse, and layer labels
const UNetLoader = ({ tick }) => {
  // U-Net architecture: encoder blocks shrinking, bottleneck, decoder blocks growing
  const layers = [
    { x: 80,  y: 60,  h: 70, w: 22, ch: '64',   side: 'enc' },
    { x: 155, y: 90,  h: 55, w: 22, ch: '128',  side: 'enc' },
    { x: 230, y: 115, h: 42, w: 22, ch: '256',  side: 'enc' },
    { x: 305, y: 135, h: 32, w: 22, ch: '512',  side: 'enc' },
    { x: 400, y: 155, h: 24, w: 28, ch: '1024', side: 'bot' }, // Bottleneck
    { x: 495, y: 135, h: 32, w: 22, ch: '512',  side: 'dec' },
    { x: 570, y: 115, h: 42, w: 22, ch: '256',  side: 'dec' },
    { x: 645, y: 90,  h: 55, w: 22, ch: '128',  side: 'dec' },
    { x: 720, y: 60,  h: 70, w: 22, ch: '64',   side: 'dec' },
  ];

  const phase = tick % (layers.length * 2);
  const activeIdx = phase < layers.length ? phase : layers.length - 1 - (phase - layers.length);

  // Skip connection pairs: encoder[i] ↔ decoder[8-i]
  const skipPairs = [[0, 8], [1, 7], [2, 6], [3, 5]];

  return (
    <g>
      {/* Skip connections (dashed horizontal lines) */}
      {skipPairs.map(([enc, dec], i) => {
        const eL = layers[enc];
        const dL = layers[dec];
        const midY = eL.y + eL.h / 2;
        const isSkipActive = activeIdx >= 5 && (8 - activeIdx) <= enc;
        return (
          <g key={`skip-${i}`}>
            <line x1={eL.x + eL.w} y1={midY} x2={dL.x} y2={midY}
              stroke={isSkipActive ? '#10B981' : 'rgba(255,255,255,0.08)'}
              strokeWidth={isSkipActive ? 2 : 1}
              strokeDasharray="6,4" />
            {/* Data particle on active skip */}
            {isSkipActive && (() => {
              const t = (tick % 10) / 10;
              const px = eL.x + eL.w + (dL.x - eL.x - eL.w) * t;
              return <circle cx={px} cy={midY} r="3" fill="#10B981" opacity="0.8" />;
            })()}
          </g>
        );
      })}

      {/* Connecting edges between consecutive layers */}
      {layers.slice(0, -1).map((l, i) => {
        const next = layers[i + 1];
        const isEdgeActive = i === activeIdx || i + 1 === activeIdx;
        return (
          <line key={`edge-${i}`}
            x1={l.x + l.w} y1={l.y + l.h / 2}
            x2={next.x} y2={next.y + next.h / 2}
            stroke={isEdgeActive ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.08)'}
            strokeWidth={isEdgeActive ? 1.5 : 0.8} />
        );
      })}

      {/* Layer blocks */}
      {layers.map((l, i) => {
        const isActive = i === activeIdx;
        const isPast = i < activeIdx;
        const blockColor = isActive ? '#3B82F6' : isPast ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.05)';
        return (
          <g key={`layer-${i}`}>
            {/* Glow on active */}
            {isActive && (
              <rect x={l.x - 4} y={l.y - 4} width={l.w + 8} height={l.h + 8} rx="6"
                fill="rgba(59,130,246,0.1)" />
            )}
            {/* Block */}
            <rect x={l.x} y={l.y} width={l.w} height={l.h} rx="4"
              fill={blockColor}
              stroke={isActive ? 'rgba(59,130,246,0.6)' : isPast ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.1)'}
              strokeWidth={isActive ? 2 : 1} />
            {/* Channel count */}
            <text x={l.x + l.w / 2} y={l.y + l.h + 14}
              fill={isActive ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)'}
              fontSize="8" fontFamily="monospace" textAnchor="middle">{l.ch}</text>
          </g>
        );
      })}

      {/* Section labels */}
      <text x="170" y="38" fill="rgba(255,255,255,0.25)" fontSize="10" fontFamily="monospace" textAnchor="middle">
        ENCODER ▼
      </text>
      <text x="400" y="205" fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="monospace" textAnchor="middle">
        Bottleneck
      </text>
      <text x="640" y="38" fill="rgba(255,255,255,0.25)" fontSize="10" fontFamily="monospace" textAnchor="middle">
        ▲ DECODER
      </text>

      {/* Output indicator */}
      <text x="720" y="148" fill="rgba(16,185,129,0.5)" fontSize="9" fontFamily="monospace" textAnchor="middle">
        Seg Mask
      </text>

      {/* Stage label */}
      <text x="400" y="380" fill="rgba(255,255,255,0.12)" fontSize="9" fontFamily="monospace" textAnchor="middle" letterSpacing="3">
        U-NET SEGMENTATION
      </text>
    </g>
  );
};

export default UNetLoader;
