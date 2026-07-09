// --- Premium Dark Theme Constants (Vercel/OpenAI vibe) ---
export const THEME = {
  bg: '#000000',
  surface: '#0A0A0A',
  surfaceElevated: '#111111',
  text: '#F5F5F7',
  textMuted: '#888888',
  primary: '#0070F3', // Vercel Blue
  accent: '#7928CA', // Deep Purple
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
  overall: 27,
  items: [
    { name: 'Rice (Basmati)', waste: 35, volStart: 120, volEnd: 42, conf: 0.98 },
    { name: 'Chapati (Wheat)', waste: 12, volStart: 80, volEnd: 10, conf: 0.94 },
    { name: 'Lentil Dal', waste: 54, volStart: 150, volEnd: 81, conf: 0.99 },
    { name: 'Mixed Veg', waste: 18, volStart: 100, volEnd: 18, conf: 0.88 }
  ]
};

// --- Pipeline Stages ---
export const PIPELINE_STAGES = [
  { id: 'acq', name: 'Tensor Acquisition', details: 'Normalizing resolution & color space. Standardizing batches.' },
  { id: 'pre', name: 'Vision Preprocessing', details: 'Applying Gaussian kernels & perspective homography.' },
  { id: 'unet', name: 'U-Net Inference', details: 'Extracting pixel-wise semantic segmentation masks.' },
  { id: 'cnn', name: 'ResNet Classification', details: 'Passing latent vectors through dense connected layers.' },
  { id: 'match', name: 'Siamese Matching', details: 'Computing latent cosine similarity across T0 and T1.' },
  { id: 'waste', name: 'Volumetric Diff', details: 'Calculating pixel-area delta ratios mapped to density.' },
];

// --- Mock Logs ---
export const MOCK_LOGS = {
  acq: ["[SYS] Mounting image tensors into VRAM...", "[SYS] Reshaping batch to [1, 3, 512, 512]", "[CUDA:0] Allocated 12.4MB"],
  pre: ["[CV2] Applying cv2.GaussianBlur(ksize=5)", "[CV2] Normalizing pixel intensity...", "[SYS] Tensor ready for network inference."],
  unet: ["[U-Net] Forward pass initiated.", "[U-Net] Encoder block 4 complete. Latent shape: [512, 32, 32]", "[U-Net] Decoder skip connections activated.", "[U-Net] Mask generated. Confidence > 0.94"],
  cnn: ["[ResNet] Extracted 2048-dim feature vector.", "[FC] Layer 1 activation...", "[FC] Softmax output generated.", "[SYS] Top-1 Class: RICE (0.98)"],
  match: ["[Siamese] Loading T0 and T1 embeddings.", "[Math] Calculating Cosine Similarity...", "[Math] Similarity score: 0.21 (High Variance)", "[SYS] Mapping bounding boxes."],
  waste: ["[Diff] T0 area: 452,100 px", "[Diff] T1 area: 184,000 px", "[Calc] Delta computation complete.", "[SYS] Saving results to DB."]
};
