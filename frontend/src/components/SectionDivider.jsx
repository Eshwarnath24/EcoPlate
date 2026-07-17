import React from 'react';
import { Leaf } from 'lucide-react';
import { THEME } from '../theme';

const SectionDivider = () => (
  <div className="flex items-center gap-4 max-w-xs mx-auto">
    <div className="flex-1 h-px bg-slate-300/60" />
    <Leaf size={14} style={{ color: THEME.primary }} opacity={0.6} />
    <div className="flex-1 h-px bg-slate-300/60" />
  </div>
);

export default SectionDivider;
