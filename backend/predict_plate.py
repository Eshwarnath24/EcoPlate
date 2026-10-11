"""
EcoPlate AI: Standalone CLI Plate Waste Predictor
=================================================
Usage:
  python predict_plate.py --before path/to/before.jpg --after path/to/after.jpg [--output dashboard.jpg]

Runs Option A (Plate ROI + Fine-Tuned YOLOv11n-seg + Rim Clipping)
and prints the food waste scorecard directly to the terminal.
"""

import os
import sys
import argparse
# pyrefly: ignore [missing-import]
import cv2
import numpy as np

# Ensure backend root is on sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.append(CURRENT_DIR)

# pyrefly: ignore [missing-import]
from ultralytics import YOLO
from ecoplate_waste_estimator import (
    detect_plate_bounds,
    segment_plate_contents,
    render_annotated_plate,
    build_comparison_dashboard,
    CLASS_NAMES
)

def parse_args():
    parser = argparse.ArgumentParser(description="Predict food waste for a before/after plate pair.")
    parser.add_argument("--before", type=str, default="sample_test_plates/P1031_before.jpg",
                        help="Path to the BEFORE meal plate image")
    parser.add_argument("--after", type=str, default="sample_test_plates/P1031_after.jpg",
                        help="Path to the AFTER meal plate image")
    parser.add_argument("--weights", type=str, default=None,
                        help="Path to YOLO weights (default: weights/best.pt)")
    parser.add_argument("--output", type=str, default="waste_prediction_result.jpg",
                        help="Path to save output comparison dashboard image")
    return parser.parse_args()

def main():
    args = parse_args()

    # Locate weights
    weights_path = args.weights
    if weights_path is None:
        candidates = [
            os.path.join(CURRENT_DIR, "weights", "best.pt"),
            r"f:\4 year\nndl\Team-4\runs\segment\training_runs\yolo11n_food_seg_v2\weights\best.pt"
        ]
        for p in candidates:
            if os.path.exists(p):
                weights_path = p
                break

    if not weights_path or not os.path.exists(weights_path):
        print(f"[ERROR] Could not find weights at: {weights_path}")
        return

    # Read images
    img_b = cv2.imread(args.before)
    img_a = cv2.imread(args.after)

    if img_b is None:
        print(f"[ERROR] Could not read before image at: {args.before}")
        return
    if img_a is None:
        print(f"[ERROR] Could not read after image at: {args.after}")
        return

    print("=" * 70)
    print(" EcoPlate AI: Plate Food Waste Estimation (Option A + Fine-Tuned Model)")
    print("=" * 70)
    print(f"Before Image: {args.before}")
    print(f"After Image:  {args.after}")
    print(f"Model:        {weights_path}\n")

    # Load Model
    model = YOLO(weights_path)

    # Plate ROI Detection
    cx_b, cy_b, r_b, pmask_b = detect_plate_bounds(img_b)
    cx_a, cy_a, r_a, pmask_a = detect_plate_bounds(img_a)

    # Segmentation
    before_items, dets_b = segment_plate_contents(model, img_b, pmask_b, is_after=False)
    after_items, dets_a  = segment_plate_contents(model, img_a, pmask_a, is_after=True)

    # Annotated Overlays
    annotated_b = render_annotated_plate(img_b, pmask_b, (cx_b, cy_b, r_b), dets_b, "BEFORE")
    annotated_a = render_annotated_plate(img_a, pmask_a, (cx_a, cy_a, r_a), dets_a, "AFTER")

    # Dashboard & Records
    plate_id = os.path.splitext(os.path.basename(args.before))[0].split('_')[0]
    dashboard, records = build_comparison_dashboard(annotated_b, annotated_a, plate_id, before_items, after_items)

    # Save dashboard image
    cv2.imwrite(args.output, dashboard)
    print(f"Saved visual dashboard to: {args.output}\n")

    # Print Terminal Scorecard
    total_b = sum(d['area'] for d in before_items.values())
    total_a = sum(d['area'] for d in after_items.values())
    ov_waste = min(100.0, max(0.0, (total_a / total_b * 100.0))) if total_b > 0 else 0.0
    ov_consumed = max(0.0, 100.0 - ov_waste)

    if ov_waste <= 10.0:
        status = "EXCELLENT: Minimal Food Waste"
    elif ov_waste <= 30.0:
        status = "MODERATE: Some Leftover Waste"
    else:
        status = "HIGH FOOD WASTE ALERT"

    print("=" * 70)
    print(f" OVERALL WASTE: {ov_waste:.1f}%  |  CONSUMED: {ov_consumed:.1f}%  |  [{status}]")
    print("=" * 70)
    print(f"{'Food Item':<18} | {'Before (px)':<12} | {'After (px)':<12} | {'Waste %':<10} | {'Status'}")
    print("-" * 70)
    for r in records:
        print(f"{r['Food_Item']:<18} | {r['Before_Area_px']:>10,d}   | {r['After_Area_px']:>10,d}   | {r['Waste_Percent']:>8.1f}%  | {r['Item_Status']}")
    print("=" * 70)

if __name__ == "__main__":
    main()
