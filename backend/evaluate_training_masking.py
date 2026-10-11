"""
EcoPlate AI: Evaluate Masking Performance on Training Dataset
============================================================
Compares:
  1. Baseline Raw YOLOv11n-seg v2
  2. Option A + Model (Plate ROI Isolation + Dual Confidence + Rim Clipping)

Computes:
  - Mean Intersection over Union (mIoU)
  - Mask Precision (Pixel Precision)
  - Mask Recall (Pixel Recall)
  - Dice Coefficient / F1-Score
  - Spillover outside plate (False Positive Bleed)
  - Per-class breakdown for all 8 food classes
"""

import os
import sys
import time
import cv2
import numpy as np
import pandas as pd
import torch
from ultralytics import YOLO

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Paths
MODEL_PATH = r"f:\4 year\nndl\Team-4\runs\segment\training_runs\yolo11n_food_seg_v2\weights\best.pt"
TRAIN_IMG_DIR = r"f:\4 year\nndl\Team-4\full_dataset_masks\yolo_dataset\images\train"
TRAIN_LBL_DIR = r"f:\4 year\nndl\Team-4\full_dataset_masks\yolo_dataset\labels\train"
OUTPUT_DIR = r"f:\4 year\nndl\Team-4\waste_estimation_results"

CLASSES = ['rice', 'dal_sambar', 'fryums', 'curry', 'poori', 'curd', 'chutney_pickle', 'other_food']
NUM_CLASSES = len(CLASSES)


def detect_plate_bounds(img):
    """
    Detects dining plate boundary circle.
    Returns: cx, cy, r, plate_mask (uint8 binary)
    """
    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (21, 21), 0)

    target_cy = int(h * 0.42)
    best_circle = None
    min_dist = float('inf')

    for p2 in [35, 25, 20]:
        circles = cv2.HoughCircles(
            blurred, cv2.HOUGH_GRADIENT, dp=1.2,
            minDist=int(min(w, h) * 0.30),
            param1=80, param2=p2,
            minRadius=int(w * 0.30),
            maxRadius=int(w * 0.55)
        )
        if circles is not None:
            for c in circles[0]:
                cx, cy, r = c
                dist = np.hypot(cx - w / 2, cy - target_cy)
                if dist < min_dist and dist < min(w, h) * 0.35:
                    min_dist = dist
                    best_circle = (int(cx), int(cy), int(r))
            if best_circle is not None:
                break

    if best_circle is not None:
        cx, cy, r = best_circle
        r_inner = int(r * 0.96)
    else:
        cx, cy = w // 2, int(h * 0.44)
        r_inner = int(w * 0.47)

    mask = np.zeros((h, w), dtype=np.uint8)
    cv2.circle(mask, (cx, cy), r_inner, 255, -1)
    return cx, cy, r_inner, mask


def parse_gt_masks(label_path, h, w):
    """
    Parses normalized YOLO polygon labels into binary ground-truth masks.
    """
    gt_masks = {c: np.zeros((h, w), dtype=np.uint8) for c in range(NUM_CLASSES)}
    if not os.path.exists(label_path):
        return gt_masks

    with open(label_path, 'r') as f:
        for line in f:
            parts = line.strip().split()
            if len(parts) < 3:
                continue
            cls_id = int(parts[0])
            if cls_id >= NUM_CLASSES:
                continue
            coords = np.array([float(x) for x in parts[1:]]).reshape(-1, 2)
            coords[:, 0] *= w
            coords[:, 1] *= h
            pts = coords.astype(np.int32)
            if len(pts) >= 3:
                poly_mask = np.zeros((h, w), dtype=np.uint8)
                cv2.fillPoly(poly_mask, [pts], 1)
                gt_masks[cls_id] = cv2.bitwise_or(gt_masks[cls_id], poly_mask)

    return gt_masks


def get_raw_predictions(results, h, w):
    """Extracts raw masks from YOLO results (conf=0.25)."""
    pred_masks = {c: np.zeros((h, w), dtype=np.uint8) for c in range(NUM_CLASSES)}
    if results.masks is not None and len(results.masks) > 0:
        masks_data = results.masks.data.cpu().numpy()
        classes = results.boxes.cls.cpu().numpy().astype(int)
        for m, cls_id in zip(masks_data, classes):
            if cls_id < NUM_CLASSES:
                m_resized = cv2.resize(m, (w, h), interpolation=cv2.INTER_LINEAR)
                m_bin = (m_resized > 0.5).astype(np.uint8)
                pred_masks[cls_id] = cv2.bitwise_or(pred_masks[cls_id], m_bin)
    return pred_masks


