import React from 'react';

// --- Preprocessing Loader ---
// OpenCV operations: plate boundary detection, perspective correction, normalization
// Shows a distorted dot grid settling into alignment with a plate boundary circle forming
const PreprocessingLoader = ({ tick }) => {
  const settle = Math.min(1, tick / 40); // 0→1 over time (settling factor)

  // Grid of dots that morph from distorted to aligned
  const gridNodes = [];
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 6; j++) {
      const baseX = 180 + i * 55;
      const baseY = 60 + j * 50;
      // Distortion that settles over time
      const distortion = (1 - settle) * 12;
      const offsetX = Math.sin((i + j) * 1.3 + tick * 0.1) * distortion;
      const offsetY = Math.cos((i * j) * 0.7 + tick * 0.08) * distortion;
      const x = baseX + offsetX;
      const y = baseY + offsetY;
      const isActive = ((tick + i * 3 + j * 5) % 20) < 6;
      gridNodes.push({ x, y, isActive, i, j });
    }
  }

  // Convolution kernel position
  const kernelCol = Math.floor((tick / 3) % 8);
  const kernelRow = Math.floor((tick / 3) / 8) % 6;
  const kernelX = 180 + kernelCol * 55 - 20;
  const kernelY = 60 + kernelRow * 50 - 18;

  // Plate boundary circle (forms as settle increases)
  const plateR = 135 * settle;
  const plateCx = 400;
  const plateCy = 195;

  return (
    <g>
      {/* Grid edges (connecting adjacent dots) */}
      {gridNodes.map((n, idx) => {
        const edges = [];
        // Connect right neighbor
        if (n.j < 5) {
          const rightIdx = idx + 1;
          const right = gridNodes[rightIdx];
          if (right && right.j === n.j + 1) {
            edges.push(
              <line key={`h-${idx}`} x1={n.x} y1={n.y} x2={right.x} y2={right.y}
                stroke={n.isActive ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)'}
                strokeWidth="0.7" />
            );
          }
        }
        // Connect bottom neighbor
        const belowIdx = idx + 6;
        const below = gridNodes[belowIdx];
        if (below) {
          edges.push(
            <line key={`v-${idx}`} x1={n.x} y1={n.y} x2={below.x} y2={below.y}
              stroke={n.isActive ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)'}
              strokeWidth="0.7" />
          );
        }
        return edges;
      })}

      {/* Grid dots */}
      {gridNodes.map((n, idx) => (
        <g key={`n-${idx}`}>
          {n.isActive && <circle cx={n.x} cy={n.y} r="8" fill="rgba(59,130,246,0.1)" />}
          <circle cx={n.x} cy={n.y} r={n.isActive ? 3.5 : 2}
            fill={n.isActive ? '#3B82F6' : 'rgba(255,255,255,0.25)'}
            stroke={n.isActive ? 'rgba(59,130,246,0.4)' : 'none'}
            strokeWidth="1" />
        </g>
      ))}

      {/* Convolution kernel window */}
      <rect x={kernelX} y={kernelY} width="50" height="40" rx="4"
        fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"
        className="transition-all duration-75" />
      <text x={kernelX + 25} y={kernelY - 6} fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="monospace" textAnchor="middle">
        kernel(3×3)
      </text>

      {/* Plate boundary circle */}
      <circle cx={plateCx} cy={plateCy} r={plateR}
        fill="none" stroke="rgba(16,185,129,0.3)" strokeWidth="1.5"
        strokeDasharray="8,4" opacity={settle * 0.8} />

      {/* OpenCV label */}
      <text x="80" y="380" fill="rgba(255,255,255,0.3)" fontSize="11" fontFamily="monospace" fontWeight="bold">
        OpenCV
      </text>
      <text x="400" y="380" fill="rgba(255,255,255,0.12)" fontSize="9" fontFamily="monospace" textAnchor="middle" letterSpacing="3">
        PREPROCESSING
      </text>
    </g>
  );
};

export default PreprocessingLoader;
