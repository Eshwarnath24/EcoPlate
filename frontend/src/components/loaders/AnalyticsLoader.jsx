import React from 'react';

// --- Analytics Generation Loader ---
// Data streams converging into aggregation, forming bar chart and final statistics
const AnalyticsLoader = ({ tick }) => {
  const items = [
    { name: 'Rice',     pct: 65, color: '#3B82F6' },
    { name: 'Chapati',  pct: 30, color: '#8B5CF6' },
    { name: 'Curry',    pct: 80, color: '#10B981' },
    { name: 'Dal',      pct: 46, color: '#F59E0B' },
    { name: 'Veg',      pct: 82, color: '#EC4899' },
  ];

  const phase = tick % 30;
  const showBars = phase > 8;
  const showStats = phase > 18;
  const barGrowth = showBars ? Math.min(1, (phase - 8) / 10) : 0;

  // Data stream source nodes (left side)
  const sourceNodes = items.map((_, i) => ({
    x: 80, y: 80 + i * 65
  }));

  // Aggregation node (center)
  const aggX = 320, aggY = 200;

  return (
    <g>
      {/* Data stream edges from sources to aggregation */}
      {sourceNodes.map((n, i) => {
        const revealed = phase > i * 2;
        return (
          <g key={`stream-${i}`}>
            <path d={`M ${n.x + 8} ${n.y} Q ${200} ${n.y}, ${aggX - 18} ${aggY}`}
              fill="none" stroke={revealed ? items[i].color : 'rgba(255,255,255,0.04)'}
              strokeWidth={revealed ? 1.5 : 0.5} opacity={revealed ? 0.4 : 0.2}
              strokeDasharray={revealed ? 'none' : '4,4'} />
            
            {/* Data particle */}
            {revealed && !showBars && (() => {
              const t = ((tick - i * 2) % 10) / 10;
              // Approximate point along quadratic bezier
              const px = (1 - t) * (1 - t) * (n.x + 8) + 2 * (1 - t) * t * 200 + t * t * (aggX - 18);
              const py = (1 - t) * (1 - t) * n.y + 2 * (1 - t) * t * n.y + t * t * aggY;
              return <circle cx={px} cy={py} r="2.5" fill={items[i].color} opacity="0.8" />;
            })()}

            {/* Source node */}
            {revealed && <circle cx={n.x} cy={n.y} r="10" fill={`${items[i].color}15`} />}
            <circle cx={n.x} cy={n.y} r={revealed ? 5 : 3}
              fill={revealed ? items[i].color : 'rgba(255,255,255,0.1)'}
              stroke={revealed ? `${items[i].color}55` : 'none'}
              strokeWidth="1.5" />
            <text x={n.x + 16} y={n.y + 4}
              fill={revealed ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.1)'}
              fontSize="9" fontFamily="monospace">
              {items[i].name}
            </text>
          </g>
        );
      })}

      {/* Aggregation node */}
      {showBars && <circle cx={aggX} cy={aggY} r="26" fill="rgba(255,255,255,0.03)" />}
      <circle cx={aggX} cy={aggY} r={showBars ? 16 : 10}
        fill={showBars ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)'}
        stroke={showBars ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}
        strokeWidth="1.5" />
      <text x={aggX} y={aggY + 4} fill="rgba(255,255,255,0.5)" fontSize="8" fontFamily="monospace" textAnchor="middle">
        Σ
      </text>

      {/* Bar chart output (right side) */}
      {showBars && (
        <g>
          {/* Edges from aggregation to bars */}
          {items.map((item, i) => {
            const barX = 480;
            const barY = 70 + i * 62;
            return (
              <g key={`bar-${i}`}>
                <line x1={aggX + 18} y1={aggY} x2={barX} y2={barY + 10}
                  stroke="rgba(255,255,255,0.06)" strokeWidth="0.7" />

                {/* Bar label */}
                <text x={barX} y={barY - 4} fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="monospace">
                  {item.name}
                </text>

                {/* Bar background */}
                <rect x={barX} y={barY} width="220" height="16" rx="3"
                  fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />

                {/* Bar fill (consumed portion) */}
                <rect x={barX} y={barY} width={220 * (item.pct / 100) * barGrowth} height="16" rx="3"
                  fill={item.color} opacity="0.6" />

                {/* Percentage label */}
                {barGrowth > 0.5 && (
                  <text x={barX + 220 * (item.pct / 100) * barGrowth + 8} y={barY + 12}
                    fill={item.color} fontSize="9" fontFamily="monospace" fontWeight="bold">
                    {Math.round(item.pct * barGrowth)}%
                  </text>
                )}
              </g>
            );
          })}
        </g>
      )}

      {/* Overall stat */}
      {showStats && (
        <text x="590" y="390" fill="#EF4444" fontSize="13" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
          Overall Waste: 42%
        </text>
      )}

      {/* Stage label */}
      <text x="300" y="390" fill="rgba(255,255,255,0.12)" fontSize="9" fontFamily="monospace" textAnchor="middle" letterSpacing="3">
        ANALYTICS
      </text>
    </g>
  );
};

export default AnalyticsLoader;
