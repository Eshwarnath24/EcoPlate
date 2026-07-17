import React from 'react';
import PreprocessingLoader from './PreprocessingLoader';
import UNetLoader from './UNetLoader';
import CNNLoader from './CNNLoader';
import MatchLoader from './MatchLoader';
import WasteLoader from './WasteLoader';
import CompletionLoader from './CompletionLoader';

// --- Network Visualizer: Routes to the correct stage-specific loader SVG ---
const NetworkVisualizer = ({ stageId, tick }) => {
  const vw = 800;
  const vh = 400;

  const renders = {
    acq: () => <PreprocessingLoader tick={tick} />,
    bench: () => <UNetLoader tick={tick} />,
    edge: () => <CNNLoader tick={tick} />,
    infer: () => <MatchLoader tick={tick} />,
    calc: () => <WasteLoader tick={tick} />,
    dash: () => <CompletionLoader tick={tick} />,
    done: () => <CompletionLoader tick={tick} />,
  };

  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {renders[stageId] ? renders[stageId]() : null}
    </svg>
  );
};

export default NetworkVisualizer;
