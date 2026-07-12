import React from 'react';

// --- Waste Estimation Loader ---
// Computes: Waste % = (Before Area − After Area) / Before Area × 100, per food item
// Visual: before/after circle comparison (shrinking) + per-item delta + aggregate donut chart
const WasteLoader = ({ tick }) => {
  const C = {
    green: '#48BB78',
    greenDim: 'rgba(72, 187, 120, 0.15)',
    gold: '#D9A441',
    goldDim: 'rgba(217, 164, 65, 0.12)',
    waste: '#C05621',
    wasteDim: 'rgba(192, 86, 33, 0.15)',
    line: 'rgba(255, 255, 255, 0.08)',
    node: 'rgba(255, 255, 255, 0.12)',
    label: 'rgba(255, 255, 255, 0.3)',
  };

  const items = [
    { name: 'Rice',    beforeR: 30, afterR: 20, waste: 35, color: '#48BB78' },
    { name: 'Chapati', beforeR: 26, afterR: 8,  waste: 70, color: '#D9A441' },
    { name: 'Curry',   beforeR: 28, afterR: 22, waste: 20, color: '#C05621' },
    { name: 'Dal',     beforeR: 32, afterR: 15, waste: 54, color: '#48BB78' },
  ];

  const phase = tick % 28;
  const getItemActive = (idx) => phase > idx * 4 + 2;
  const showDelta = phase > 14;
  const showTotal = phase > 22;

  // Shrink animation factor (0 → 1 over time)
  const shrinkT = Math.min(1, (tick % 30) / 15);

  // Donut chart for overall waste
  const totalWaste = 42;
  const donutR = 48;
  const donutC = 2 * Math.PI * donutR;
  const donutFill = showTotal ? totalWaste / 100 : 0;

  return (
    <g>
      {/* ─── Column headers ─── */}
      <text x="175" y="42" fill={C.label} fontSize="10" fontFamily="monospace" textAnchor="middle">
        T0 (Before)
      </text>
      <text x="375" y="42" fill={C.label} fontSize="10" fontFamily="monospace" textAnchor="middle">
        T1 (After)
      </text>
      <text x="520" y="42" fill={C.label} fontSize="10" fontFamily="monospace" textAnchor="middle">
        Waste
      </text>

      {/* ─── Per-item comparison rows ─── */}
      {items.map((item, i) => {
        const y = 100 + i * 72;
        const active = getItemActive(i);
        const currentAfterR = active
          ? item.beforeR - (item.beforeR - item.afterR) * shrinkT
          : item.beforeR;

        return (
          <g key={i}>
            {/* Item name */}
            <text x="65" y={y + 4}
              fill={active ? 'rgba(255,255,255,0.6)' : C.node}
              fontSize="10" fontFamily="monospace" fontWeight="bold">
              {item.name}
            </text>

            {/* Before circle (constant size) */}
            <circle cx="175" cy={y} r={item.beforeR}
              fill="rgba(255,255,255,0.02)"
              stroke={active ? item.color : C.line}
              strokeWidth="1.5" opacity={active ? 1 : 0.3} />
            {active && (
              <text x="175" y={y + 4}
                fill="rgba(255,255,255,0.3)"
                fontSize="7" fontFamily="monospace" textAnchor="middle">
                {Math.round(item.beforeR * item.beforeR * 3.14)}px²
              </text>
            )}

            {/* Connecting arrow */}
            <line x1={175 + item.beforeR + 8} y1={y}
              x2={375 - item.beforeR - 8} y2={y}
              stroke={active ? 'rgba(255,255,255,0.15)' : C.line}
              strokeWidth="0.8" strokeDasharray={active ? '4,3' : '2,4'} />

            {/* Data particle along arrow */}
            {active && !showDelta && (() => {
              const t = (tick % 10) / 10;
              const startX = 175 + item.beforeR + 8;
              const endX = 375 - item.beforeR - 8;
              const px = startX + (endX - startX) * t;
              return <circle cx={px} cy={y} r="2" fill={item.color} opacity="0.7" />;
            })()}

            {/* After circle (shrinks over time) */}
            <circle cx="375" cy={y} r={currentAfterR}
              fill={active ? `${item.color}12` : 'rgba(255,255,255,0.01)'}
              stroke={active ? C.waste : C.line}
              strokeWidth="1.5" opacity={active ? 1 : 0.3} />
            {/* Ghost outline showing original size */}
            {active && (
              <circle cx="375" cy={y} r={item.beforeR}
                fill="none" stroke="rgba(255,255,255,0.06)"
                strokeWidth="0.8" strokeDasharray="3,3" />
            )}

            {/* Delta percentage */}
            {showDelta && active && (
              <text x="520" y={y + 5}
                fill={C.waste} fontSize="14"
                fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                −{item.waste}%
              </text>
            )}
          </g>
        );
      })}

      {/* ─── Aggregate donut chart ─── */}
      <g transform="translate(690, 195)">
        {/* Decorative outer ring */}
        <circle r={donutR + 14} fill="none"
          stroke={C.line} strokeWidth="0.8" strokeDasharray="3,6" />

        {/* Background track */}
        <circle r={donutR} fill="none" stroke={C.line} strokeWidth="10" />

        {/* Waste fill arc */}
        {showTotal && (
          <circle r={donutR} fill="none"
            stroke={C.waste} strokeWidth="10"
            strokeDasharray={donutC}
            strokeDashoffset={donutC * (1 - donutFill)}
            strokeLinecap="round"
            transform="rotate(-90)" />
        )}

        {/* Center percentage */}
        <text y="6"
          fill={showTotal ? 'rgba(255,255,255,0.8)' : C.node}
          fontSize="18" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
          {showTotal ? `${totalWaste}%` : '—'}
        </text>
        <text y="22" fill={C.label}
          fontSize="8" fontFamily="monospace" textAnchor="middle">
          {showTotal ? 'total waste' : ''}
        </text>
      </g>

      {/* ─── Stage badge ─── */}
      <text x="300" y="380" fill="rgba(255,255,255,0.1)" fontSize="9"
        fontFamily="monospace" textAnchor="middle" letterSpacing="3">
        WASTE ESTIMATION
      </text>
    </g>
  );
};

export default WasteLoader;
