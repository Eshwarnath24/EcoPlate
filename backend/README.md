# 🍲 EcoPlate AI Backend

The complete self-contained backend repository for **EcoPlate AI**: Dining plate food segmentation, waste quantification, dataset annotation, and model training.

---

## 📁 Directory Structure

```
backend/
├── app.py                      # 🚀 FastAPI REST server with endpoints for live plate analysis & React UI
├── predict_plate.py            # ⚡ Single-command CLI tool to test any Before/After plate image pair
├── ecoplate_waste_estimator.py # 💡 Core Option A plate-constrained waste estimation engine
├── dataset_waste_summary.json  # 📊 Full dataset statistics & dish waste rankings
├── requirements.txt            # 📦 Complete Python dependencies list
├── README.md                   # 📖 Documentation & operational guide
│
├── weights/                    # 🧠 Model Checkpoints
│   ├── best.pt                 # ⭐ Best fine-tuned YOLOv11n-seg checkpoint (63 epochs, 8 classes)
│   ├── last.pt                 # Final training checkpoint
│   ├── yolo11n-seg.pt          # Base pretrained YOLOv11 segmentation weights
│   ├── mobile_sam.pt           # Mobile SAM weights for automated segmentation
│   └── Rasoi_Yolo12S.pt        # Base Rasoi model weights
│
├── training/                   # 🏋️ Training & Fine-Tuning
│   ├── train_yolo11_seg.py     # YOLOv11-seg fine-tuner with Cosine LR & early stopping
│   ├── train_finetune.py       # Rasoi transfer learning script
│   ├── dataset.yaml            # Dataset YAML class map (8 custom categories)
│   └── training_artifacts/     # 📈 Training Loss Curves, Confusion Matrix & PR Curves
│       ├── results.csv         # Epoch-by-epoch loss & metric log
│       ├── results.png         # Training & validation convergence plot
│       ├── confusion_matrix.png # Confusion matrix plot
│       ├── confusion_matrix_normalized.png
│       ├── MaskPR_curve.png    # Precision-Recall curve
│       ├── MaskF1_curve.png    # F1 confidence curve
│       └── args.yaml           # Training hyperparameter configuration
│
├── annotation/                 # 🏷️ Image Annotation Pipeline
│   ├── auto_annotate_gemini.py     # Gemini Multimodal detection & class labeling
│   ├── batch_mask_all_plates.py    # Gemini + SAM automated mask polygon generation
│   ├── cleanup_post_p7025.py       # Dataset pruning & filtering utility
│   ├── create_train_val_test_split.py # 70% Train, 15% Val, 15% Test split generator
│   ├── test_segment_pairs.py       # Agglomerative clustering & cross-plate matching
│   ├── test_sam_pipeline.py        # Mobile SAM pipeline
│   ├── test_gemini.py              # Gemini API connectivity test
│   ├── batch_segment_v2.py         # Batch segmentation variant 2
│   ├── batch_segment_v3.py         # Batch segmentation variant 3
│   └── download_dataset.py         # Dataset downloader utility
│
├── inference/                  # 🔬 Analytics & Evaluation
│   ├── ecoplate_waste_estimator.py     # Option A plate-constrained waste engine
│   ├── evaluate_training_masking.py    # Training dataset mIoU & precision evaluator
│   ├── run_full_test_waste_analysis.py # Cohort benchmark on all 48 test plates
│   ├── visualize_test_masks.py         # Visual mask inspection script
│   └── create_pair_analysis.py         # Pairwise comparison visualizer
│
├── results/                    # 📄 Generated Reports & Analytics
│   ├── waste_report_test_full.csv              # Granular item-by-item waste report (48 plates)
│   ├── plate_summary_test_full.csv             # Overall plate waste and classifications
│   ├── food_item_waste_rankings.csv            # Dish waste rankings across test set
│   └── training_masking_performance_comparison.csv # Baseline vs Option A metrics
│
└── sample_test_plates/         # 🖼️ Sample Plates for Quick Testing
    ├── P1031_before.jpg / P1031_after.jpg
    ├── P4828_before.jpg / P4828_after.jpg
    └── P9768_before.jpg / P9768_after.jpg
```

---

## 🚀 Quick Commands

### 1. Run Instant Prediction on Any Plate Pair (CLI)
```bash
python predict_plate.py --before sample_test_plates/P1031_before.jpg --after sample_test_plates/P1031_after.jpg
```

### 2. Start the FastAPI Web Server (for Frontend Integration)
```bash
python app.py
```
* **Interactive API Docs (Swagger):** `http://localhost:8000/docs`

### 3. Run Benchmark on All 48 Held-Out Test Plates
```bash
python run_full_test_waste_analysis.py
```

### 4. Evaluate Mask Precision & IoU on Training Data
```bash
python evaluate_training_masking.py
```
