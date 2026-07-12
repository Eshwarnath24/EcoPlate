import React from 'react';

// --- Completion Loader ---
// Animated checkmark reveal with expanding ripple rings and spark particles
// Replaces the old static "done" state and the removed AnalyticsLoader
const CompletionLoader = ({ tick }) => {
  const C = {
    green: '#48BB78',
    greenDim: 'rgba(72, 187, 120, 0.15)',
    gold: '#D9A441',
    label: 'rgba(255, 255, 255, 0.3)',
  };

  const cx = 400, cy = 170;
  const r = 50;
  const circumference = 2 * Math.PI * r;

  // Animation phases: circle draws → checkmark draws → text fades in
  const circleProgress = Math.min(1, tick / 15);
  const checkProgress = tick > 15 ? Math.min(1, (tick - 15) / 8) : 0;
  const textOpacity = tick > 25 ? Math.min(1, (tick - 25) / 10) : 0;

  // Radial spark particles burst outward after checkmark
  const sparkPhase = tick > 20;
  const sparkCount = 8;

  // Ripple rings expand outward
  const ripplePhase = tick > 18;

  return (
    <g>
      {/* ─── Soft radial glow ─── */}
      <circle cx={cx} cy={cy} r="85"
        fill={C.greenDim} opacity={circleProgress * 0.35} />

      {/* ─── Background circle track ─── */}
      <circle cx={cx} cy={cy} r={r}
        fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />

      {/* ─── Animated circle draw ─── */}
      <circle cx={cx} cy={cy} r={r}
        fill="none" stroke={C.green} strokeWidth="3"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - circleProgress)}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`} />

      {/* ─── Checkmark path ─── */}
      {checkProgress > 0 && (
        <path
          d={`M ${cx - 17} ${cy + 2} L ${cx - 3} ${cy + 16} L ${cx + 21} ${cy - 14}`}
          fill="none" stroke={C.green} strokeWidth="4"
          strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray="60"
          strokeDashoffset={60 * (1 - checkProgress)} />
      )}

      {/* ─── Expanding ripple rings ─── */}
      {ripplePhase && [0, 1, 2].map(i => {
        const rippleTick = (tick - 18 + i * 5) % 15;
        const rippleR = r + rippleTick * 4;
        const rippleOpacity = Math.max(0, 1 - rippleTick / 15);
        return (
          <circle key={`ripple-${i}`} cx={cx} cy={cy} r={rippleR}
            fill="none" stroke={C.green} strokeWidth="1"
            opacity={rippleOpacity * 0.25} />
        );
      })}

      {/* ─── Spark particles radiating outward ─── */}
      {sparkPhase && Array.from({ length: sparkCount }, (_, i) => {
        const angle = (i / sparkCount) * Math.PI * 2;
        const dist = r + 18 + ((tick - 20) % 10) * 3;
        const x = cx + Math.cos(angle) * dist;
        const y = cy + Math.sin(angle) * dist;
        const opacity = Math.max(0, 1 - ((tick - 20) % 10) / 10);
        return (
          <circle key={i} cx={x} cy={y} r="2"
            fill={i % 2 === 0 ? C.green : C.gold}
            opacity={opacity * 0.6} />
        );
      })}

      {/* ─── Completion text ─── */}
      <text x={cx} y={cy + 82}
        fill="rgba(255,255,255,0.75)" fontSize="14"
        fontFamily="monospace" textAnchor="middle" fontWeight="bold"
        opacity={textOpacity}>
        ANALYSIS COMPLETE
      </text>
      <text x={cx} y={cy + 102}
        fill={C.label} fontSize="10"
        fontFamily="monospace" textAnchor="middle"
        opacity={textOpacity}>
        Generating report...
      </text>
    </g>
  );
};

export default CompletionLoader;
