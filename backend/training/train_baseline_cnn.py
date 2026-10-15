"""
EcoPlate AI: Baseline CNN (U-Net) Training and Benchmark Evaluation Script
==========================================================================
End-to-end training pipeline for the Baseline CNN semantic segmentation model:
- U-Net architecture with 4-level feature hierarchy and skip connections.
- Joint Multi-Class Cross-Entropy + Soft Dice Loss.
- Cosine Annealing learning rate schedule with AdamW optimizer.
- Validation loop computing Mean IoU, Mean Dice/F1, and Pixel Precision.
- Auto-detects NVIDIA RTX GPU or CPU fallback.
- Saves best checkpoint to: backend/weights/baseline_cnn_unet_best.pth
"""

import os
import sys
import argparse
import time
import csv
from typing import Optional, Tuple, List, Dict
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, random_split
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
DEFAULT_SAVE_DIR = os.path.join(BACKEND_DIR, "weights")
DEFAULT_RESULTS_DIR = os.path.join(BACKEND_DIR, "results")

# Ensure local imports work cleanly
sys.path.append(CURRENT_DIR)
sys.path.append(BACKEND_DIR)
from baseline_cnn_unet import BaselineUNet, CombinedCELossAndDice, compute_segmentation_metrics
from ecoplate_cnn_dataset import EcoPlateSegmentationDataset, get_default_plate_images, FOOD_CLASSES


