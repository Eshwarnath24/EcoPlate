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

// --- Backend API Base URL ---
// Reads from Vite environment variable (.env) with deployed Render fallback
export const API_BASE = (
  import.meta.env.VITE_API_BASE || 
  import.meta.env.VITE_API_URL || 
  'https://ecoplate.onrender.com'
).replace(/\/+$/, '');


// --- Available Model Specifications ---
export const MODELS = {
  yolo: {
    id: 'yolo',
    name: 'YOLOv11s-seg (Model A)',
    badge: '32 ms • 31.2 FPS',
    tag: 'Real-Time Edge',
    color: '#06b6d4',
    border: 'border-cyan-500/50',
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    desc: 'Instance BBoxes + Prototype Masks. Fastest inference, ideal for discrete items (poori, fryums, bread).'
  },
  cnn: {
    id: 'cnn',
    name: 'Baseline CNN U-Net (Model B)',
    badge: '42 ms • 62.4% IoU',
    tag: 'Dense Semantic',
    color: '#10b981',
    border: 'border-emerald-500/50',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    desc: 'Encoder-Decoder U-Net with Soft Dice Loss. Superior continuous boundary tracking on viscous liquid gravies and dals.'
  },
  compare: {
    id: 'compare',
    name: 'Dual-Model Benchmark',
    badge: 'Side-by-Side Dual Eval',
    tag: 'Comparative Mode',
    color: '#f59e0b',
    border: 'border-amber-500/50',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    desc: 'Simultaneously runs both YOLO and CNN on the plate pair. Displays side-by-side masks and delta agreement.'
  }
};

// --- 5 Held-Out Test Set Presets (Never Seen During Training) ---
export const PRESET_TEST_PLATES = [
  {
    plate_id: 'P4828',
    label: 'P4828',
    title: 'Multi-Dish Balanced Meal',
    scenario: 'Dal + Poori + Vegetable Curry',
    description: 'Balanced meal with 3 dishes served. Only a small poori scrap remaining (6.03% waste).',
    before_img: '/sample_test_plates/P4828_before.jpg',
    after_img: '/sample_test_plates/P4828_after.jpg',
    benchmark_waste: 6.03,
    status: 'EXCELLENT: Minimal Food Waste',
    badge: '94.0% Consumed',
    badgeColor: '#10b981',
    items: ['Dal/Sambar', 'Poori', 'Vegetable Curry']
  },
  {
    plate_id: 'P1031',
    label: 'P1031',
    title: 'Bare-Metal Specular Glare',
    scenario: 'Bare Stainless-Steel Glare Filtering',
    description: 'Poori, curry, and fryums eaten. Raw model saw 103k px dal glare; Option A pruned it to true 10.56%.',
    before_img: '/sample_test_plates/P1031_before.jpg',
    after_img: '/sample_test_plates/P1031_after.jpg',
    benchmark_waste: 10.56,
    status: 'MODERATE: Some Leftover Waste',
    badge: '103k px Glare Pruned',
    badgeColor: '#06b6d4',
    items: ['Poori', 'Curry', 'Fryums', 'Chutney']
  },
  {
    plate_id: 'P9768',
    label: 'P9768',
    title: 'High-Starch Clean Plate',
    scenario: '100% Finished Dining Plate',
    description: 'Rice and fryums completely finished. Water rinse film suppressed via >0.2% noise threshold.',
    before_img: '/sample_test_plates/P9768_before.jpg',
    after_img: '/sample_test_plates/P9768_after.jpg',
    benchmark_waste: 0.00,
    status: 'CLEAN PLATE: 100% Finished',
    badge: '0.00% Zero Waste',
    badgeColor: '#10b981',
    items: ['Rice', 'Fryums']
  },
  {
    plate_id: 'P1400',
    label: 'P1400',
    title: 'Heavy Liquid Leftover',
    scenario: 'Massive Liquid Dal/Sambar Leftover Pool',
    description: 'Poori finished but 114k px dal puddle leftover. Immediately triggers High Food Waste Alert.',
    before_img: '/unseen_test_plates/P1400_before.jpg',
    after_img: '/unseen_test_plates/P1400_after.jpg',
    benchmark_waste: 52.47,
    status: 'HIGH FOOD WASTE ALERT',
    badge: '52.5% Waste Alert',
    badgeColor: '#ef4444',
    items: ['Dal/Sambar', 'Poori']
  },
  {
    plate_id: 'P2534',
    label: 'P2534',
    title: 'High Consumption / Morsel',
    scenario: 'Nearly Finished Meal with Tiny Morsel',
    description: 'Over 475k px served; 97.4% eaten. Real rice morsel distinguished from oil smears.',
    before_img: '/unseen_test_plates/P2534_before.jpg',
    after_img: '/unseen_test_plates/P2534_after.jpg',
    benchmark_waste: 2.60,
    status: 'EXCELLENT: Minimal Food Waste',
    badge: '97.4% Consumed',
    badgeColor: '#10b981',
    items: ['Rice', 'Fryums']
  }
];

