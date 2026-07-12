import React from 'react';

// --- Siamese Before-After Matching Loader ---
// Matches the same food category's region between T0 (before) and T1 (after) images
// Visual: left column = T0 food items, right column = T1 items (shuffled), connecting lines animate
// Wrong pairings briefly flash then fade, correct pairings lock in with particles
const MatchLoader = ({ tick }) => {
  const C = {
    green: '#48BB78',
    greenDim: 'rgba(72, 187, 120, 0.15)',
    gold: '#D9A441',
    goldDim: 'rgba(217, 164, 65, 0.12)',
    waste: '#C05621',
    line: 'rgba(255, 255, 255, 0.08)',
    node: 'rgba(255, 255, 255, 0.12)',
    label: 'rgba(255, 255, 255, 0.3)',
  };

  // Food items to match
  const items = [
    { name: 'Rice',    color: '#48BB78' },
    { name: 'Chapati', color: '#D9A441' },
    { name: 'Curry',   color: '#C05621' },
    { name: 'Dal',     color: '#48BB78' },
  ];

  // T1 items appear in a shuffled visual order (simulates real matching challenge)
  const t1VisualOrder = [2, 0, 3, 1]; // Curry, Rice, Dal, Chapati

  const leftX = 170, rightX = 630;
  const startY = 90, spacing = 70;

  const phase = tick % 28;
  // Each match locks in sequentially (every ~5 ticks)
  const matchProgress = Math.min(items.length, Math.floor(phase / 5));
  const allMatched = matchProgress >= items.length;

  // Brief wrong-match flash in early phase
  const showWrongFlash = phase >= 2 && phase < 4;

  return (
    <g>
      {/* ─── Column headers ─── */}
      <text x={leftX} y="55" fill={C.label} fontSize="10" fontFamily="monospace" textAnchor="middle">
        T0 (Before)
      </text>
      <text x={rightX} y="55" fill={C.label} fontSize="10" fontFamily="monospace" textAnchor="middle">
        T1 (After)
      </text>

      {/* ─── Wrong match flash (red dashed, momentary) ─── */}
      {showWrongFlash && items.slice(0, 2).map((_, i) => {
        const wrongIdx = (i + 2) % items.length;
        const fromY = startY + i * spacing;
        const toY = startY + wrongIdx * spacing;
        return (
          <line key={`wrong-${i}`}
            x1={leftX + 28} y1={fromY}
            x2={rightX - 28} y2={toY}
            stroke={C.waste} strokeWidth="1.2"
            strokeDasharray="6,4" opacity="0.45" />
        );
      })}

      {/* ─── Correct match lines (animate in one by one) ─── */}
      {items.map((item, i) => {
        if (i >= matchProgress) return null;
        const fromY = startY + i * spacing;
        const toIdx = t1VisualOrder.indexOf(i);
        const toY = startY + toIdx * spacing;

        // Particle travelling along the match line
        const t = (tick % 10) / 10;
        const px = leftX + 28 + (rightX - 28 - leftX - 28) * t;
        const py = fromY + (toY - fromY) * t;

        return (
          <g key={`match-${i}`}>
            <line x1={leftX + 28} y1={fromY} x2={rightX - 28} y2={toY}
              stroke={C.green} strokeWidth="1.6" opacity="0.65" />
            <circle cx={px} cy={py} r="2.5" fill={C.gold} opacity="0.8" />
          </g>
        );
      })}

      {/* ─── T0 items (left column) ─── */}
      {items.map((item, i) => {
        const y = startY + i * spacing;
        const matched = i < matchProgress;
        return (
          <g key={`t0-${i}`}>
            {matched && <circle cx={leftX} cy={y} r="18" fill={C.greenDim} />}
            <circle cx={leftX} cy={y}
              r={matched ? 10 : 8}
              fill={matched ? item.color : C.node}
              stroke={matched ? `${item.color}55` : C.line}
              strokeWidth="1.5"
              opacity={matched ? 1 : 0.5} />
            <text x={leftX - 42} y={y + 4}
              fill={matched ? 'rgba(255,255,255,0.6)' : C.node}
              fontSize="9" fontFamily="monospace" textAnchor="end"
              fontWeight={matched ? 'bold' : 'normal'}>
              {item.name}
            </text>
          </g>
        );
      })}

      {/* ─── T1 items (right column, shuffled visual order) ─── */}
      {t1VisualOrder.map((origIdx, i) => {
        const y = startY + i * spacing;
        const item = items[origIdx];
        const matched = origIdx < matchProgress;
        return (
          <g key={`t1-${i}`}>
            {matched && <circle cx={rightX} cy={y} r="15" fill={C.greenDim} />}
            {/* T1 circles slightly smaller (remaining food) */}
            <circle cx={rightX} cy={y}
              r={matched ? 7 : 6}
              fill={matched ? item.color : C.node}
              stroke={matched ? `${item.color}55` : C.line}
              strokeWidth="1.5"
              opacity={matched ? 1 : 0.5} />
            <text x={rightX + 42} y={y + 4}
              fill={matched ? 'rgba(255,255,255,0.6)' : C.node}
              fontSize="9" fontFamily="monospace"
              fontWeight={matched ? 'bold' : 'normal'}>
              {item.name}
            </text>
          </g>
        );
      })}

      {/* ─── Match confirmation labels (appear on the connecting line) ─── */}
      {items.map((item, i) => {
        if (i >= matchProgress) return null;
        const fromY = startY + i * spacing;
        const toIdx = t1VisualOrder.indexOf(i);
        const toY = startY + toIdx * spacing;
        const midX = (leftX + rightX) / 2;
        const midY = (fromY + toY) / 2;
        return (
          <text key={`clabel-${i}`} x={midX} y={midY - 8}
            fill={C.green} fontSize="8" fontFamily="monospace"
            textAnchor="middle" opacity="0.6">
            {item.name} ↔ {item.name}
          </text>
        );
      })}

      {/* ─── Similarity score badge (appears when all matched) ─── */}
      {allMatched && (
        <g>
          <rect x="350" y="332" width="100" height="24" rx="12"
            fill={C.greenDim} stroke={C.green} strokeWidth="1" />
          <text x="400" y="348"
            fill={C.green} fontSize="10" fontFamily="monospace"
            textAnchor="middle" fontWeight="bold">
            sim = 0.847
          </text>
        </g>
      )}

      {/* ─── Shared weights indicator ─── */}
      <line x1={leftX + 40} y1="330" x2={rightX - 40} y2="330"
        stroke={C.line} strokeWidth="0.8" />
      <text x="400" y="324"
        fill="rgba(255,255,255,0.12)" fontSize="7"
        fontFamily="monospace" textAnchor="middle">
        SHARED WEIGHTS
      </text>

      {/* ─── Stage badges ─── */}
      <text x="80" y="380" fill="rgba(255,255,255,0.25)" fontSize="11"
        fontFamily="monospace" fontWeight="bold">Siamese Net</text>
      <text x="400" y="380" fill="rgba(255,255,255,0.1)" fontSize="9"
        fontFamily="monospace" textAnchor="middle" letterSpacing="3">
        BEFORE–AFTER MATCHING
      </text>
    </g>
  );
};

export default MatchLoader;
