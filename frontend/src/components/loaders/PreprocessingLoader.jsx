import React from 'react';

// --- Preprocessing Loader ---
// Three sub-phases: plate boundary detection → geometry normalization → CLAHE lighting correction
// Visual: circular boundary draws itself around a plate, grid straightens, sweep bar corrects lighting
const PreprocessingLoader = ({ tick }) => {
  // Warm earthy palette (renders against dark terminal bg)
  const C = {
    green: '#48BB78',
    greenDim: 'rgba(72, 187, 120, 0.15)',
    gold: '#D9A441',
    goldDim: 'rgba(217, 164, 65, 0.12)',
    line: 'rgba(255, 255, 255, 0.08)',
    node: 'rgba(255, 255, 255, 0.12)',
    label: 'rgba(255, 255, 255, 0.3)',
  };

  const totalCycle = 45;
  const phase = tick % totalCycle;
  const subPhase = phase < 15 ? 0 : phase < 30 ? 1 : 2;
  const subLabels = [
    'Detecting plate boundary...',
    'Normalizing plate geometry...',
    'Correcting lighting (CLAHE)...',
  ];

  const cx = 400, cy = 185;
  const plateR = 125;
  const circumference = 2 * Math.PI * plateR;

  // Phase 0: boundary circle draws progressively
  const drawProgress = subPhase === 0
    ? Math.min(1, (phase % 15) / 12)
    : 1;

  // Detection points around the boundary (8 control points)
  const detectionPoints = Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
    return {
      x: cx + plateR * Math.cos(angle),
      y: cy + plateR * Math.sin(angle),
      active: drawProgress > (i + 1) / 9,
    };
  });

  // Phase 1: perspective grid straightens
  const settle = subPhase >= 1 ? Math.min(1, ((phase - 15) % 15) / 10) : 0;

  // Phase 2: CLAHE sweep bar moves vertically
  const sweepProgress = subPhase === 2 ? ((phase - 30) % 15) / 15 : -1;
  const sweepY = cy - plateR + sweepProgress * plateR * 2;

  // Rotating scan line during boundary detection
  const scanAngle = (tick * 5) % 360;
  const scanRad = (scanAngle * Math.PI) / 180;

  return (
    <g>
      {/* Raw image frame — fades as the plate boundary crops it */}
      <rect x={cx - 170} y={cy - 130} width="340" height="260" rx="6"
        fill="rgba(255,255,255,0.02)"
        stroke={C.line} strokeWidth="1.2"
        opacity={Math.max(0.15, 1 - drawProgress * 0.85)} />

      {/* Perspective grid lines (distorted → straight) */}
      {Array.from({ length: 5 }).map((_, i) => {
        const baseY = cy - 100 + i * 50;
        const distort = (1 - settle) * (i % 2 === 0 ? 10 : -8);
        return (
          <line key={`h${i}`}
            x1={cx - 140 + distort} y1={baseY}
            x2={cx + 140 - distort} y2={baseY}
            stroke={C.line} strokeWidth="0.6" />
        );
      })}
      {Array.from({ length: 7 }).map((_, i) => {
        const baseX = cx - 140 + i * 47;
        const distort = (1 - settle) * (i % 2 === 0 ? 8 : -5);
        return (
          <line key={`v${i}`}
            x1={baseX} y1={cy - 100 + distort}
            x2={baseX} y2={cy + 100 - distort}
            stroke={C.line} strokeWidth="0.6" />
        );
      })}

      {/* Plate boundary — ghost ring */}
      <circle cx={cx} cy={cy} r={plateR}
        fill="none" stroke={C.greenDim} strokeWidth="2" />

      {/* Plate boundary — animated draw */}
      <circle cx={cx} cy={cy} r={plateR}
        fill="none" stroke={C.green} strokeWidth="2.5"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - drawProgress)}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`} />

      {/* Detection control points */}
      {detectionPoints.map((pt, i) => (
        <g key={i}>
          {pt.active && (
            <circle cx={pt.x} cy={pt.y} r="10" fill={C.greenDim} />
          )}
          <circle cx={pt.x} cy={pt.y}
            r={pt.active ? 3.5 : 2}
            fill={pt.active ? C.green : C.node}
            stroke={pt.active ? C.greenDim : 'none'}
            strokeWidth="2" />
        </g>
      ))}

      {/* Rotating scan line (phase 0 only) */}
      {subPhase === 0 && (
        <line
          x1={cx} y1={cy}
          x2={cx + plateR * 0.85 * Math.cos(scanRad)}
          y2={cy + plateR * 0.85 * Math.sin(scanRad)}
          stroke={C.green} strokeWidth="1.2" opacity="0.4" />
      )}

      {/* Soft green fill inside circle when geometry is normalized */}
      {subPhase >= 1 && (
        <circle cx={cx} cy={cy} r={plateR - 3}
          fill={C.greenDim} opacity={0.2 * settle} />
      )}

      {/* CLAHE sweep bar (phase 2) */}
      {subPhase === 2 && sweepY > cy - plateR && sweepY < cy + plateR && (
        <g>
          <line x1={cx - plateR + 15} y1={sweepY}
            x2={cx + plateR - 15} y2={sweepY}
            stroke={C.gold} strokeWidth="2" opacity="0.7" />
          <rect x={cx - plateR + 15} y={sweepY}
            width={(plateR - 15) * 2} height="22"
            fill={C.goldDim} opacity="0.5" />
        </g>
      )}

      {/* Sub-phase progress dots */}
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={cx - 20 + i * 20} cy="335"
          r={subPhase === i ? 4 : 2.5}
          fill={i <= subPhase ? C.green : C.node}
          opacity={subPhase === i ? 1 : (i < subPhase ? 0.5 : 0.25)} />
      ))}

      {/* Current operation label */}
      <text x={cx} y="360" fill={C.label} fontSize="10"
        fontFamily="monospace" textAnchor="middle">
        {subLabels[subPhase]}
      </text>

      {/* Stage badge */}
      <text x="80" y="380" fill="rgba(255,255,255,0.25)" fontSize="11"
        fontFamily="monospace" fontWeight="bold">OpenCV</text>
      <text x={cx} y="380" fill="rgba(255,255,255,0.1)" fontSize="9"
        fontFamily="monospace" textAnchor="middle" letterSpacing="3">
        PREPROCESSING
      </text>
    </g>
  );
};

export default PreprocessingLoader;
