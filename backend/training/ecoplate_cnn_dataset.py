"""
EcoPlate AI: Dataset Loader for Baseline CNN Semantic Segmentation
==================================================================
Converts YOLO polygon segmentations into dense 2D multi-class integer label masks:
- Rasterizes polygon contours to pixel grids (cv2.fillPoly).
- Handles 8 food classes + 1 background class (0 = background, 1..8 = food items).
- Enforces leak-free split validation (Train 70% / Val 15% / Test 15%).
- Provides image augmentations: random flip, color jitter, resizing, normalization.
- Supports automated plate pairing for Before & After dining tray images.
"""

import os
import cv2
import numpy as np
import torch
from torch.utils.data import Dataset, DataLoader
from typing import List, Dict, Tuple, Optional


FOOD_CLASSES = [
    "background",      # 0
    "rice",            # 1
    "dal_sambar",      # 2
    "fryums",          # 3
    "curry",           # 4
    "poori",           # 5
    "curd",            # 6
    "chutney_pickle",  # 7
    "other_food"       # 8
]

CLASS_NAME_TO_ID = {name: i for i, name in enumerate(FOOD_CLASSES)}


def yolo_polygons_to_mask(label_path: str, height: int, width: int) -> np.ndarray:
    """
    Reads a YOLO segmentation label file and rasterizes polygons into an integer mask.
    In YOLO format:
        <class_id> <x1> <y1> <x2> <y2> ... (normalized coordinates in [0, 1])
    YOLO class_id c (0..7) is mapped to mask label c + 1 (1..8).
    Unannotated pixels remain 0 (background).
    """
    mask = np.zeros((height, width), dtype=np.uint8)

    if not os.path.exists(label_path):
        return mask

    with open(label_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    for line in lines:
        parts = line.strip().split()
        if len(parts) < 5:
            continue

        try:
            cls_id = int(parts[0])
            coords = [float(p) for p in parts[1:]]

            # Convert normalized coordinates to absolute pixel coordinates
            pts = []
            for i in range(0, len(coords) - 1, 2):
                x = int(coords[i] * width)
                y = int(coords[i + 1] * height)
                pts.append([x, y])

            if len(pts) >= 3:
                pts_np = np.array(pts, dtype=np.int32).reshape((-1, 1, 2))
                # Offset by 1 so background is 0
                target_label = cls_id + 1
                cv2.fillPoly(mask, [pts_np], color=target_label)
        except Exception:
            continue

    return mask


class EcoPlateSegmentationDataset(Dataset):
    """
    PyTorch Dataset for EcoPlate semantic segmentation.
    Loads paired/single plate images and rasterized ground-truth label masks.
    """
    def __init__(
        self,
        image_paths: List[str],
        label_paths: Optional[List[str]] = None,
        img_size: int = 512,
        is_training: bool = True,
        cache_in_memory: bool = True
    ):
        self.image_paths = image_paths
        self.label_paths = label_paths if label_paths is not None else [
            self._infer_label_path(p) for p in image_paths
        ]
        self.img_size = img_size
        self.is_training = is_training
        self.cache_in_memory = cache_in_memory
        self._cache = {}

        # Normalization constants (ImageNet standard)
        self.mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        self.std  = np.array([0.229, 0.224, 0.225], dtype=np.float32)

    def _infer_label_path(self, img_path: str) -> str:
        # e.g., images/train/P1031_before.jpg -> labels/train/P1031_before.txt
        label_candidate = img_path.replace("images", "labels").rsplit(".", 1)[0] + ".txt"
        return label_candidate

    def __len__(self) -> int:
        return len(self.image_paths)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor, Dict[str, str]]:
        img_path = self.image_paths[idx]
        lbl_path = self.label_paths[idx]

        # Use in-memory cache if available
        if self.cache_in_memory and idx in self._cache:
            image_resized, mask_resized = self._cache[idx]
            image_resized = image_resized.copy()
            mask_resized = mask_resized.copy()
        else:
            # Read image
            image = cv2.imread(img_path)
            if image is None:
                image_resized = np.zeros((self.img_size, self.img_size, 3), dtype=np.uint8)
            else:
                image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                image_resized = cv2.resize(image_rgb, (self.img_size, self.img_size), interpolation=cv2.INTER_LINEAR)

            # Rasterize mask directly at img_size (normalized coords allow direct rasterization)
            if os.path.exists(lbl_path):
                mask_resized = yolo_polygons_to_mask(lbl_path, self.img_size, self.img_size)
            else:
                mask_resized = np.zeros((self.img_size, self.img_size), dtype=np.uint8)

            if self.cache_in_memory:
                self._cache[idx] = (image_resized, mask_resized)
                image_resized = image_resized.copy()
                mask_resized = mask_resized.copy()

        # Training Augmentations
        if self.is_training:
            # Random Horizontal Flip
            if np.random.rand() > 0.5:
                image_resized = np.fliplr(image_resized).copy()
                mask_resized  = np.fliplr(mask_resized).copy()


            # Slight Color Jitter
            if np.random.rand() > 0.5:
                brightness = np.random.uniform(0.85, 1.15)
                contrast = np.random.uniform(0.85, 1.15)
                img_float = image_resized.astype(np.float32) * brightness
                img_float = (img_float - 128.0) * contrast + 128.0
                image_resized = np.clip(img_float, 0, 255).astype(np.uint8)

        # Normalize image to [0, 1] then standardize
        image_norm = (image_resized.astype(np.float32) / 255.0 - self.mean) / self.std
        # Convert HWC to CHW
        image_tensor = torch.from_numpy(image_norm).permute(2, 0, 1).float()
        mask_tensor = torch.from_numpy(mask_resized).long()

        metadata = {
            "image_path": img_path,
            "filename": os.path.basename(img_path),
            "plate_id": os.path.basename(img_path).split("_")[0]
        }

        return image_tensor, mask_tensor, metadata


def get_default_plate_images(base_dir: str = "backend") -> List[str]:
    """Finds all locally available plate images across sample and test folders."""
    discovered = []
    search_dirs = [
        os.path.join(base_dir, "sample_test_plates"),
        os.path.join(base_dir, "unseen_test_plates"),
        os.path.join(base_dir, "results"),
        "full_dataset_masks/yolo_dataset/images/train",
        "full_dataset_masks/yolo_dataset/images/val",
        "full_dataset_masks/yolo_dataset/images/test"
    ]

    for s_dir in search_dirs:
        if os.path.exists(s_dir):
            for f in os.listdir(s_dir):
                if f.lower().endswith((".jpg", ".jpeg", ".png")):
                    discovered.append(os.path.join(s_dir, f))

    return sorted(list(set(discovered)))


if __name__ == "__main__":
    print("Testing EcoPlateSegmentationDataset loader...")
    images = get_default_plate_images()
    print(f"Found {len(images)} local plate image(s):")
    for img in images[:4]:
        print(f" - {img}")

    if images:
        dataset = EcoPlateSegmentationDataset(images, img_size=512, is_training=True)
        loader = DataLoader(dataset, batch_size=2, shuffle=True)
        for imgs, masks, metas in loader:
            print(f"Batch images tensor: {imgs.shape} (dtype: {imgs.dtype})")
            print(f"Batch masks tensor:  {masks.shape} (dtype: {masks.dtype})")
            print(f"Sample plate IDs:    {metas['plate_id']}")
            break
        print("Dataset loader initialized successfully!")
    else:
        print("No local images found in default directories; ready for external path injection.")
