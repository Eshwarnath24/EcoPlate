import React from 'react';

// --- Acquisition Stage Loader: Scanning laser over an image rect ---
const AcquisitionLoader = ({ tick }) => (
  <g>
    {/* Scanning Laser over a rect */}
    <rect x="200" y="50" width="400" height="300" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
    <line x1="200" y1={50 + (tick % 30) * 10} x2="600" y2={50 + (tick % 30) * 10} stroke="#3B82F6" strokeWidth="3" className="shadow-[0_0_10px_#3B82F6]" />
    {/* Bounding box popups */}
    {tick % 10 > 5 && <rect x="250" y="100" width="100" height="80" fill="none" stroke="#10B981" strokeWidth="2" strokeDasharray="4" />}
    {tick % 15 > 7 && <rect x="400" y="150" width="120" height="150" fill="none" stroke="#7928CA" strokeWidth="2" strokeDasharray="4" />}
  </g>
);

export default AcquisitionLoader;
