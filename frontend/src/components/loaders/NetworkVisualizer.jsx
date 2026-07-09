import React from 'react';
import ValidationLoader from './ValidationLoader';
import PreprocessingLoader from './PreprocessingLoader';
import UNetLoader from './UNetLoader';
import CNNLoader from './CNNLoader';
import MatchLoader from './MatchLoader';
import WasteLoader from './WasteLoader';
import AnalyticsLoader from './AnalyticsLoader';

// --- Network Visualizer: Routes to the correct stage-specific loader SVG ---
const NetworkVisualizer = ({ stageId, tick }) => {
  const vw = 800;
  const vh = 400;

  const renders = {
    val: () => <ValidationLoader tick={tick} />,
    pre: () => <PreprocessingLoader tick={tick} />,
    unet: () => <UNetLoader tick={tick} />,
    cnn: () => <CNNLoader tick={tick} />,
    match: () => <MatchLoader tick={tick} />,
    waste: () => <WasteLoader tick={tick} />,
    analytics: () => <AnalyticsLoader tick={tick} />,
    done: () => (
      <g>
        <circle cx="400" cy="180" r="40" fill="rgba(16,185,129,0.1)" stroke="#10B981" strokeWidth="2" />
        <path d="M 382 180 L 395 193 L 418 167" stroke="#10B981" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <text x="400" y="240" fill="#10B981" fontSize="14" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
          INFERENCE COMPLETE
        </text>
        <text x="400" y="260" fill="rgba(255,255,255,0.3)" fontSize="10" fontFamily="monospace" textAnchor="middle">
          Generating report...
        </text>
      </g>
    ),
  };

  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {renders[stageId] ? renders[stageId]() : null}
    </svg>
  );
};

export default NetworkVisualizer;
