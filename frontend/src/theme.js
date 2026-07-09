// --- Premium Dark Theme Constants ---
export const THEME = {
  bg: '#000000',
  surface: '#0A0A0A',
  surfaceElevated: '#111111',
  text: '#F5F5F7',
  textMuted: '#888888',
  primary: '#0070F3',
  accent: '#7928CA',
  success: '#10B981',
  waste: '#EF4444',
  border: 'rgba(255, 255, 255, 0.1)',
  borderHighlight: 'rgba(255, 255, 255, 0.2)',
};

// --- Mock Images ---
export const MOCK_BEFORE = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800";
export const MOCK_AFTER = "https://images.unsplash.com/photo-1534422298391-e4f8c171dd54?auto=format&fit=crop&q=80&w=800";

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

// --- Pipeline Stages (matching real workflow) ---
export const PIPELINE_STAGES = [
  { id: 'val', name: 'Image Validation', details: 'Checking image quality, presence & plate consistency.' },
  { id: 'pre', name: 'Preprocessing', details: 'Detecting plate boundary via OpenCV, correcting perspective & normalizing.' },
  { id: 'unet', name: 'U-Net Segmentation', details: 'Separating food regions from plate background pixel-by-pixel.' },
  { id: 'cnn', name: 'CNN Classification', details: 'Classifying each food segment via MobileNetV3 / EfficientNet-B0.' },
  { id: 'match', name: 'Siamese Matching', details: 'Matching before–after food regions via embedding similarity.' },
  { id: 'waste', name: 'Waste Estimation', details: 'Calculating remaining area & consumed percentage per item.' },
  { id: 'analytics', name: 'Analytics Generation', details: 'Aggregating item-wise waste statistics into final report.' },
];

// --- Mock Logs ---
export const MOCK_LOGS = {
  val: [
    "[SYS] Loading before_meal.jpg → tensor shape [1, 3, 800, 800]",
    "[SYS] Loading after_meal.jpg → tensor shape [1, 3, 800, 800]",
    "[CV2] Blur detection: Laplacian variance = 142.7 > threshold ✓",
    "[SYS] Plate consistency check: SSIM = 0.93 ✓"
  ],
  pre: [
    "[CV2] HoughCircles → plate boundary detected (r=312px)",
    "[CV2] Applying perspective homography H(3×3)",
    "[CV2] Aligning before/after via ORB feature matching (87 inliers)",
    "[CV2] Resized to 224×224, normalized to [0, 1] range"
  ],
  unet: [
    "[U-Net] Encoder: Conv2d(3→64) → BN → ReLU → MaxPool2d",
    "[U-Net] Bottleneck: 512 feature maps, latent shape [512, 14, 14]",
    "[U-Net] Decoder: UpConv2d + skip-connection concat",
    "[U-Net] Output mask: 5 food classes segmented, mIoU = 0.91"
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
  analytics: [
    "[DB] Persisting session to PostgreSQL...",
    "[Stats] Item-wise consumption rates aggregated",
    "[Stats] Weekly trend data updated (hostel block A)",
    "[SYS] Analytics report generated ✓"
  ]
};
