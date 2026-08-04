// --- Premium Restaurant Theme Constants (EcoPlate Kitchen Analytics) ---
export const THEME = {
  bg: '#09090b',         // zinc-950
  primary: '#ea580c',    // orange-600 (Appetizing warm)
  success: '#10b981',    // emerald-500
  accent: '#f59e0b',     // amber-500
  waste: '#ef4444',      // red-500
  surface: '#18181b',    // zinc-900
  border: '#27272a',     // zinc-800
  text: '#f4f4f5',       // zinc-50
  textMuted: '#a1a1aa'   // zinc-400
};

// --- Mock Images (local assets) ---
import beforeImg from './images/before_meal.png';
import afterImg from './images/after_meal.png';
export const MOCK_BEFORE = beforeImg;
export const MOCK_AFTER = afterImg;

// --- Mock Results ---
export const MOCK_RESULTS = {
  overall: 42,
  items: [
    { name: 'Rice', waste: 35, volStart: 120, volEnd: 42, conf: 0.94 },
    { name: 'Chapati', waste: 70, volStart: 80, volEnd: 56, conf: 0.91 },
    { name: 'Curry', waste: 20, volStart: 100, volEnd: 20, conf: 0.87 },
    { name: 'Dal', waste: 54, volStart: 150, volEnd: 81, conf: 0.96 },
    { name: 'Vegetables', waste: 18, volStart: 90, volEnd: 16, conf: 0.89 }
  ]
};

// --- Pipeline Stages (6 processing stages, aligned to restaurant flow) ---
export const PIPELINE_STAGES = [
  { id: 'acq',   name: 'POS Data & Plate Capture', details: 'Expeditor captures plate return tied to POS ticket.' },
  { id: 'bench', name: 'Menu Item Mapping', details: 'Matching plate contents against active menu catalog.' },
  { id: 'edge',  name: 'Ingredient Segmentation', details: 'Isolating proteins, carbs, and garnishes.' },
  { id: 'infer', name: 'Volumetric Depth Scan', details: 'Real-time calculation of remaining portion sizes.' },
  { id: 'calc',  name: 'Cost Discrepancy Math', details: 'Translating leftover volume into exact financial waste.' },
  { id: 'dash',  name: 'Executive Dashboard Sync', details: 'Pushing waste metrics to back-office inventory system.' }
];

// --- Mock Logs ---
export const MOCK_LOGS = {
  acq: [
    "[Scanner] Capturing Ticket #402 (Service out)",
    "[Scanner] Capturing Ticket #402 (Plate return)",
    "[Vision] Annotating ingredients & sauces",
    "[DB] Saved to kitchen analytics server"
  ],
  bench: [
    "[MenuSync] Fetching today's POS menu catalog",
    "[Match] Evaluating against signature dishes",
    "[Result] Matched: Thali Special (ID: TH-04)",
    "[Metrics] Identification Confidence: 94.2%"
  ],
  edge: [
    "[AI] Running semantic segmentation on plate area",
    "[Isolate] Separating Rice, Curry, Dal, Veg",
    "[Optimize] Enhancing edges of sauce spills",
    "[Vision] Mask generation complete"
  ],
  infer: [
    "[Depth] Loading 3D volumetric model",
    "[Scan] Processing Service-Out frame",
    "[Scan] Processing Plate-Return frame",
    "[Compute] Volumetric delta calculated"
  ],
  calc: [
    "[Cost] Rice waste: 42g (Cost: $0.15)",
    "[Cost] Curry waste: 20g (Cost: $0.85)",
    "[Math] Computing aggregate plate loss",
    "[SYS] Total financial waste calculated: $1.00"
  ],
  dash: [
    "[API] Connecting to inventory management API",
    "[Data] Pushing ingredient deduction adjustments",
    "[Graph] Updating Chef's live overview",
    "[Success] Kitchen metrics synchronized"
  ]
};
