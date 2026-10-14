"""
EcoPlate AI: Level 1 YOLOv11s-seg Fine-Tuning Pipeline
======================================================
Level 1 Architecture & Training Enhancements:
1. Backbone Upgrade: yolo11s-seg.pt (Small, 9.4M parameters vs 2.8M Nano) -> 3.3x capacity.
2. High-Resolution:  imgsz=768 (higher spatial fidelity for curd & dal boundaries).
3. Augmentations:    copy_paste=0.3 (synthetic food overlapping), cos_lr=True, close_mosaic=10.
4. GPU Optimization: Configured for NVIDIA RTX 3050 Laptop GPU (4GB VRAM) via batch=4, amp=True, workers=2.
5. Auto Evaluation:  Evaluates best checkpoint on held-out test split at 768px.
"""

import os
import sys
import argparse
import torch
from ultralytics import YOLO

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
WEIGHTS_DIR = os.path.join(BACKEND_DIR, "weights")

DEFAULT_BASE_MODEL = os.path.join(WEIGHTS_DIR, "yolo11s-seg.pt")
if not os.path.exists(DEFAULT_BASE_MODEL):
    DEFAULT_BASE_MODEL = "yolo11s-seg.pt"

PROJECT_DIR = os.path.join(CURRENT_DIR, "training_runs")
EXPERIMENT_NAME = "yolo11s_food_seg_level1"


def parse_args():
    parser = argparse.ArgumentParser(description="Train YOLOv11s-seg with Level 1 Enhancements.")
    parser.add_argument("--data", type=str, default=None,
                        help="Path to dataset.yaml (default: checks local candidates)")
    parser.add_argument("--base-model", type=str, default=DEFAULT_BASE_MODEL,
                        help="Path or name of base model (default: weights/yolo11s-seg.pt)")
    parser.add_argument("--epochs", type=int, default=60,
                        help="Number of training epochs (default: 60)")
    parser.add_argument("--batch", type=int, default=4,
                        help="Batch size (default: 4 for 4GB RTX 3050 VRAM)")
    parser.add_argument("--imgsz", type=int, default=768,
                        help="Image resolution (default: 768 for Level 1)")
    parser.add_argument("--patience", type=int, default=15,
                        help="Early stopping patience (default: 15)")
    parser.add_argument("--device", type=str, default=None,
                        help="Device to train on ('cuda:0' or 'cpu')")
    parser.add_argument("--dry-run", action="store_true",
                        help="Run 1 epoch dry-run to verify CUDA VRAM and memory allocation")
    return parser.parse_args()


def find_dataset_yaml(specified_path=None):
    if specified_path and os.path.exists(specified_path):
        return os.path.abspath(specified_path)

    candidates = [
        os.path.join(CURRENT_DIR, "dataset.yaml"),
        os.path.join(BACKEND_DIR, "dataset.yaml"),
        os.path.abspath("full_dataset_masks/yolo_dataset/dataset.yaml"),
        r"f:\4 year\nndl\Team-4\full_dataset_masks\yolo_dataset\dataset.yaml"
    ]

    for p in candidates:
        if os.path.exists(p):
            return os.path.abspath(p)
    return None


def run_training(args):
    dataset_yaml = find_dataset_yaml(args.data)
    epochs = 1 if args.dry_run else args.epochs

    device = args.device
    if device is None:
        device = "cuda:0" if torch.cuda.is_available() else "cpu"

    print("=" * 70)
    print(" EcoPlate AI: Level 1 YOLOv11s-seg High-Resolution Fine-Tuning")
    print("=" * 70)
    print(f"Base Weights:       {args.base_model}")
    print(f"Dataset YAML:       {dataset_yaml if dataset_yaml else '[NOT FOUND]'}")
    print(f"Device:             {device}")
    if torch.cuda.is_available():
        gpu_name = torch.cuda.get_device_name(0)
        vram_gb = torch.cuda.get_device_properties(0).total_memory / (1024**3)
        print(f"GPU Hardware:       {gpu_name} ({vram_gb:.2f} GB VRAM)")
    print(f"Epochs:             {epochs}")
    print(f"Batch Size:         {args.batch}")
    print(f"Image Size:         {args.imgsz} px (Level 1 Upgrade)")
    print(f"Patience:           {args.patience}")
    print(f"Cosine LR (cos_lr): True")
    print(f"Copy-Paste Aug:     0.30")
    print(f"Close Mosaic:       10 epochs")
    print("=" * 70 + "\n")

    if not dataset_yaml:
        print("[ERROR] Dataset YAML could not be located.")
        print("Please specify the path with --data path/to/dataset.yaml or mount your dataset folder.")
        print("Candidate searched paths:")
        print("  - backend/training/dataset.yaml")
        print("  - full_dataset_masks/yolo_dataset/dataset.yaml")
        return False

    # Load Base Model (Small architecture)
    print(f"[1/3] Initializing YOLOv11s-seg from {args.base_model} ...")
    model = YOLO(args.base_model)

    # Launch Training
    print("\n[2/3] Launching Level 1 Fine-Tuning on GPU ...", flush=True)
    results = model.train(
        data=dataset_yaml,
        epochs=epochs,
        batch=args.batch,
        imgsz=args.imgsz,
        device=device,
        project=PROJECT_DIR,
        name=EXPERIMENT_NAME,
        patience=args.patience,
        cos_lr=True,            # Cosine learning rate scheduler
        copy_paste=0.3,         # Level 1 synthetic food overlap augmentation
        mixup=0.15,             # Blend food textures for boundary robustness
        close_mosaic=10,        # Crisp mask boundaries in final epochs
        save=True,
        plots=True,
        verbose=True,
        workers=2,
        amp=True                # FP16 mixed precision for 4GB VRAM
    )

    # Evaluation on Test Split
    print("\n" + "=" * 70)
    print("[3/3] Evaluating Best Checkpoint on Held-Out Test Set at 768px ...")
    print("=" * 70 + "\n")

    best_weights = os.path.join(results.save_dir, "weights", "best.pt")
    if os.path.exists(best_weights):
        best_model = YOLO(best_weights)
        test_metrics = best_model.val(
            data=dataset_yaml,
            split='test',
            imgsz=args.imgsz,
            device=device,
            plots=True
        )
        print("\nTest Evaluation Completed!")
        print(f"  Box mAP50:     {test_metrics.box.map50:.4f}")
        print(f"  Box mAP50-95:  {test_metrics.box.map:.4f}")
        print(f"  Mask mAP50:    {test_metrics.seg.map50:.4f}")
        print(f"  Mask mAP50-95: {test_metrics.seg.map:.4f}")

        # Also copy best weights to backend/weights/yolo11s_level1_best.pt
        dest_weights = os.path.join(WEIGHTS_DIR, "yolo11s_level1_best.pt")
        import shutil
        shutil.copy2(best_weights, dest_weights)
        print(f"Copied best model weights to: {dest_weights}")
    else:
        print(f"[WARN] Best weights not found at: {best_weights}")

    print("\n" + "=" * 70)
    print(f"Level 1 Training Complete! Artifacts saved at:\n  {results.save_dir}")
    print("=" * 70)
    return True


if __name__ == "__main__":
    args = parse_args()
    run_training(args)
