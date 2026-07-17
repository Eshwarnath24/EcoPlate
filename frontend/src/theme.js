// --- Warm Earthy Theme Constants (EcoPlate organic vibe) ---
export const THEME = {
  bg: '#FFFFFF',
  primary: '#1F4D3A',
  success: '#4CAF50',
  accent: '#D9A441',
  waste: '#EF4444',
  surface: '#F8FAFC',
  border: '#E2E8F0',
  text: '#0F172A',
  textMuted: '#64748B'
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

// --- Pipeline Stages (5 processing stages, aligned to real flow) ---
export const PIPELINE_STAGES = [
  { id: 'pre',   name: 'Preprocessing',        details: 'Detecting plate boundary, normalizing geometry & correcting lighting via CLAHE.' },
  { id: 'unet',  name: 'U-Net Segmentation',   details: 'Separating food regions from plate background pixel-by-pixel.' },
  { id: 'cnn',   name: 'CNN Classification',    details: 'Classifying each food segment: Rice, Chapati, Curry, Dal, Veg.' },
  { id: 'match', name: 'Before-After Matching', details: 'Matching T0 ↔ T1 food regions via Siamese embedding similarity.' },
  { id: 'waste', name: 'Waste Estimation',      details: 'Computing per-item consumption: ΔArea / BeforeArea × 100.' },
];

// --- Mock Logs ---
export const MOCK_LOGS = {
  pre: [
    "[CV2] HoughCircles → plate boundary detected (r=312px)",
    "[CV2] Applying perspective homography H(3×3)",
    "[CV2] CLAHE adaptive histogram equalization applied",
    "[CV2] Resized to 224×224, normalized to [0, 1] range"
  ],
  unet: [
    "[U-Net] Encoder: Conv2d(3→64) → BN → ReLU → MaxPool2d",
    "[U-Net] Bottleneck: 512 feature maps, latent shape [512, 14, 14]",
    "[U-Net] Decoder: UpConv2d + skip-connection concat",
    "[U-Net] Output mask: food vs background segmented, mIoU = 0.91"
  ],
  cnn: [
    "[MobileNetV3] Loading ImageNet pretrained weights...",
    "[MobileNetV3] Feature extraction → 1280-dim embedding",
    "[FC] Softmax over 5 food classes",
    "[SYS] Rice(0.94) Chapati(0.91) Curry(0.87) Dal(0.96) Veg(0.89)"
  ],
  match: [
    "[Siamese] Encoding T0 food regions → latent vectors",
    "[Siamese] Encoding T1 food regions → latent vectors",
    "[Math] Cosine similarity matrix computed (5×5)",
    "[SYS] Matched 5/5 regions — avg similarity: 0.847"
  ],
  waste: [
    "[Calc] T0 areas: Rice=452px² Chapati=380px² Curry=510px²",
    "[Calc] T1 areas: Rice=158px² Chapati=114px² Curry=408px²",
    "[Calc] Per-item delta ratios computed",
    "[SYS] Overall plate waste estimated: 42%"
  ],
};
