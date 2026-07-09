import React from 'react';

// --- CNN Classification Loader (MobileNetV3 / EfficientNet-B0) ---
// Funnel-shaped network with layers converging to food class outputs
const CNNLoader = ({ tick }) => {
  // Network layers — nodes per layer get smaller (funnel), then expand for classes
  const layerDefs = [
    { x: 80,  count: 8, label: 'Input' },
    { x: 185, count: 6, label: 'Conv' },
    { x: 290, count: 5, label: 'DWConv' },
    { x: 395, count: 4, label: 'SE' },
    { x: 500, count: 3, label: 'FC' },
    { x: 640, count: 5, label: null }, // output classes
  ];

  const foodClasses = ['Rice', 'Chapati', 'Curry', 'Dal', 'Veg'];
  const confidences = [0.94, 0.91, 0.87, 0.96, 0.89];

  // Build node positions
  const layers = layerDefs.map(def => {
    const nodes = [];
    const totalH = (def.count - 1) * 42;
    const startY = 200 - totalH / 2;
    for (let i = 0; i < def.count; i++) {
      nodes.push({ x: def.x, y: startY + i * 42 });
    }
    return { ...def, nodes };
  });

  // Active layer pulses through based on tick
  const activeLayer = tick % (layerDefs.length * 3);
  const activeLayerIdx = Math.min(Math.floor(activeLayer / 3), layerDefs.length - 1);

  return (
    <g>
      {/* Edges between consecutive layers */}
      {layers.slice(0, -1).map((layer, li) => {
        const nextLayer = layers[li + 1];
        const isActive = li === activeLayerIdx || li + 1 === activeLayerIdx;
        return layer.nodes.map((n, ni) =>
          nextLayer.nodes.map((nn, nni) => {
            // Sparse connections — skip some for visual clarity
            if (layer.count > 4 && nextLayer.count > 4 && (ni + nni) % 3 !== 0) return null;
            return (
              <line key={`e-${li}-${ni}-${nni}`}
                x1={n.x + 5} y1={n.y} x2={nn.x - 5} y2={nn.y}
                stroke={isActive ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)'}
                strokeWidth={isActive ? 1 : 0.5} />
            );
          })
        );
      })}

      {/* Data particles on active edges */}
      {activeLayerIdx < layers.length - 1 && (() => {
        const fromLayer = layers[activeLayerIdx];
        const toLayer = layers[activeLayerIdx + 1];
        const t = (tick % 8) / 8;
        return fromLayer.nodes.slice(0, 3).map((n, pi) => {
          const target = toLayer.nodes[Math.min(pi, toLayer.nodes.length - 1)];
          const px = n.x + 5 + (target.x - 5 - n.x - 5) * t;
          const py = n.y + (target.y - n.y) * t;
          return <circle key={`p-${pi}`} cx={px} cy={py} r="2" fill="#3B82F6" opacity="0.8" />;
        });
      })()}

      {/* Nodes */}
      {layers.map((layer, li) => {
        const isActive = li === activeLayerIdx;
        const isPast = li < activeLayerIdx;
        const isOutput = li === layers.length - 1;
        return layer.nodes.map((n, ni) => {
          const nodeActive = isActive || (isOutput && activeLayerIdx >= layers.length - 1);
          const nodeColor = nodeActive
            ? (isOutput ? '#10B981' : '#3B82F6')
            : isPast ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.12)';
          return (
            <g key={`n-${li}-${ni}`}>
              {nodeActive && <circle cx={n.x} cy={n.y} r="14" fill={`${isOutput ? '#10B981' : '#3B82F6'}15`} />}
              <circle cx={n.x} cy={n.y} r={nodeActive ? 5 : 3.5}
                fill={nodeColor}
                stroke={nodeActive ? `${isOutput ? '#10B981' : '#3B82F6'}66` : 'none'}
                strokeWidth="1.5" />
              {/* Food class labels at output */}
              {isOutput && (
                <text x={n.x + 14} y={n.y + 4}
                  fill={nodeActive ? '#10B981' : 'rgba(255,255,255,0.2)'}
                  fontSize="10" fontFamily="monospace" fontWeight={nodeActive ? 'bold' : 'normal'}>
                  {foodClasses[ni]} {nodeActive ? `(${confidences[ni]})` : ''}
                </text>
              )}
            </g>
          );
        });
      })}

      {/* Layer labels */}
      {layers.map((layer, li) => layer.label && (
        <text key={`lbl-${li}`} x={layer.x} y={345}
          fill="rgba(255,255,255,0.2)" fontSize="8" fontFamily="monospace" textAnchor="middle">
          {layer.label}
        </text>
      ))}

      {/* Model name */}
      <text x="80" y="380" fill="rgba(255,255,255,0.35)" fontSize="11" fontFamily="monospace" fontWeight="bold">
        MobileNetV3
      </text>
      <text x="400" y="380" fill="rgba(255,255,255,0.12)" fontSize="9" fontFamily="monospace" textAnchor="middle" letterSpacing="3">
        CNN CLASSIFICATION
      </text>
    </g>
  );
};

export default CNNLoader;
