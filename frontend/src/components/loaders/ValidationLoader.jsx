import React from 'react';

// --- Image Validation Loader ---
// Scans both images and runs quality/consistency checks with animated checkpoints
const ValidationLoader = ({ tick }) => {
  const phase = tick % 30;
  const scanY = 60 + (tick % 15) * 18; // scanning line position

  const checks = [
    { label: 'IMG_PRESENT', y: 110, done: phase > 6 },
    { label: 'QUALITY_OK', y: 190, done: phase > 14 },
    { label: 'PLATE_MATCH', y: 270, done: phase > 22 },
  ];

  return (
    <g>
      {/* Before image rect */}
      <rect x="60" y="80" width="160" height="120" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
      <text x="140" y="148" fill="rgba(255,255,255,0.35)" fontSize="10" fontFamily="monospace" textAnchor="middle">before_meal.jpg</text>
      
      {/* After image rect */}
      <rect x="60" y="220" width="160" height="120" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
      <text x="140" y="288" fill="rgba(255,255,255,0.35)" fontSize="10" fontFamily="monospace" textAnchor="middle">after_meal.jpg</text>

      {/* Scanning line */}
      <line x1="65" y1={scanY} x2="215" y2={scanY} stroke="#3B82F6" strokeWidth="2" opacity={0.7}>
        <animate attributeName="opacity" values="0.3;1;0.3" dur="0.6s" repeatCount="indefinite" />
      </line>

      {/* Connecting lines from images to validation nodes */}
      {checks.map((c, i) => {
        const imgCenterY = i === 0 ? 140 : i === 1 ? 200 : 280;
        return (
          <g key={i}>
            {/* Edge from image area to check node */}
            <line x1="225" y1={imgCenterY} x2="460" y2={c.y}
              stroke={c.done ? '#10B981' : 'rgba(255,255,255,0.08)'}
              strokeWidth={c.done ? 1.5 : 1}
              strokeDasharray={c.done ? 'none' : '6,4'} />
            
            {/* Data particle flowing along edge */}
            {!c.done && phase > i * 6 && (() => {
              const t = ((tick - i * 4) % 12) / 12;
              const px = 225 + (460 - 225) * t;
              const py = imgCenterY + (c.y - imgCenterY) * t;
              return <circle cx={px} cy={py} r="2.5" fill="#3B82F6" opacity="0.9" />;
            })()}

            {/* Validation node */}
            {c.done && <circle cx="490" cy={c.y} r="18" fill="rgba(16,185,129,0.08)" />}
            <circle cx="490" cy={c.y} r={c.done ? 12 : 8}
              fill={c.done ? '#10B981' : 'rgba(255,255,255,0.05)'}
              stroke={c.done ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.15)'}
              strokeWidth="1.5" />
            
            {/* Checkmark path */}
            {c.done && (
              <path d={`M ${490 - 5} ${c.y + 1} L ${490 - 1} ${c.y + 5} L ${490 + 6} ${c.y - 4}`}
                stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
            )}

            {/* Label */}
            <text x="520" y={c.y + 4} fill={c.done ? 'rgba(16,185,129,0.8)' : 'rgba(255,255,255,0.25)'}
              fontSize="10" fontFamily="monospace">{c.label}</text>
          </g>
        );
      })}

      {/* Stage label */}
      <text x="400" y="370" fill="rgba(255,255,255,0.15)" fontSize="9" fontFamily="monospace" textAnchor="middle" letterSpacing="3">
        IMAGE VALIDATION
      </text>
    </g>
  );
};

export default ValidationLoader;
