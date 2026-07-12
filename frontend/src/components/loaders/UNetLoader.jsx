import React from 'react';

// --- U-Net Segmentation Loader ---
// Left: classic encoder→bottleneck→decoder U-shape with skip connections
// Right: circular plate with food mask blobs gradually painting in as segmentation proceeds
// Key distinction: U-Net does food-vs-BACKGROUND segmentation (not food classification)
const UNetLoader = ({ tick }) => {
  const C = {
    green: '#48BB78',
    greenDim: 'rgba(72, 187, 120, 0.15)',
    gold: '#D9A441',
    goldDim: 'rgba(217, 164, 65, 0.12)',
    line: 'rgba(255, 255, 255, 0.08)',
    node: 'rgba(255, 255, 255, 0.12)',
    label: 'rgba(255, 255, 255, 0.3)',
  };

  // U-Net architecture layers
  const layers = [
    { x: 60,  y: 75,  h: 75, w: 22, ch: '64',   side: 'enc' },
    { x: 115, y: 100, h: 56, w: 22, ch: '128',  side: 'enc' },
    { x: 170, y: 120, h: 42, w: 22, ch: '256',  side: 'enc' },
    { x: 225, y: 138, h: 30, w: 22, ch: '512',  side: 'enc' },
    { x: 288, y: 150, h: 22, w: 28, ch: '1024', side: 'bot' },
    { x: 355, y: 138, h: 30, w: 22, ch: '512',  side: 'dec' },
    { x: 410, y: 120, h: 42, w: 22, ch: '256',  side: 'dec' },
    { x: 465, y: 100, h: 56, w: 22, ch: '128',  side: 'dec' },
    { x: 520, y: 75,  h: 75, w: 22, ch: '64',   side: 'dec' },
  ];

  // Active layer pulses through the U-shape and back
  const phase = tick % (layers.length * 2);
  const activeIdx = phase < layers.length ? phase : layers.length - 1 - (phase - layers.length);

  // Skip connections: encoder[i] ↔ decoder[8−i]
  const skipPairs = [[0, 8], [1, 7], [2, 6], [3, 5]];

  // Food mask blobs (appear progressively during decoder phase)
  const maskBlobs = [
    { cx: 660, cy: 120, rx: 30, ry: 18, label: 'food' },
    { cx: 700, cy: 185, rx: 24, ry: 20, label: 'food' },
    { cx: 650, cy: 240, rx: 28, ry: 15, label: 'food' },
  ];
  const maskProgress = activeIdx >= 5 ? Math.min(1, (activeIdx - 4) / 4) : 0;

  // Scan line across plate during decoding
  const scanY = activeIdx >= 5 ? 100 + (tick % 14) * 14 : -100;

  return (
    <g>
      {/* ─── Skip connections (dashed lines with data particles) ─── */}
      {skipPairs.map(([enc, dec], i) => {
        const eL = layers[enc], dL = layers[dec];
        const midY = eL.y + eL.h / 2;
        const isActive = activeIdx >= 5 && (8 - activeIdx) <= enc;
        return (
          <g key={`skip-${i}`}>
            <line x1={eL.x + eL.w} y1={midY} x2={dL.x} y2={midY}
              stroke={isActive ? C.gold : C.line}
              strokeWidth={isActive ? 1.8 : 0.8}
              strokeDasharray="6,4" />
            {/* Data particle flowing along skip connection */}
            {isActive && (() => {
              const t = (tick % 10) / 10;
              const px = eL.x + eL.w + (dL.x - eL.x - eL.w) * t;
              return <circle cx={px} cy={midY} r="2.5" fill={C.gold} opacity="0.8" />;
            })()}
          </g>
        );
      })}

      {/* ─── Edges between consecutive layers ─── */}
      {layers.slice(0, -1).map((l, i) => {
        const next = layers[i + 1];
        const isActive = i === activeIdx || i + 1 === activeIdx;
        return (
          <line key={`edge-${i}`}
            x1={l.x + l.w} y1={l.y + l.h / 2}
            x2={next.x} y2={next.y + next.h / 2}
            stroke={isActive ? 'rgba(255,255,255,0.25)' : C.line}
            strokeWidth={isActive ? 1.2 : 0.6} />
        );
      })}

      {/* ─── Layer blocks ─── */}
      {layers.map((l, i) => {
        const isActive = i === activeIdx;
        const isPast = i < activeIdx;
        const isBot = l.side === 'bot';
        const fillColor = isActive
          ? (isBot ? C.gold : C.green)
          : isPast ? C.greenDim : C.node;
        const strokeColor = isActive
          ? (isBot ? C.gold : C.green)
          : isPast ? 'rgba(72,187,120,0.25)' : C.line;

        return (
          <g key={`layer-${i}`}>
            {/* Active glow */}
            {isActive && (
              <rect x={l.x - 3} y={l.y - 3} width={l.w + 6} height={l.h + 6} rx="5"
                fill={isBot ? C.goldDim : C.greenDim} />
            )}
            {/* Block */}
            <rect x={l.x} y={l.y} width={l.w} height={l.h} rx="3"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={isActive ? 2 : 0.8} />
            {/* Channel count */}
            <text x={l.x + l.w / 2} y={l.y + l.h + 14}
              fill={isActive ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.15)'}
              fontSize="7" fontFamily="monospace" textAnchor="middle">{l.ch}</text>
          </g>
        );
      })}

      {/* ─── Section labels ─── */}
      <text x="140" y="52" fill={C.label} fontSize="9" fontFamily="monospace" textAnchor="middle">
        ENCODER ▼
      </text>
      <text x="302" y="195" fill={C.label} fontSize="8" fontFamily="monospace" textAnchor="middle">
        Bottleneck
      </text>
      <text x="460" y="52" fill={C.label} fontSize="9" fontFamily="monospace" textAnchor="middle">
        ▲ DECODER
      </text>

      {/* ─── Divider to mask output ─── */}
      <line x1="575" y1="70" x2="575" y2="300" stroke={C.line} strokeWidth="0.8" strokeDasharray="4,6" />
      <text x="575" y="60" fill={C.label} fontSize="7" fontFamily="monospace" textAnchor="middle">→ Output</text>

      {/* ─── Plate outline with segmentation mask ─── */}
      <circle cx="680" cy="180" r="82"
        fill="none" stroke={C.line} strokeWidth="1.2" strokeDasharray="6,4" />

      {/* Food mask blobs painting in */}
      {maskBlobs.map((blob, i) => {
        const visible = maskProgress > i / maskBlobs.length;
        const opacity = visible ? Math.min(0.65, maskProgress) : 0;
        return (
          <ellipse key={i}
            cx={blob.cx} cy={blob.cy} rx={blob.rx} ry={blob.ry}
            fill={C.green} opacity={opacity * 0.35}
            stroke={C.green} strokeWidth={visible ? 1.4 : 0}
            strokeOpacity={opacity} />
        );
      })}

      {/* Scan line across plate */}
      {scanY > 100 && scanY < 260 && (
        <line x1="605" y1={scanY} x2="755" y2={scanY}
          stroke={C.green} strokeWidth="1.5" opacity="0.35" />
      )}

      {/* Mask output label */}
      <text x="680" y="285" fill={C.label} fontSize="9" fontFamily="monospace" textAnchor="middle">
        Food Mask
      </text>

      {/* Stage badges */}
      <text x="400" y="380" fill="rgba(255,255,255,0.1)" fontSize="9"
        fontFamily="monospace" textAnchor="middle" letterSpacing="3">
        U-NET SEGMENTATION
      </text>
    </g>
  );
};

export default UNetLoader;
