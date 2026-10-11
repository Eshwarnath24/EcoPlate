"""
EcoPlate AI: YOLOv11 Segmentation Fine-Tuning Script
=====================================================
Fine-tunes yolo11n-seg on the Indian Mess Dining Plate Dataset:
- Train Split: 436 images (70%)
- Val Split:   92 images (15%)
- Test Split:  96 images (15%)

Automatically runs:
1. Model training with early stopping and loss plot generation.
2. Full evaluation on the held-out TEST set (mAP50, mAP50-95, precision, recall).
3. Saves the best checkpoint at: runs/segment/ecoplate_yolo11_seg/weights/best.pt
"""

import os
import sys
import torch
from ultralytics import YOLO

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

DATASET_YAML = os.path.abspath("full_dataset_masks/yolo_dataset/dataset.yaml")
BASE_MODEL   = "yolo11n-seg.pt"
PROJECT_DIR  = "training_runs"
EXPERIMENT   = "yolo11n_food_seg_v2"

def train(epochs=70, batch=8, imgsz=640, patience=20, device=None):
    if not os.path.exists(DATASET_YAML):
        print(f"[ERROR] Dataset YAML not found at: {DATASET_YAML}")
        return

    if not os.path.exists(BASE_MODEL):
        print(f"[ERROR] Base weights '{BASE_MODEL}' not found.")
        return

    # Auto-detect device
    if device is None:
        device = "cuda:0" if torch.cuda.is_available() else "cpu"

    print("=" * 65)
    print("EcoPlate AI: Starting Extended YOLOv11-seg Fine-Tuning (v2)")
    print("=" * 65)
    print(f"Base Weights:  {BASE_MODEL}")
    print(f"Dataset YAML:  {DATASET_YAML}")
    print(f"Device:        {device}")
    print(f"Epochs:        {epochs}")
    print(f"Batch Size:    {batch}")
    print(f"Image Size:    {imgsz}")
    print(f"Patience:      {patience}")
    print(f"Cosine LR:     True")
    print("=" * 65 + "\n")

    # Load pretrained YOLOv11 segmentation model
    model = YOLO(BASE_MODEL)

    # Train model
    print("[1/2] Training on Train set with Validation monitoring...", flush=True)
    results = model.train(
        data=DATASET_YAML,
        epochs=epochs,
        batch=batch,
        imgsz=imgsz,
        device=device,
        project=PROJECT_DIR,
        name=EXPERIMENT,
        patience=patience,   # Early stopping patience
        cos_lr=True,         # Cosine learning rate scheduler for smoother convergence
        close_mosaic=10,     # Disable mosaic augmentations for last 10 epochs
        save=True,
        plots=True,          # Auto-generates loss curves, confusion matrix, PR curves
        verbose=True,
        workers=2
    )

    # Evaluate on held-out TEST split
    print("\n" + "=" * 65)
    print("[2/2] Evaluating Best Model on Held-Out TEST Split (test set)")
    print("=" * 65 + "\n")
    best_weights = os.path.join(results.save_dir, "weights", "best.pt")
    
    if os.path.exists(best_weights):
        best_model = YOLO(best_weights)
        test_metrics = best_model.val(
            data=DATASET_YAML,
            split='test',
            imgsz=imgsz,
            device=device,
            plots=True
        )
        print("\nTest Evaluation Completed!")
        print(f"  Box mAP50:     {test_metrics.box.map50:.4f}")
        print(f"  Box mAP50-95:  {test_metrics.box.map:.4f}")
        print(f"  Mask mAP50:    {test_metrics.seg.map50:.4f}")
        print(f"  Mask mAP50-95: {test_metrics.seg.map:.4f}")
    else:
        print(f"[WARN] Best weights not found at: {best_weights}")

    print("\n" + "=" * 65)
    print(f"Training Complete! Model and metrics saved at:")
    print(f"  {results.save_dir}")
    print("=" * 65)

if __name__ == "__main__":
    train(epochs=70, batch=8, imgsz=640, patience=20)
