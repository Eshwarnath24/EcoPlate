import React from 'react';

// --- CNN Classification Loader (MobileNetV3 / EfficientNet-B0) ---
// Takes segmented food regions (from U-Net) and classifies each into a food category
// Visual: input blobs on left → compact CNN funnel → classification labels with confidence bars
// Note: U-Net does food-vs-background segmentation; CNN does the fine-grained food classification
const CNNLoader = ({ tick }) => {
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

  // Classification results (these are output labels, not U-Net masks)
  const foodClasses = [
    { name: 'Rice',    conf: 0.94, color: '#48BB78' },
    { name: 'Chapati', conf: 0.91, color: '#D9A441' },
    { name: 'Curry',   conf: 0.87, color: '#C05621' },
    { name: 'Dal',     conf: 0.96, color: '#48BB78' },
    { name: 'Veg',     conf: 0.89, color: '#D9A441' },
  ];

  // Network layers (compact funnel)
  const layerDefs = [
    { x: 210, count: 6, label: 'Conv1' },
    { x: 280, count: 5, label: 'Conv2' },
    { x: 350, count: 4, label: 'DWConv' },
    { x: 420, count: 3, label: 'FC' },
  ];

  const layers = layerDefs.map(def => {
    const nodes = [];
    const totalH = (def.count - 1) * 38;
    const startY = 190 - totalH / 2;
    for (let i = 0; i < def.count; i++) {
      nodes.push({ x: def.x, y: startY + i * 38 });
    }
    return { ...def, nodes };
  });

  // Active layer pulses through
  const activeLayer = Math.min(layers.length - 1, Math.floor((tick % (layers.length * 3)) / 3));

  // Classification labels appear one at a time
  const classPhase = tick % 30;
  const revealedClasses = Math.min(foodClasses.length, Math.floor(classPhase / 4));

  // Convolution kernel scanning the input (3×3 grid)
  const kernelTick = tick % 9;
  const kernelRow = Math.floor(kernelTick / 3);
  const kernelCol = kernelTick % 3;

  return (
    <g>
      {/* ─── Input: segmented food blobs (from U-Net output) ─── */}
      <text x="85" y="55" fill={C.label} fontSize="9" fontFamily="monospace" textAnchor="middle">
        Segments
      </text>

      {/* Input food regions as irregular blobs */}
      <ellipse cx="85" cy="110" rx="24" ry="16" fill={C.greenDim} stroke={C.green} strokeWidth="1" />
      <ellipse cx="85" cy="185" rx="20" ry="18" fill={C.goldDim} stroke={C.gold} strokeWidth="1" />
      <ellipse cx="85" cy="260" rx="22" ry="14" fill="rgba(192,86,33,0.15)" stroke={C.waste} strokeWidth="1" />

      {/* Mini convolution kernel scanning over input */}
      <rect x={68 + kernelCol * 12} y={98 + kernelRow * 10}
        width="13" height="11" rx="2"
        fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1" />

      {/* ─── Connecting lines: input → first layer ─── */}
      {[110, 185, 260].map((y, i) => {
        const targetIdx = Math.min(i * 2, layers[0].nodes.length - 1);
        return (
          <line key={`in-${i}`}
            x1="112" y1={y}
            x2={layers[0].nodes[targetIdx].x - 6} y2={layers[0].nodes[targetIdx].y}
            stroke={C.line} strokeWidth="0.7" strokeDasharray="4,4" />
        );
      })}

      {/* ─── Network edges ─── */}
      {layers.slice(0, -1).map((layer, li) => {
        const nextLayer = layers[li + 1];
        const isActive = li === activeLayer || li + 1 === activeLayer;
        return layer.nodes.map((n, ni) =>
          nextLayer.nodes.map((nn, nni) => {
            // Sparse connections for visual clarity
            if (layer.count > 4 && nextLayer.count > 4 && (ni + nni) % 3 !== 0) return null;
            return (
              <line key={`e-${li}-${ni}-${nni}`}
                x1={n.x + 5} y1={n.y} x2={nn.x - 5} y2={nn.y}
                stroke={isActive ? 'rgba(255,255,255,0.12)' : C.line}
                strokeWidth={isActive ? 0.8 : 0.4} />
            );
          })
        );
      })}

      {/* ─── Data particles along active edges ─── */}
      {activeLayer < layers.length - 1 && (() => {
        const fromLayer = layers[activeLayer];
        const toLayer = layers[activeLayer + 1];
        const t = (tick % 8) / 8;
        return fromLayer.nodes.slice(0, 3).map((n, pi) => {
          const target = toLayer.nodes[Math.min(pi, toLayer.nodes.length - 1)];
          const px = n.x + 5 + (target.x - 5 - n.x - 5) * t;
          const py = n.y + (target.y - n.y) * t;
          return <circle key={`p-${pi}`} cx={px} cy={py} r="2" fill={C.green} opacity="0.7" />;
        });
      })()}

      {/* ─── Network nodes ─── */}
      {layers.map((layer, li) => {
        const isActive = li === activeLayer;
        const isPast = li < activeLayer;
        return layer.nodes.map((n, ni) => (
          <g key={`n-${li}-${ni}`}>
            {isActive && <circle cx={n.x} cy={n.y} r="12" fill={C.greenDim} />}
            <circle cx={n.x} cy={n.y}
              r={isActive ? 4.5 : 3}
              fill={isActive ? C.green : isPast ? C.greenDim : C.node}
              stroke={isActive ? 'rgba(72,187,120,0.5)' : 'none'}
              strokeWidth="1.5" />
          </g>
        ));
      })}

      {/* Layer labels */}
      {layers.map((layer, li) => (
        <text key={`lbl-${li}`} x={layer.x} y="335"
          fill="rgba(255,255,255,0.15)" fontSize="7" fontFamily="monospace" textAnchor="middle">
          {layer.label}
        </text>
      ))}

      {/* ─── Connecting lines: FC → classification output ─── */}
      {layers[layers.length - 1].nodes.map((n, i) => {
        const targetY = 86 + Math.min(i, foodClasses.length - 1) * 50 + 7;
        return (
          <line key={`out-${i}`}
            x1={n.x + 6} y1={n.y}
            x2="530" y2={targetY}
            stroke={i < revealedClasses ? C.green : C.line}
            strokeWidth={i < revealedClasses ? 1 : 0.5}
            strokeDasharray={i < revealedClasses ? 'none' : '3,4'} />
        );
      })}

      {/* ─── Classification output: labels + confidence bars ─── */}
      <text x="610" y="55" fill={C.label} fontSize="9" fontFamily="monospace" textAnchor="middle">
        Classification
      </text>

      {foodClasses.map((fc, i) => {
        const y = 86 + i * 50;
        const revealed = i < revealedClasses;
        const justRevealed = i === revealedClasses - 1 && (classPhase % 4) < 2;

        return (
          <g key={fc.name} opacity={revealed ? 1 : 0.15}>
            {/* Food class label */}
            <text x="540" y={y - 5}
              fill={revealed ? fc.color : C.node}
              fontSize="10" fontFamily="monospace"
              fontWeight={revealed ? 'bold' : 'normal'}>
              {fc.name}
            </text>

            {/* Confidence bar background */}
            <rect x="540" y={y + 1} width="135" height="12" rx="6"
              fill={C.line} />

            {/* Confidence bar fill */}
            {revealed && (
              <rect x="540" y={y + 1}
                width={135 * fc.conf} height="12" rx="6"
                fill={fc.color} opacity="0.5" />
            )}

            {/* Confidence score */}
            {revealed && (
              <text x={540 + 135 * fc.conf + 8} y={y + 10}
                fill={fc.color} fontSize="9" fontFamily="monospace" fontWeight="bold">
                {fc.conf.toFixed(2)}
              </text>
            )}

            {/* "Just identified" highlight pulse */}
            {justRevealed && (
              <rect x="536" y={y - 9} width="148" height="26" rx="5"
                fill="none" stroke={fc.color} strokeWidth="1" opacity="0.35" />
            )}
          </g>
        );
      })}

      {/* ─── Stage badges ─── */}
      <text x="80" y="380" fill="rgba(255,255,255,0.25)" fontSize="11"
        fontFamily="monospace" fontWeight="bold">MobileNetV3</text>
      <text x="400" y="380" fill="rgba(255,255,255,0.1)" fontSize="9"
        fontFamily="monospace" textAnchor="middle" letterSpacing="3">
        CNN CLASSIFICATION
      </text>
    </g>
  );
};

export default CNNLoader;
