import React from 'react';

// --- CNN/ResNet Stage Loader: Stacked isometric feature map planes ---
const CNNLoader = ({ tick }) => (
  <g className="iso-plane-float" style={{ transformOrigin: 'center' }}>
    {[0, 1, 2, 3].map(i => {
      const isActive = (tick % 4) === i;
      return (
        <g key={`cnn-${i}`} style={{ transform: `translateZ(${i * -50}px) translateY(${i * -20}px)` }}>
          <polygon 
            points="200,100 400,200 600,100 400,0" 
            fill={isActive ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.05)'}
            stroke={isActive ? '#3B82F6' : 'rgba(255,255,255,0.2)'}
            strokeWidth="2"
            className="transition-all duration-300"
          />
          {/* Fake class activations firing up */}
          {isActive && i === 3 && (
            <text x="500" y="50" fill="#10B981" className="font-mono text-xl" style={{ transform: 'rotateZ(-45deg) rotateX(-60deg)' }}>
              RICE: {(0.8 + Math.random() * 0.19).toFixed(3)}
            </text>
          )}
        </g>
      );
    })}
  </g>
);

export default CNNLoader;
