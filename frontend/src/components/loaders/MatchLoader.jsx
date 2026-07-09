import React from 'react';

// --- Siamese Matching Loader ---
// Two parallel network branches (before/after) converge to embedding comparison
const MatchLoader = ({ tick }) => {
  // Before branch nodes (top)
  const beforeNodes = [
    { x: 100, y: 80 }, { x: 100, y: 140 }, { x: 100, y: 200 },  // input
    { x: 220, y: 100 }, { x: 220, y: 170 },                       // hidden
    { x: 340, y: 135 },                                             // embedding
  ];
  // After branch nodes (bottom)
  const afterNodes = [
    { x: 100, y: 230 }, { x: 100, y: 290 }, { x: 100, y: 350 },  // input
    { x: 220, y: 250 }, { x: 220, y: 320 },                       // hidden
    { x: 340, y: 285 },                                             // embedding
  ];

  // Before branch edges
  const beforeEdges = [
    [0, 3], [0, 4], [1, 3], [1, 4], [2, 3], [2, 4], [3, 5], [4, 5]
  ];
  const afterEdges = [
    [0, 3], [0, 4], [1, 3], [1, 4], [2, 3], [2, 4], [3, 5], [4, 5]
  ];

  const phase = tick % 20;
  const isMatched = phase > 12;

  // Active layer cycles: 0=input, 1=hidden, 2=embedding, 3=comparison
  const activePhase = phase < 5 ? 0 : phase < 9 ? 1 : phase < 13 ? 2 : 3;

  const renderBranch = (nodes, edges, label, yLabel) => (
    <g>
      {/* Edges */}
      {edges.map(([s, t], i) => {
        const n1 = nodes[s], n2 = nodes[t];
        const layerS = s < 3 ? 0 : s < 5 ? 1 : 2;
        const edgeActive = layerS === activePhase || layerS + 1 === activePhase;
        return (
          <line key={`e-${label}-${i}`}
            x1={n1.x + 5} y1={n1.y} x2={n2.x - 5} y2={n2.y}
            stroke={edgeActive ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)'}
            strokeWidth={edgeActive ? 1.5 : 0.7} />
        );
      })}
      {/* Nodes */}
      {nodes.map((n, i) => {
        const layer = i < 3 ? 0 : i < 5 ? 1 : 2;
        const nodeActive = layer === activePhase;
        return (
          <g key={`n-${label}-${i}`}>
            {nodeActive && <circle cx={n.x} cy={n.y} r="14" fill="rgba(59,130,246,0.1)" />}
            <circle cx={n.x} cy={n.y} r={nodeActive ? 5 : 3.5}
              fill={nodeActive ? '#3B82F6' : 'rgba(255,255,255,0.15)'}
              stroke={nodeActive ? 'rgba(59,130,246,0.5)' : 'none'}
              strokeWidth="1.5" />
          </g>
        );
      })}
      {/* Branch label */}
      <text x="55" y={yLabel} fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="monospace" textAnchor="middle">
        {label}
      </text>
    </g>
  );

  // Comparator node
  const compX = 520, compY = 210;

  return (
    <g>
      {/* Shared weights indicator */}
      <rect x="85" y="205" width="165" height="10" rx="5"
        fill="none" stroke="rgba(121,40,202,0.2)" strokeWidth="1" strokeDasharray="3,3" />
      <text x="168" y="228" fill="rgba(121,40,202,0.3)" fontSize="7" fontFamily="monospace" textAnchor="middle">
        SHARED WEIGHTS
      </text>

      {/* Before branch */}
      {renderBranch(beforeNodes, beforeEdges, 'T0', 140)}
      {/* After branch */}
      {renderBranch(afterNodes, afterEdges, 'T1', 290)}

      {/* Matching curves from embeddings to comparator */}
      <path d={`M 345 135 C 430 135, 470 ${compY}, ${compX} ${compY}`}
        fill="none" stroke={isMatched ? '#7928CA' : 'rgba(255,255,255,0.1)'}
        strokeWidth={isMatched ? 2.5 : 1} strokeDasharray={isMatched ? 'none' : '5,5'} />
      <path d={`M 345 285 C 430 285, 470 ${compY}, ${compX} ${compY}`}
        fill="none" stroke={isMatched ? '#7928CA' : 'rgba(255,255,255,0.1)'}
        strokeWidth={isMatched ? 2.5 : 1} strokeDasharray={isMatched ? 'none' : '5,5'} />

      {/* Data particles along matching curves */}
      {activePhase >= 2 && !isMatched && (() => {
        const t = (tick % 8) / 8;
        // Simplified particle on top curve
        const px = 345 + (compX - 345) * t;
        const py = 135 + (compY - 135) * Math.sin(t * Math.PI / 2);
        return <circle cx={px} cy={py} r="2.5" fill="#7928CA" opacity="0.8" />;
      })()}

      {/* Comparator node */}
      {isMatched && <circle cx={compX} cy={compY} r="28" fill="rgba(121,40,202,0.08)" />}
      <circle cx={compX} cy={compY} r={isMatched ? 18 : 12}
        fill={isMatched ? '#7928CA' : 'rgba(255,255,255,0.05)'}
        stroke={isMatched ? 'rgba(121,40,202,0.5)' : 'rgba(255,255,255,0.15)'}
        strokeWidth="2" />
      <text x={compX} y={compY + 4} fill="white" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
        {isMatched ? '≈' : '?'}
      </text>

      {/* Similarity score */}
      <text x={compX + 30} y={compY - 20}
        fill={isMatched ? 'rgba(121,40,202,0.8)' : 'rgba(255,255,255,0.15)'}
        fontSize="11" fontFamily="monospace" fontWeight="bold">
        {isMatched ? 'sim = 0.847' : ''}
      </text>

      {/* Output: matched pairs list */}
      {isMatched && (
        <g>
          {['Rice ↔ Rice', 'Dal ↔ Dal', 'Chapati ↔ Chapati'].map((pair, i) => (
            <text key={i} x={620} y={160 + i * 28}
              fill="rgba(16,185,129,0.6)" fontSize="9" fontFamily="monospace">
              ✓ {pair}
            </text>
          ))}
        </g>
      )}

      {/* Model label */}
      <text x="80" y="380" fill="rgba(255,255,255,0.35)" fontSize="11" fontFamily="monospace" fontWeight="bold">
        Siamese Net
      </text>
      <text x="400" y="380" fill="rgba(255,255,255,0.12)" fontSize="9" fontFamily="monospace" textAnchor="middle" letterSpacing="3">
        BEFORE–AFTER MATCHING
      </text>
    </g>
  );
};

export default MatchLoader;
