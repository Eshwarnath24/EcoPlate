import React from 'react';

// --- Waste Estimation Loader ---
// Before/After area comparison with shrinking circles and delta computation
const WasteLoader = ({ tick }) => {
  const items = [
    { name: 'Rice',    beforeR: 38, afterR: 25, waste: 35, color: '#3B82F6' },
    { name: 'Chapati', beforeR: 32, afterR: 10, waste: 70, color: '#8B5CF6' },
    { name: 'Curry',   beforeR: 36, afterR: 29, waste: 20, color: '#10B981' },
    { name: 'Dal',     beforeR: 40, afterR: 18, waste: 54, color: '#F59E0B' },
  ];

  const phase = tick % 24;
  // Each item reveals at a staggered time
  const getItemActive = (idx) => phase > idx * 4 + 2;
  const showDelta = phase > 14;
  const showTotal = phase > 20;

  // Shrink animation factor
  const shrinkT = Math.min(1, (tick % 30) / 15);

  return (
    <g>
      {/* Column headers */}
      <text x="190" y="42" fill="rgba(255,255,255,0.35)" fontSize="10" fontFamily="monospace" textAnchor="middle">
        T0 (Before)
      </text>
      <text x="430" y="42" fill="rgba(255,255,255,0.35)" fontSize="10" fontFamily="monospace" textAnchor="middle">
        T1 (After)
      </text>
      <text x="630" y="42" fill="rgba(255,255,255,0.35)" fontSize="10" fontFamily="monospace" textAnchor="middle">
        Delta
      </text>

      {items.map((item, i) => {
        const y = 100 + i * 80;
        const active = getItemActive(i);
        const currentAfterR = active ? item.beforeR - (item.beforeR - item.afterR) * shrinkT : item.beforeR;

        return (
          <g key={i}>
            {/* Item label */}
            <text x="60" y={y + 4} fill={active ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.15)'}
              fontSize="10" fontFamily="monospace" fontWeight="bold">
              {item.name}
            </text>

            {/* Before circle (constant) */}
            <circle cx="190" cy={y} r={item.beforeR}
              fill="rgba(255,255,255,0.03)" stroke={active ? item.color : 'rgba(255,255,255,0.1)'}
              strokeWidth="1.5" opacity={active ? 1 : 0.3} />
            <text x="190" y={y + 4} fill={active ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)'}
              fontSize="8" fontFamily="monospace" textAnchor="middle">
              {active ? `${Math.round(item.beforeR * item.beforeR * 3.14)}px²` : ''}
            </text>

            {/* Connecting line */}
            <line x1={190 + item.beforeR + 5} y1={y} x2={430 - item.beforeR - 5} y2={y}
              stroke={active ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)'}
              strokeWidth="1" strokeDasharray={active ? '4,3' : '2,4'} />
            
            {/* Data particle */}
            {active && !showDelta && (() => {
              const t = (tick % 10) / 10;
              const px = 190 + item.beforeR + 5 + (430 - item.beforeR - 5 - 190 - item.beforeR - 5) * t;
              return <circle cx={px} cy={y} r="2" fill={item.color} opacity="0.7" />;
            })()}

            {/* After circle (shrinking) */}
            <circle cx="430" cy={y} r={currentAfterR}
              fill={active ? `${item.color}15` : 'rgba(255,255,255,0.01)'}
              stroke={active ? '#EF4444' : 'rgba(255,255,255,0.06)'}
              strokeWidth="1.5" opacity={active ? 1 : 0.3} />
            {/* Ghost outline of before size for comparison */}
            {active && (
              <circle cx="430" cy={y} r={item.beforeR}
                fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3,3" />
            )}

            {/* Delta value */}
            {showDelta && active && (
              <text x="630" y={y + 4} fill="#EF4444" fontSize="14" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                −{item.waste}%
              </text>
            )}
          </g>
        );
      })}

      {/* Overall waste total */}
      {showTotal && (
        <g>
          <line x1="560" y1="365" x2="700" y2="365" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <text x="630" y="385" fill="#EF4444" fontSize="16" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
            TOTAL: −42%
          </text>
        </g>
      )}

      {/* Stage label */}
      <text x="350" y="385" fill="rgba(255,255,255,0.12)" fontSize="9" fontFamily="monospace" textAnchor="middle" letterSpacing="3">
        WASTE ESTIMATION
      </text>
    </g>
  );
};

export default WasteLoader;