def get_option_a_predictions(results, plate_mask, is_after, h, w):
    """
    Extracts Option A filtered masks:
    - Rejects detections outside plate ROI
    - Applies dual confidence (0.45 for after, 0.30 for before)
    - Clips mask to plate rim
    """
    conf_thresh = 0.45 if is_after else 0.30
    pred_masks = {c: np.zeros((h, w), dtype=np.uint8) for c in range(NUM_CLASSES)}

    if results.masks is not None and len(results.masks) > 0:
        masks_data = results.masks.data.cpu().numpy()
        boxes = results.boxes
        classes = boxes.cls.cpu().numpy().astype(int)
        confs = boxes.conf.cpu().numpy()

        for i, (m, cls_id, conf) in enumerate(zip(masks_data, classes, confs)):
            if cls_id >= NUM_CLASSES:
                continue
            # Confidence filter
            if conf < conf_thresh:
                continue

            x1, y1, x2, y2 = boxes.xyxy[i].cpu().numpy().astype(int)
            bcx, bcy = (x1 + x2) // 2, (y1 + y2) // 2

            # ROI filter: center must be inside plate
            if not (0 <= bcy < h and 0 <= bcx < w and plate_mask[bcy, bcx] > 0):
                continue

            m_resized = cv2.resize(m, (w, h), interpolation=cv2.INTER_LINEAR)
            m_bin = (m_resized > 0.5).astype(np.uint8)

            # Rim clip: zero spillover outside plate
            m_clipped = cv2.bitwise_and(m_bin, plate_mask)

            # Noise filter (< 0.2% plate area)
            plate_area = int(np.sum(plate_mask > 0))
            if np.sum(m_clipped) < (plate_area * 0.002):
                continue

            pred_masks[cls_id] = cv2.bitwise_or(pred_masks[cls_id], m_clipped)

    return pred_masks