def train_baseline_cnn(
    epochs: int = 15,
    batch_size: int = 4,
    lr: float = 2e-4,
    img_size: int = 512,
    data_dir: Optional[str] = None,
    save_dir: str = DEFAULT_SAVE_DIR,
    results_dir: str = DEFAULT_RESULTS_DIR,
    device: Optional[str] = None
):
    if device is None:
        device = "cuda:0" if torch.cuda.is_available() else "cpu"
    device = torch.device(device)

    os.makedirs(save_dir, exist_ok=True)
    os.makedirs(results_dir, exist_ok=True)

    print("=" * 70, flush=True)
    print("EcoPlate AI: Baseline CNN (U-Net) Segmentation Training Engine", flush=True)
    print("=" * 70, flush=True)
    print(f"Device:           {device}", flush=True)
    if device.type == "cuda":
        print(f"GPU Name:         {torch.cuda.get_device_name(0)}", flush=True)
        vram_gb = torch.cuda.get_device_properties(0).total_memory / (1024**3)
        print(f"GPU VRAM:         {vram_gb:.2f} GB", flush=True)
    print(f"Target Epochs:    {epochs}", flush=True)
    print(f"Batch Size:       {batch_size}", flush=True)
    print(f"Base Learning Rate: {lr}", flush=True)
    print(f"Input Resolution: {img_size}x{img_size}", flush=True)
    print(f"Mixed Precision:  {'Enabled (AMP FP16)' if device.type == 'cuda' else 'Disabled'}", flush=True)
    print(f"Classes (9):      {', '.join(FOOD_CLASSES)}", flush=True)
    print("=" * 70 + "\n", flush=True)

    # 1. Discover or load dataset images
    if data_dir and os.path.exists(data_dir):
        raw_files = []
        for root, _, files in os.walk(data_dir):
            for f in files:
                if f.lower().endswith((".jpg", ".jpeg", ".png")):
                    raw_files.append(os.path.join(root, f))
    else:
        raw_files = get_default_plate_images(base_dir=BACKEND_DIR)

    # Filter to images with valid existing ground truth label files
    image_files = []
    dummy_ds = EcoPlateSegmentationDataset([], img_size=img_size)
    for p in raw_files:
        lbl = dummy_ds._infer_label_path(p)
        if os.path.exists(lbl):
            image_files.append(p)

    if not image_files:
        raise FileNotFoundError("No plate images with valid segmentation labels discovered.")

    print(f"[Dataset] Found {len(image_files)} verified labelled plate images for training & validation.", flush=True)

    # Deterministic split: 85% Train, 15% Val
    val_size = max(int(0.15 * len(image_files)), 2) if len(image_files) > 4 else 1
    train_size = len(image_files) - val_size

    generator = torch.Generator().manual_seed(42)
    train_indices, val_indices = random_split(range(len(image_files)), [train_size, val_size], generator=generator)

    train_imgs = [image_files[i] for i in train_indices.indices]
    val_imgs   = [image_files[i] for i in val_indices.indices]

    train_dataset = EcoPlateSegmentationDataset(train_imgs, img_size=img_size, is_training=True)
    val_dataset   = EcoPlateSegmentationDataset(val_imgs, img_size=img_size, is_training=False)

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0, drop_last=(len(train_dataset) > batch_size))
    val_loader   = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=0)

    print(f"[Data Partition] Train Set: {len(train_dataset)} images | Val Set: {len(val_dataset)} images\n", flush=True)

    # 2. Build Model, Loss, Optimizer, Scheduler, Scaler
    model = BaselineUNet(in_channels=3, num_classes=9).to(device)
    criterion = CombinedCELossAndDice(lambda_dice=1.0)
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-6)
    use_amp = (device.type == "cuda")
    scaler = torch.amp.GradScaler('cuda', enabled=use_amp)

    best_val_iou = 0.0
    best_checkpoint_path = os.path.join(save_dir, "baseline_cnn_unet_best.pth")
    last_checkpoint_path = os.path.join(save_dir, "baseline_cnn_unet_last.pth")
    metrics_csv_path     = os.path.join(results_dir, "baseline_cnn_training_metrics.csv")

    history = {
        "epoch": [],
        "train_loss": [],
        "val_loss": [],
        "val_iou": [],
        "val_dice": [],
        "val_precision": []
    }

    start_time = time.time()

    # 3. Training Loop
    for epoch in range(1, epochs + 1):
        epoch_start = time.time()
        model.train()
        running_loss = 0.0
        batches = 0

        for images, masks, _ in train_loader:
            images = images.to(device)
            masks  = masks.to(device)

            optimizer.zero_grad()
            with torch.amp.autocast('cuda', enabled=use_amp):
                logits = model(images)
                loss, _, _ = criterion(logits, masks)

            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()

            running_loss += loss.item()
            batches += 1

        scheduler.step()
        epoch_train_loss = running_loss / max(batches, 1)

        # 4. Validation Loop
        model.eval()
        val_loss = 0.0
        val_batches = 0
        all_preds = []
        all_targets = []

        with torch.no_grad():
            for images, masks, _ in val_loader:
                images = images.to(device)
                masks  = masks.to(device)

                with torch.amp.autocast('cuda', enabled=use_amp):
                    logits = model(images)
                    loss, _, _ = criterion(logits, masks)

                val_loss += loss.item()
                val_batches += 1

                preds = torch.argmax(logits, dim=1)
                all_preds.append(preds.cpu())
                all_targets.append(masks.cpu())

        epoch_val_loss = val_loss / max(val_batches, 1)
        cat_preds   = torch.cat(all_preds, dim=0)
        cat_targets = torch.cat(all_targets, dim=0)
        metrics = compute_segmentation_metrics(cat_preds, cat_targets, num_classes=9)
        epoch_duration = time.time() - epoch_start

        # Record history
        history["epoch"].append(epoch)
        history["train_loss"].append(epoch_train_loss)
        history["val_loss"].append(epoch_val_loss)
        history["val_iou"].append(metrics["mean_iou"])
        history["val_dice"].append(metrics["mean_dice"])
        history["val_precision"].append(metrics["mean_precision"])

        print(f"Epoch [{epoch:02d}/{epochs:02d}] ({epoch_duration:.1f}s) "
              f"Train Loss: {epoch_train_loss:.4f} | "
              f"Val Loss: {epoch_val_loss:.4f} | "
              f"mIoU: {metrics['mean_iou']:.4f} | "
              f"Dice: {metrics['mean_dice']:.4f} | "
              f"Prec: {metrics['mean_precision']:.4f}", flush=True)

        # Save Best Checkpoint
        if metrics["mean_iou"] > best_val_iou or epoch == 1:
            best_val_iou = metrics["mean_iou"]
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "optimizer_state_dict": optimizer.state_dict(),
                "val_iou": best_val_iou,
                "val_dice": metrics["mean_dice"],
                "classes": FOOD_CLASSES
            }, best_checkpoint_path)

        # Save Last Checkpoint
        torch.save({
            "epoch": epoch,
            "model_state_dict": model.state_dict(),
            "val_iou": metrics["mean_iou"],
            "classes": FOOD_CLASSES
        }, last_checkpoint_path)

        # Incremental CSV export
        with open(metrics_csv_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["epoch", "train_loss", "val_loss", "val_iou", "val_dice", "val_precision"])
            for i in range(len(history["epoch"])):
                writer.writerow([
                    history["epoch"][i],
                    f"{history['train_loss'][i]:.4f}",
                    f"{history['val_loss'][i]:.4f}",
                    f"{history['val_iou'][i]:.4f}",
                    f"{history['val_dice'][i]:.4f}",
                    f"{history['val_precision'][i]:.4f}"
                ])

    total_duration = time.time() - start_time
    print(f"\n[Training Complete] Finished {epochs} epochs in {total_duration:.1f}s.", flush=True)
    print(f"Best Validation mIoU: {best_val_iou:.4f} -> Saved to {best_checkpoint_path}", flush=True)

    # 5. Plot Training Convergence Curves
    plot_path = os.path.join(results_dir, "baseline_cnn_training_convergence.png")
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))

    # Loss Curve
    ax1.plot(history["epoch"], history["train_loss"], label="Train Combined Loss", color="#174A5B", lw=2)
    ax1.plot(history["epoch"], history["val_loss"], label="Val Loss", color="#C0392B", lw=2, linestyle="--")
    ax1.set_title("Baseline CNN Loss Convergence (CE + Dice)", fontsize=12, fontweight="bold", color="#174A5B")
    ax1.set_xlabel("Epoch")
    ax1.set_ylabel("Loss")
    ax1.grid(True, linestyle=":", alpha=0.6)
    ax1.legend()

    # Metric Curve
    ax2.plot(history["epoch"], history["val_iou"], label="Val Mean IoU", color="#008000", lw=2)
    ax2.plot(history["epoch"], history["val_dice"], label="Val Dice / F1", color="#2D7082", lw=2)
    ax2.plot(history["epoch"], history["val_precision"], label="Val Precision", color="#8E44AD", lw=1.5, linestyle=":")
    ax2.set_title("Validation Segmentation Metrics", fontsize=12, fontweight="bold", color="#174A5B")
    ax2.set_xlabel("Epoch")
    ax2.set_ylabel("Score")
    ax2.grid(True, linestyle=":", alpha=0.6)
    ax2.legend()

    plt.tight_layout()
    plt.savefig(plot_path, dpi=200)
    plt.close()
    print(f"[Plot Saved] Generated convergence plot: {plot_path}", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train EcoPlate Baseline CNN (U-Net) Segmentation Model")
    parser.add_argument("--epochs", type=int, default=15, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=4, help="Batch size")
    parser.add_argument("--lr", type=float, default=2e-4, help="Learning rate")
    parser.add_argument("--img-size", type=int, default=512, help="Input image dimension")
    parser.add_argument("--data-dir", type=str, default=None, help="Path to training data directory")
    parser.add_argument("--save-dir", type=str, default=DEFAULT_SAVE_DIR, help="Directory to save model weights")
    parser.add_argument("--results-dir", type=str, default=DEFAULT_RESULTS_DIR, help="Directory to save metric plots")
    parser.add_argument("--device", type=str, default=None, help="Device ('cuda:0' or 'cpu')")

    args = parser.parse_args()
    train_baseline_cnn(
        epochs=args.epochs,
        batch_size=args.batch_size,
        lr=args.lr,
        img_size=args.img_size,
        data_dir=args.data_dir,
        save_dir=args.save_dir,
        results_dir=args.results_dir,
        device=args.device
    )

