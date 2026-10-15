"""
EcoPlate AI: Baseline CNN Plate Pair Evaluator and Waste Estimator
==================================================================
Performs end-to-end inference and waste analysis using the Baseline CNN (U-Net):
1. Ingests paired photographs (Before-Meal and After-Meal).
2. Detects the circular/elliptical plate boundary via Hough Transform (scaled to 0.96r).
3. Executes semantic segmentation with the trained BaselineUNet model.
4. Enforces 100% boundary containment (M_clean = M_pred & Omega_plate).
5. Applies Closed-World semantic filtering (C_after subset-of C_before).
6. Computes item-wise and plate-level food waste and consumption percentages.
7. Renders a comprehensive visual scorecard overlay.
"""

import os
import sys
import cv2
import json
import numpy as np
import torch
import torch.nn.functional as F
from typing import Dict, Any, Tuple, Optional, List

# Ensure imports resolve
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "training")))
from baseline_cnn_unet import BaselineUNet
from ecoplate_cnn_dataset import FOOD_CLASSES


class BaselineCNNEvaluator:
    def __init__(
        self,
        checkpoint_path: str = "backend/weights/baseline_cnn_unet_best.pth",
        img_size: int = 512,
        device: Optional[str] = None
    ):
        if device is None:
            self.device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
        else:
            self.device = torch.device(device)

        self.img_size = img_size
        self.num_classes = len(FOOD_CLASSES)
        self.classes = FOOD_CLASSES

        # Normalization constants
        self.mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        self.std  = np.array([0.229, 0.224, 0.225], dtype=np.float32)

        # Initialize and load model
        self.model = BaselineUNet(in_channels=3, num_classes=self.num_classes).to(self.device)
        if os.path.exists(checkpoint_path):
            ckpt = torch.load(checkpoint_path, map_location=self.device)
            state_dict = ckpt["model_state_dict"] if "model_state_dict" in ckpt else ckpt
            self.model.load_state_dict(state_dict)
            print(f"[BaselineCNNEvaluator] Loaded checkpoint from: {checkpoint_path}")
        else:
            print(f"[BaselineCNNEvaluator] Warning: Checkpoint not found at {checkpoint_path}; running with initialized weights.")

        self.model.eval()

    def detect_plate_roi(self, image: np.ndarray, scale: float = 0.96) -> Tuple[np.ndarray, Tuple[int, int, int]]:
        """
        Detects circular plate basin using multi-pass Hough Circles.
        Returns a binary mask of the plate basin (scaled to 0.96r) and (x_center, y_center, radius).
        """
        h, w = image.shape[:2]
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (9, 9), 2)

        # Candidate radius bounds based on tray dimensions
        min_r = int(min(h, w) * 0.28)
        max_r = int(min(h, w) * 0.52)

        circles = cv2.HoughCircles(
            blurred,
            cv2.HOUGH_GRADIENT,
            dp=1.2,
            minDist=int(min(h, w) * 0.4),
            param1=100,
            param2=35,
            minRadius=min_r,
            maxRadius=max_r
        )

        mask = np.zeros((h, w), dtype=np.uint8)

        if circles is not None:
            circles = np.uint16(np.around(circles))
            best = circles[0][0]
            cx, cy, r = int(best[0]), int(best[1]), int(best[2])
            usable_r = int(r * scale)
            cv2.circle(mask, (cx, cy), usable_r, 255, -1)
            circle_info = (cx, cy, usable_r)
        else:
            # Fallback to centered circular basin
            cx, cy = w // 2, h // 2
            r = int(min(h, w) * 0.45 * scale)
            cv2.circle(mask, (cx, cy), r, 255, -1)
            circle_info = (cx, cy, r)

        return mask, circle_info

    def segment_image(self, image: np.ndarray) -> np.ndarray:
        """Runs the Baseline CNN model to produce a per-pixel semantic class label map."""
        orig_h, orig_w = image.shape[:2]

        # Preprocess
        img_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        img_resized = cv2.resize(img_rgb, (self.img_size, self.img_size), interpolation=cv2.INTER_LINEAR)
        img_norm = (img_resized.astype(np.float32) / 255.0 - self.mean) / self.std
        tensor = torch.from_numpy(img_norm).permute(2, 0, 1).unsqueeze(0).float().to(self.device)

        with torch.no_grad():
            logits = self.model(tensor)
            preds = torch.argmax(logits, dim=1).squeeze(0).cpu().numpy().astype(np.uint8)

        # Upscale predicted mask back to original resolution
        full_mask = cv2.resize(preds, (orig_w, orig_h), interpolation=cv2.INTER_NEAREST)
        return full_mask

    def analyze_plate_pair(
        self,
        before_path: str,
        after_path: str,
        output_viz_path: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes the full EcoPlate verification and waste analysis pipeline on a plate pair.
        """
        img_before = cv2.imread(before_path)
        img_after  = cv2.imread(after_path)

        if img_before is None or img_after is None:
            raise ValueError(f"Could not read plate pair: {before_path}, {after_path}")

        # 1. Detect plate ROI on both captures
        plate_mask_before, circle_before = self.detect_plate_roi(img_before, scale=0.96)
        plate_mask_after,  circle_after  = self.detect_plate_roi(img_after,  scale=0.96)

        # 2. Run Baseline CNN segmentation
        raw_mask_before = self.segment_image(img_before)
        raw_mask_after  = self.segment_image(img_after)

        # 3. Bitwise plate rim containment (M_clean = M_pred & Omega_plate)
        clean_mask_before = np.where(plate_mask_before > 0, raw_mask_before, 0)
        clean_mask_after  = np.where(plate_mask_after > 0,  raw_mask_after,  0)

        # 4. Identify served classes in Before image
        served_classes = set(np.unique(clean_mask_before))
        served_classes.discard(0)  # Exclude background

        # 5. Apply Closed-World filter: C_after subset-of C_before
        filtered_mask_after = clean_mask_after.copy()
        unserved_detected = set(np.unique(filtered_mask_after)) - served_classes
        unserved_detected.discard(0)

        pruned_pixels = 0
        for cls_id in unserved_detected:
            cls_pixels = (filtered_mask_after == cls_id).sum()
            pruned_pixels += int(cls_pixels)
            filtered_mask_after[filtered_mask_after == cls_id] = 0

        # 6. Item-wise pixel area and waste calculation
        plate_area_before = (plate_mask_before > 0).sum()
        plate_area_after  = (plate_mask_after > 0).sum()

        item_results = []
        total_served_pixels = 0
        total_leftover_pixels = 0

        for cls_id in range(1, self.num_classes):
            cls_name = self.classes[cls_id]
            area_before = int((clean_mask_before == cls_id).sum())
            area_after  = int((filtered_mask_after == cls_id).sum())

            if area_before > 0 or area_after > 0:
                if area_before > 0:
                    waste_pct = min(100.0, max(0.0, (area_after / area_before) * 100.0))
                else:
                    waste_pct = 0.0

                consumed_pct = 100.0 - waste_pct
                total_served_pixels += area_before
                total_leftover_pixels += area_after

                item_results.append({
                    "class_id": cls_id,
                    "food_item": cls_name,
                    "before_pixel_area": area_before,
                    "after_pixel_area": area_after,
                    "waste_pct": round(waste_pct, 2),
                    "consumed_pct": round(consumed_pct, 2)
                })

        # Overall plate waste
        if total_served_pixels > 0:
            overall_waste_pct = min(100.0, max(0.0, (total_leftover_pixels / total_served_pixels) * 100.0))
        else:
            overall_waste_pct = 0.0

        overall_consumed_pct = 100.0 - overall_waste_pct

        summary = {
            "before_image": os.path.basename(before_path),
            "after_image": os.path.basename(after_path),
            "plate_id": os.path.basename(before_path).split("_")[0],
            "served_food_items": [self.classes[c] for c in served_classes],
            "closed_world_pruned_classes": [self.classes[c] for c in unserved_detected],
            "closed_world_pruned_pixels": pruned_pixels,
            "overall_waste_pct": round(overall_waste_pct, 2),
            "overall_consumed_pct": round(overall_consumed_pct, 2),
            "items": item_results
        }

        # 7. Render visualization overlay if requested
        if output_viz_path:
            self.render_visual_scorecard(
                img_before, img_after,
                clean_mask_before, filtered_mask_after,
                summary, output_viz_path
            )

        return summary

    def render_visual_scorecard(
        self,
        img_b: np.ndarray,
        img_a: np.ndarray,
        mask_b: np.ndarray,
        mask_a: np.ndarray,
        summary: Dict[str, Any],
        out_path: str
    ):
        """Creates a composite side-by-side verification figure with mask overlays and scorecard."""
        h, w = 480, 480
        b_res = cv2.resize(img_b, (w, h))
        a_res = cv2.resize(img_a, (w, h))
        mb_res = cv2.resize(mask_b, (w, h), interpolation=cv2.INTER_NEAREST)
        ma_res = cv2.resize(mask_a, (w, h), interpolation=cv2.INTER_NEAREST)

        # Palette for categories
        palette = [
            (0, 0, 0),       # Background
            (255, 180, 0),   # Rice
            (0, 140, 255),   # Dal
            (255, 60, 180),  # Fryums
            (0, 210, 80),    # Curry
            (180, 100, 255), # Poori
            (220, 220, 220), # Curd
            (0, 60, 220),    # Chutney
            (120, 120, 120)  # Other
        ]

        def apply_overlay(img, mask):
            overlay = img.copy()
            for c in range(1, len(palette)):
                overlay[mask == c] = palette[c]
            return cv2.addWeighted(img, 0.65, overlay, 0.35, 0)

        over_b = apply_overlay(b_res, mb_res)
        over_a = apply_overlay(a_res, ma_res)

        # Stitch horizontally
        panel = np.hstack([over_b, over_a])

        # Header bar
        header = np.zeros((70, panel.shape[1], 3), dtype=np.uint8)
        header[:] = (91, 74, 23)  # Teal header
        cv2.putText(header, f"EcoPlate Baseline CNN Verification: Plate {summary['plate_id']}", (20, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        cv2.putText(header, f"Overall Waste: {summary['overall_waste_pct']}% | Consumed: {summary['overall_consumed_pct']}% | Pruned Glare Px: {summary['closed_world_pruned_pixels']}",
                    (20, 56), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (200, 240, 255), 1)

        final_composite = np.vstack([header, panel])
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        cv2.imwrite(out_path, final_composite)
        print(f"[Visual Scorecard Saved] -> {out_path}")


if __name__ == "__main__":
    evaluator = BaselineCNNEvaluator()
    # Test on Plate P1031 if present
    p1031_b = "backend/sample_test_plates/P1031_before.jpg"
    p1031_a = "backend/sample_test_plates/P1031_after.jpg"
    viz_out = "backend/results/baseline_cnn_P1031_eval.jpg"

    if os.path.exists(p1031_b) and os.path.exists(p1031_a):
        print(f"Running Baseline CNN analysis on Plate P1031...")
        result = evaluator.analyze_plate_pair(p1031_b, p1031_a, output_viz_path=viz_out)
        print(json.dumps(result, indent=2))
    else:
        print("Sample plates not in local test directory; evaluator ready for live inference.")