// --- Mock Images (local assets fallback) ---
import beforeImg from './images/before_meal.png';
import afterImg from './images/after_meal.png';
export const MOCK_BEFORE = beforeImg;
export const MOCK_AFTER = afterImg;

// --- Mock Results Fallback ---
export const MOCK_RESULTS = {
  overall_waste_percent: 6.03,
  overall_consumed_percent: 93.97,
  status: "EXCELLENT: Minimal Food Waste",
  model_name: "YOLOv11s-seg (Model A)",
  latency_ms: 32.0,
  item_breakdown: [
    { Food_Item: 'dal_sambar', Before_Area_px: 119807, After_Area_px: 0, Waste_Percent: 0.0, Consumed_Percent: 100.0, Item_Status: 'Fully Finished' },
    { Food_Item: 'poori', Before_Area_px: 30375, After_Area_px: 10240, Waste_Percent: 33.71, Consumed_Percent: 66.29, Item_Status: 'Substantial Waste' },
    { Food_Item: 'other_food', Before_Area_px: 19691, After_Area_px: 0, Waste_Percent: 0.0, Consumed_Percent: 100.0, Item_Status: 'Fully Finished' }
  ]
};

// --- Pipeline Stages (Option A Processing Stages) ---
export const PIPELINE_STAGES = [
  { id: 'hough', name: 'Stage 1: Hough Basin Containment (0.96r)', details: 'Detects circular stainless-steel tray basin; eliminates tables, clothes, and adjacent diner trays.' },
  { id: 'infer', name: 'Stage 2: Neural Segmentation Inference', details: 'Running model inference at 768px (C3k2/PANet instance masks or U-Net softmax probability maps).' },
  { id: 'clip',  name: 'Stage 3: Bitwise Rim Clipping', details: 'Enforces M_clean = M_pred ∩ Ω_plate (guarantees exactly 0 px out-of-plate bleed).' },
  { id: 'noise', name: 'Stage 4: Dual Threshold & Area Filter', details: 'Discards watery rinse films and starch glazes under 0.2% plate basin area.' },
  { id: 'closed',name: 'Stage 5: Closed-World Semantic Filter', details: 'Verifies C_after ⊆ C_before. Eliminates bare-metal specular glare hallucinations.' },
  { id: 'sync',  name: 'Stage 6: Scorecard Dashboard Synthesis', details: 'Computes item-wise pixel areas, consumption percentages, and mess-hall waste category.' }
];

// --- Pipeline Logs ---
export const MOCK_LOGS = {
  hough: [
    "[HoughCircles] Multi-pass Hough gradient initialized",
    "[Basin] Located dining plate center: (cx: 350, cy: 504), radius: 328px",
    "[Containment] Scaled to 0.96r usable basin: 315px",
    "[ROI] Bitwise Omega_plate mask created: 311,725 usable pixels"
  ],
  infer: [
    "[ForwardPass] Feeding plate captures into neural network",
    "[Tensor] Preprocessing input resolution to 768x768",
    "[Backbone] Extracting multi-scale hierarchical feature maps",
    "[Inference] Generating raw multi-class prediction tensors"
  ],
  clip: [
    "[BitwiseAND] Applying plate rim containment: M_clean = M_pred & Omega_plate",
    "[BleedCheck] Verified 0 pixels bleed outside tray basin rim",
    "[Boundary] Boundary containment test: 100% PASS"
  ],
  noise: [
    "[NoiseGate] Computing minimum edible area threshold (0.2% = 623 px)",
    "[Filter] Thin watery starch smear (<0.2%) suppressed",
    "[Status] Clean tray surface validated"
  ],
  closed: [
    "[ClosedWorld] Extracting served items set: C_before",
    "[Invariant] Checking condition: C_after subset-of C_before",
    "[SpecularCheck] Bare-metal glare verification: PASS (0 phantom Dal)",
    "[Sanitized] Final verified leftover masks locked"
  ],
  sync: [
    "[Attribution] Calculating itemized pixel delta: A_after / A_before",
    "[Metric] Computing overall plate waste & consumption percentage",
    "[Scorecard] Synthesizing high-resolution verification dashboard",
    "[Ready] Audit records synchronized"
  ]
};
