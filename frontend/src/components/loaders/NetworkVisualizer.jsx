import React from 'react';
import AcquisitionLoader from './AcquisitionLoader';
import PreprocessingLoader from './PreprocessingLoader';
import UNetLoader from './UNetLoader';
import CNNLoader from './CNNLoader';
import MatchLoader from './MatchLoader';
import WasteLoader from './WasteLoader';

// --- Network Visualizer: Renders the appropriate stage-specific loader SVG ---
const NetworkVisualizer = ({ stageId, tick }) => {
  const vw = 800;
  const vh = 400;

  const renders = {
    acq: () => <AcquisitionLoader tick={tick} />,
    pre: () => <PreprocessingLoader tick={tick} />,
    unet: () => <UNetLoader tick={tick} />,
    cnn: () => <CNNLoader tick={tick} />,
    match: () => <MatchLoader tick={tick} />,
    waste: () => <WasteLoader tick={tick} />,
    done: () => <g><text x="350" y="200" fill="#10B981" fontSize="24" className="font-mono animate-pulse">OUTPUT_GENERATED</text></g>,
  };

  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} className="w-full h-full max-h-[400px]">
      {renders[stageId] ? renders[stageId]() : null}
    </svg>
  );
};

export default NetworkVisualizer;
