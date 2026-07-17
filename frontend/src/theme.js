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

// --- Pipeline Stages (6 processing stages, aligned to real flow) ---
export const PIPELINE_STAGES = [
  { id: 'acq',   name: 'Data Acquisition & Annotation', details: 'Staff capture before and after photos to track food.' },
  { id: 'bench', name: 'Model Benchmarking', details: 'We test multiple AI models to find the best.' },
  { id: 'edge',  name: 'Edge Optimization', details: 'The winning AI is shrunk to fit on smartphones.' },
  { id: 'infer', name: 'On-Device Inference', details: 'The app scans plates instantly without needing the internet.' },
  { id: 'calc',  name: 'Area Math & Waste Calculation', details: 'The system calculates exact waste percentages for each ingredient.' },
  { id: 'dash',  name: 'Dashboard Integration', details: 'Waste data syncs directly to a live manager dashboard.' }
];

// --- Mock Logs ---
export const MOCK_LOGS = {
  acq: [
    "[Camera] Capturing T0 (Before Meal) at 4K resolution",
    "[Camera] Capturing T1 (After Meal) at 4K resolution",
    "[Storage] Annotating bounding boxes & pixel masks",
    "[DB] Saved to tracking server for model training"
  ],
  bench: [
    "[Test] Evaluating U-Net vs DeepLabV3 vs YOLOv8-Nano",
    "[Test] MobileNetV3 vs ResNet inference time",
    "[Result] MobileNetV3 + U-Net architecture selected",
    "[Metrics] Accuracy: 94.2%, Latency: 42ms"
  ],
  edge: [
    "[ONNX] Exporting PyTorch models to ONNX format",
    "[TFLite] Quantizing weights to INT8 representation",
    "[Optimize] Pruning redundant layers",
    "[Build] Final model size reduced by 78%"
  ],
  infer: [
    "[NPU] Loading quantized model into neural engine",
    "[Scan] Processing T0 frame at 30 FPS",
    "[Scan] Processing T1 frame at 30 FPS",
    "[Edge] Real-time on-device inference complete"
  ],
  calc: [
    "[Math] T0 area: Rice=450px² Curry=510px²",
    "[Math] T1 area: Rice=150px² Curry=400px²",
    "[Math] Computing pixel-wise deltas",
    "[SYS] Waste percentages successfully calculated"
  ],
  dash: [
    "[Sync] Connecting to dashboard API securely",
    "[Data] Pushing waste telemetry data",
    "[Graph] Updating real-time manager view",
    "[Success] Dashboard synchronized"
  ]
};
