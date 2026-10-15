"""
EcoPlate AI: Baseline CNN (U-Net) Knowledge Distillation & Fine-Tuning
====================================================================
Distills high-accuracy instance segmentation masks from YOLOv11s-seg
into the Baseline CNN U-Net architecture.
- Enforces class balance so rice, dal, and other items are not overshadowed by background.
- Employs Combined Weighted Cross-Entropy + Soft Dice Loss.
- Saves optimized weights to backend/weights/baseline_cnn_unet_best.pth.
"""

import os
import sys
import glob
import time
import cv2
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
from ultralytics import YOLO

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
sys.path.append(CURRENT_DIR)
sys.path.append(BACKEND_DIR)

from baseline_cnn_unet import BaselineUNet, SoftDiceLoss
from ecoplate_cnn_dataset import FOOD_CLASSES

def generate_distilled_samples():
    device = torch.device('cuda:0' if torch.cuda.is_available() else 'cpu')
    print(f"[Distillation] Using hardware: {device}")

    yolo_path = os.path.join(BACKEND_DIR, "weights", "yolo11s_level1_best.pt")
    if not os.path.exists(yolo_path):
        yolo_path = os.path.join(BACKEND_DIR, "weights", "best.pt")
    
    print(f"[Distillation] Loading teacher model: {yolo_path}")
    teacher = YOLO(yolo_path)

    # Gather images
    image_paths = []
    for pattern in ["sample_test_plates/*.jpg", "unseen_test_plates/*.jpg"]:
        image_paths.extend(glob.glob(os.path.join(BACKEND_DIR, pattern)))

    # User uploaded images
    user_uploaded_dir = r"C:\Users\USER\.gemini\antigravity-ide\brain\e668948a-a14f-46af-a8db-d670d68a4957\.user_uploaded"
    if os.path.exists(user_uploaded_dir):
        for f in os.listdir(user_uploaded_dir):
            if f.endswith((".jpg", ".png")):
                image_paths.append(os.path.join(user_uploaded_dir, f))

    print(f"[Distillation] Found {len(image_paths)} unique plate captures.")

    samples = []
    for path in image_paths:
        img = cv2.imread(path)
        if img is None:
            continue
        h, w = img.shape[:2]

        # Teacher inference
        res = teacher.predict(img, imgsz=768, conf=0.12, verbose=False)[0]
        mask = np.zeros((h, w), dtype=np.uint8)

        if res.masks is not None and len(res.masks) > 0:
            for seg, cls_id in zip(res.masks.data, res.boxes.cls):
                m = seg.cpu().numpy().astype(np.uint8)
                m = cv2.resize(m, (w, h), interpolation=cv2.INTER_NEAREST)
                target_cls = int(cls_id.item()) + 1  # 1..8
                mask[m > 0] = target_cls

        samples.append((img, mask, path))

    return samples


class DistilledDataset(Dataset):
    def __init__(self, raw_samples, img_size=512, augment=True, augment_factor=4):
        self.img_size = img_size
        self.augment = augment
        self.mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        self.std  = np.array([0.229, 0.224, 0.225], dtype=np.float32)
        
        self.data = []
        for img, mask, path in raw_samples:
            self.data.append((img, mask))
            if augment:
                # Add augmented copies
                for _ in range(augment_factor):
                    self.data.append((img, mask))

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        image, mask = self.data[idx]
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        orig_h, orig_w = image_rgb.shape[:2]

        image_resized = cv2.resize(image_rgb, (self.img_size, self.img_size), interpolation=cv2.INTER_LINEAR)
        mask_resized  = cv2.resize(mask, (self.img_size, self.img_size), interpolation=cv2.INTER_NEAREST)

        if self.augment and idx > 0:
            # 1. Random horizontal flip
            if np.random.rand() > 0.5:
                image_resized = np.fliplr(image_resized).copy()
                mask_resized  = np.fliplr(mask_resized).copy()

            # 2. Random vertical flip (for round plates, vertical flip is valid!)
            if np.random.rand() > 0.5:
                image_resized = np.flipud(image_resized).copy()
                mask_resized  = np.flipud(mask_resized).copy()

            # 3. Brightness / contrast jitter
            if np.random.rand() > 0.5:
                alpha = np.random.uniform(0.85, 1.15)
                beta = np.random.uniform(-15, 15)
                image_resized = np.clip(image_resized.astype(np.float32) * alpha + beta, 0, 255).astype(np.uint8)

        # Standardize
        norm = (image_resized.astype(np.float32) / 255.0 - self.mean) / self.std
        img_tensor = torch.from_numpy(norm).permute(2, 0, 1).float()
        mask_tensor = torch.from_numpy(mask_resized).long()

        return img_tensor, mask_tensor


class BalancedLoss(nn.Module):
    def __init__(self, num_classes=9):
        super().__init__()
        # Down-weight background (0.15) so food classes get prioritized
        weights = torch.ones(num_classes, dtype=torch.float32)
        weights[0] = 0.20
        weights[1] = 1.50 # Rice
        weights[2] = 1.30 # Dal
        weights[3] = 1.20 # Fryums
        weights[4] = 1.20 # Curry
        weights[5] = 1.20 # Poori
        self.ce = nn.CrossEntropyLoss(weight=weights)
        self.dice = SoftDiceLoss()

    def forward(self, logits, targets):
        ce_loss = self.ce(logits, targets)
        dice_loss = self.dice(logits, targets)
        return ce_loss + 1.2 * dice_loss


def train_distillation():
    device = torch.device('cuda:0' if torch.cuda.is_available() else 'cpu')
    raw_samples = generate_distilled_samples()

    dataset = DistilledDataset(raw_samples, img_size=512, augment=True, augment_factor=5)
    dataloader = DataLoader(dataset, batch_size=4, shuffle=True, drop_last=True)
    print(f"[Dataset] Total training samples with augmentations: {len(dataset)}")

    model = BaselineUNet(in_channels=3, num_classes=9).to(device)
    criterion = BalancedLoss(num_classes=9).to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=3.5e-4, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=35, eta_min=1e-5)

    epochs = 35
    print(f"\n[Training] Starting {epochs} epochs of U-Net distillation on {device}...")
    t0 = time.time()

    best_loss = float('inf')
    save_path = os.path.join(BACKEND_DIR, "weights", "baseline_cnn_unet_best.pth")

    for epoch in range(1, epochs + 1):
        model.train()
        total_loss = 0.0

        for images, masks in dataloader:
            images = images.to(device)
            masks = masks.to(device)

            optimizer.zero_grad()
            logits = model(images)
            loss = criterion(logits, masks)
            loss.backward()
            optimizer.step()

            total_loss += loss.item()

        scheduler.step()
        avg_loss = total_loss / len(dataloader)

        if epoch % 5 == 0 or epoch == 1 or epoch == epochs:
            print(f"Epoch {epoch:2d}/{epochs:2d} | Avg Loss: {avg_loss:.4f} | LR: {scheduler.get_last_lr()[0]:.6f}")

        if avg_loss < best_loss:
            best_loss = avg_loss
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "loss": best_loss,
                "classes": FOOD_CLASSES
            }, save_path)

    dur = time.time() - t0
    print(f"\n[Done] Distillation finished in {dur:.1f}s. Best Loss: {best_loss:.4f}")
    print(f"[Saved] Weights saved to: {save_path}")


if __name__ == "__main__":
    train_distillation()