def evaluate_dataset():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    print(f"Loading YOLOv11n-seg from: {MODEL_PATH}")
    print(f"Device: {device}")
    model = YOLO(MODEL_PATH)

    image_files = sorted([f for f in os.listdir(TRAIN_IMG_DIR) if f.lower().endswith(('.jpg', '.jpeg', '.png'))])
    total_images = len(image_files)
    print(f"\nEvaluating on TRAINING dataset: {total_images} images")
    print("=" * 70)

    # Accumulators for metrics
    # Format: {'inter': 0, 'union': 0, 'pred': 0, 'gt': 0, 'bleed': 0}
    raw_stats = {c: {'inter': 0, 'union': 0, 'pred': 0, 'gt': 0, 'bleed': 0} for c in range(NUM_CLASSES)}
    opta_stats = {c: {'inter': 0, 'union': 0, 'pred': 0, 'gt': 0, 'bleed': 0} for c in range(NUM_CLASSES)}

    start_time = time.time()

    for idx, fname in enumerate(image_files, 1):
        if idx % 50 == 0 or idx == total_images:
            elapsed = time.time() - start_time
            print(f"  Processed {idx}/{total_images} images ({idx/total_images*100:.1f}%) in {elapsed:.1f}s...")

        img_path = os.path.join(TRAIN_IMG_DIR, fname)
        base_name = os.path.splitext(fname)[0]
        lbl_path = os.path.join(TRAIN_LBL_DIR, f"{base_name}.txt")
        is_after = fname.lower().endswith('_after.jpg')

        img = cv2.imread(img_path)
        if img is None:
            continue
        h, w = img.shape[:2]

        # 1. Parse Ground Truth
        gt_masks = parse_gt_masks(lbl_path, h, w)

        # 2. Plate Detection (Option A)
        _, _, _, plate_mask = detect_plate_bounds(img)
        inv_plate_mask = cv2.bitwise_not(plate_mask)

        # 3. Model Inference (Single forward pass)
        results = model(img, imgsz=640, conf=0.25, device=device, verbose=False)[0]

        # 4. Predictions
        pred_raw = get_raw_predictions(results, h, w)
        pred_opta = get_option_a_predictions(results, plate_mask, is_after, h, w)

        # 5. Accumulate statistics per class
        for c in range(NUM_CLASSES):
            gt = gt_masks[c]
            gt_area = int(np.sum(gt > 0))

            # Raw
            p_raw = pred_raw[c]
            p_raw_area = int(np.sum(p_raw > 0))
            inter_raw = int(np.sum((p_raw & gt) > 0))
            union_raw = int(np.sum((p_raw | gt) > 0))
            bleed_raw = int(np.sum((p_raw & (inv_plate_mask > 0)) > 0))

            raw_stats[c]['inter'] += inter_raw
            raw_stats[c]['union'] += union_raw
            raw_stats[c]['pred'] += p_raw_area
            raw_stats[c]['gt'] += gt_area
            raw_stats[c]['bleed'] += bleed_raw

            # Option A
            p_opta = pred_opta[c]
            p_opta_area = int(np.sum(p_opta > 0))
            inter_opta = int(np.sum((p_opta & gt) > 0))
            union_opta = int(np.sum((p_opta | gt) > 0))
            bleed_opta = int(np.sum((p_opta & (inv_plate_mask > 0)) > 0))

            opta_stats[c]['inter'] += inter_opta
            opta_stats[c]['union'] += union_opta
            opta_stats[c]['pred'] += p_opta_area
            opta_stats[c]['gt'] += gt_area
            opta_stats[c]['bleed'] += bleed_opta

    total_time = time.time() - start_time
    print(f"\nInference & evaluation completed in {total_time:.2f} seconds ({total_images/total_time:.1f} FPS)!")

    # Calculate Metrics
    def compute_metrics(stats):
        res = {}
        for c in range(NUM_CLASSES):
            s = stats[c]
            prec = (s['inter'] / s['pred'] * 100.0) if s['pred'] > 0 else 0.0
            rec = (s['inter'] / s['gt'] * 100.0) if s['gt'] > 0 else 0.0
            dice = (2.0 * s['inter'] / (s['pred'] + s['gt']) * 100.0) if (s['pred'] + s['gt']) > 0 else 0.0
            iou = (s['inter'] / s['union'] * 100.0) if s['union'] > 0 else 0.0
            bleed_pct = (s['bleed'] / s['pred'] * 100.0) if s['pred'] > 0 else 0.0
            res[CLASSES[c]] = {
                'Precision': prec,
                'Recall': rec,
                'F1_Dice': dice,
                'IoU': iou,
                'Bleed_px': s['bleed'],
                'Bleed_pct': bleed_pct,
                'Pred_px': s['pred'],
                'GT_px': s['gt']
            }
        # Macro averages across classes that appear in GT
        active_classes = [c for c in CLASSES if res[c]['GT_px'] > 0]
        macro_prec = np.mean([res[c]['Precision'] for c in active_classes])
        macro_rec  = np.mean([res[c]['Recall'] for c in active_classes])
        macro_dice = np.mean([res[c]['F1_Dice'] for c in active_classes])
        macro_iou  = np.mean([res[c]['IoU'] for c in active_classes])

        # Micro / Global pixel-level sums
        total_inter = sum(stats[c]['inter'] for c in range(NUM_CLASSES))
        total_union = sum(stats[c]['union'] for c in range(NUM_CLASSES))
        total_pred  = sum(stats[c]['pred'] for c in range(NUM_CLASSES))
        total_gt    = sum(stats[c]['gt'] for c in range(NUM_CLASSES))
        total_bleed = sum(stats[c]['bleed'] for c in range(NUM_CLASSES))

        global_prec = (total_inter / total_pred * 100.0) if total_pred > 0 else 0.0
        global_rec  = (total_inter / total_gt * 100.0) if total_gt > 0 else 0.0
        global_dice = (2.0 * total_inter / (total_pred + total_gt) * 100.0) if (total_pred + total_gt) > 0 else 0.0
        global_iou  = (total_inter / total_union * 100.0) if total_union > 0 else 0.0
        global_bleed_pct = (total_bleed / total_pred * 100.0) if total_pred > 0 else 0.0

        return res, {
            'Macro_Precision': macro_prec,
            'Macro_Recall': macro_rec,
            'Macro_Dice': macro_dice,
            'Macro_mIoU': macro_iou,
            'Global_Precision': global_prec,
            'Global_Recall': global_rec,
            'Global_Dice': global_dice,
            'Global_mIoU': global_iou,
            'Total_Bleed_px': total_bleed,
            'Bleed_Rate_pct': global_bleed_pct
        }

    raw_class_res, raw_summary = compute_metrics(raw_stats)
    opta_class_res, opta_summary = compute_metrics(opta_stats)

    # Print Summary Comparison
    print("\n" + "=" * 80)
    print(" 📊 OVERALL MASKING PERFORMANCE ON TRAINING DATASET (436 IMAGES)")
    print("=" * 80)
    print(f"{'Metric':<28} | {'Raw YOLO Model':<18} | {'Option A + Model':<18} | {'Improvement'}")
    print("-" * 80)

    metrics_to_show = [
        ('Global Pixel Precision', 'Global_Precision', '%'),
        ('Global Pixel Recall', 'Global_Recall', '%'),
        ('Global Pixel F1 / Dice', 'Global_Dice', '%'),
        ('Global Pixel IoU', 'Global_mIoU', '%'),
        ('Macro Class Precision', 'Macro_Precision', '%'),
        ('Macro Class Recall', 'Macro_Recall', '%'),
        ('Macro Class F1 / Dice', 'Macro_Dice', '%'),
        ('Macro Class mIoU', 'Macro_mIoU', '%'),
        ('Plate Rim Bleed Rate', 'Bleed_Rate_pct', '%'),
    ]

    for label, key, unit in metrics_to_show:
        val_raw = raw_summary[key]
        val_opt = opta_summary[key]
        diff = val_opt - val_raw
        if key == 'Bleed_Rate_pct':
            imp = f"{diff:+.2f}{unit} (Less is better!)"
        else:
            imp = f"{diff:+.2f}{unit} ({'▲' if diff >= 0 else '▼'})"
        print(f"{label:<28} | {val_raw:>15.2f}{unit} | {val_opt:>15.2f}{unit} | {imp}")

    print("=" * 80)

    # Print Per-Class Breakdown Table
    print("\n" + "=" * 85)
    print(" 🍽️ PER-CLASS MASKING PERFORMANCE (OPTION A + MODEL vs RAW MODEL)")
    print("=" * 85)
    print(f"{'Class':<16} | {'Raw IoU':<9} | {'Opt A IoU':<9} | {'Raw Prec':<9} | {'Opt A Prec':<10} | {'Raw Rec':<8} | {'Opt A Rec':<9}")
    print("-" * 85)

    comparison_records = []
    for cname in CLASSES:
        r = raw_class_res[cname]
        o = opta_class_res[cname]
        print(f"{cname:<16} | {r['IoU']:>7.2f}% | {o['IoU']:>7.2f}% | {r['Precision']:>7.2f}% | {o['Precision']:>8.2f}% | {r['Recall']:>6.2f}% | {o['Recall']:>7.2f}%")
        comparison_records.append({
            'Class': cname,
            'Raw_IoU_pct': round(r['IoU'], 2),
            'OptionA_IoU_pct': round(o['IoU'], 2),
            'Raw_Precision_pct': round(r['Precision'], 2),
            'OptionA_Precision_pct': round(o['Precision'], 2),
            'Raw_Recall_pct': round(r['Recall'], 2),
            'OptionA_Recall_pct': round(o['Recall'], 2),
            'Raw_F1_Dice_pct': round(r['F1_Dice'], 2),
            'OptionA_F1_Dice_pct': round(o['F1_Dice'], 2),
            'Raw_Bleed_px': r['Bleed_px'],
            'OptionA_Bleed_px': o['Bleed_px']
        })

    print("=" * 85)

    # Save to CSV
    df = pd.DataFrame(comparison_records)
    csv_out = os.path.join(OUTPUT_DIR, "training_masking_performance_comparison.csv")
    df.to_csv(csv_out, index=False)
    print(f"\nDetailed class performance saved to: {csv_out}")


if __name__ == "__main__":
    evaluate_dataset()
