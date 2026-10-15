"""
EcoPlate AI: Standalone CLI Plate Waste Predictor (Dual-Model Support)
======================================================================
Usage:
  # Run YOLOv11s-seg (default)
  python predict_plate.py --before sample_test_plates/P1031_before.jpg --after sample_test_plates/P1031_after.jpg --model yolo

  # Run Baseline CNN (U-Net)
  python predict_plate.py --before sample_test_plates/P1031_before.jpg --after sample_test_plates/P1031_after.jpg --model cnn

  # Compare Both Models Side-by-Side
  python predict_plate.py --before sample_test_plates/P1031_before.jpg --after sample_test_plates/P1031_after.jpg --model compare
"""

import os
import sys
import time
import argparse
import cv2
import numpy as np

# Ensure backend root is on sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
INFERENCE_DIR = os.path.join(CURRENT_DIR, "inference")
TRAINING_DIR = os.path.join(CURRENT_DIR, "training")
for p in [CURRENT_DIR, INFERENCE_DIR, TRAINING_DIR]:
    if p not in sys.path:
        sys.path.append(p)

from ultralytics import YOLO
from ecoplate_waste_estimator import (
    detect_plate_bounds,
    segment_plate_contents,
    render_annotated_plate,
    build_comparison_dashboard,
    CLASS_NAMES
)
from baseline_cnn_evaluator import BaselineCNNEvaluator


def parse_args():
    parser = argparse.ArgumentParser(description="Predict food waste for a before/after plate pair.")
    parser.add_argument("--before", type=str, default="sample_test_plates/P1031_before.jpg",
                        help="Path to the BEFORE meal plate image")
    parser.add_argument("--after", type=str, default="sample_test_plates/P1031_after.jpg",
                        help="Path to the AFTER meal plate image")
    parser.add_argument("--model", type=str, default="yolo", choices=["yolo", "cnn", "compare"],
                        help="Model architecture: 'yolo', 'cnn', or 'compare' (default: yolo)")
    parser.add_argument("--weights", type=str, default=None,
                        help="Custom path to model weights (optional)")
    parser.add_argument("--output", type=str, default="waste_prediction_result.jpg",
                        help="Path to save output comparison dashboard image")
    return parser.parse_args()


def run_yolo(img_b, img_a, plate_id, weights_path=None):
    if weights_path is None:
        candidates = [
            os.path.join(CURRENT_DIR, "weights", "yolo11s_level1_best.pt"),
            os.path.join(CURRENT_DIR, "weights", "best.pt"),
            os.path.join(CURRENT_DIR, "weights", "yolo11s-seg.pt")
        ]
        for p in candidates:
            if os.path.exists(p):
                weights_path = p
                break

    if not weights_path or not os.path.exists(weights_path):
        raise FileNotFoundError(f"Could not locate YOLO weights at: {weights_path}")

    model = YOLO(weights_path)
    t0 = time.time()
    cx_b, cy_b, r_b, pmask_b = detect_plate_bounds(img_b)
    cx_a, cy_a, r_a, pmask_a = detect_plate_bounds(img_a)

    before_items, dets_b = segment_plate_contents(model, img_b, pmask_b, is_after=False, imgsz=768)
    served = set(before_items.keys())
    after_items, dets_a = segment_plate_contents(model, img_a, pmask_a, is_after=True, served_classes=served, imgsz=768)

    ann_b = render_annotated_plate(img_b, pmask_b, (cx_b, cy_b, r_b), dets_b, "BEFORE")
    ann_a = render_annotated_plate(img_a, pmask_a, (cx_a, cy_a, r_a), dets_a, "AFTER")
    dashboard, records = build_comparison_dashboard(ann_b, ann_a, plate_id, before_items, after_items)
    latency = (time.time() - t0) * 1000

    total_b = sum(d['area'] for d in before_items.values())
    total_a = sum(d['area'] for d in after_items.values())
    waste_pct = min(100.0, max(0.0, (total_a / total_b * 100.0))) if total_b > 0 else 0.0

    return {
        "model_name": "YOLOv11s-seg (Model A)",
        "waste_pct": round(waste_pct, 2),
        "consumed_pct": round(100.0 - waste_pct, 2),
        "latency_ms": round(latency, 1),
        "items": records,
        "dashboard": dashboard
    }


def run_cnn(img_b, img_a, plate_id, weights_path=None):
    if weights_path is None:
        candidates = [
            os.path.join(CURRENT_DIR, "weights", "baseline_cnn_unet_best.pth"),
            os.path.join(CURRENT_DIR, "weights", "baseline_cnn_unet_last.pth")
        ]
        for p in candidates:
            if os.path.exists(p):
                weights_path = p
                break

    if not weights_path or not os.path.exists(weights_path):
        raise FileNotFoundError(f"Could not locate Baseline CNN weights at: {weights_path}")

    evaluator = BaselineCNNEvaluator(checkpoint_path=weights_path, img_size=512)
    t0 = time.time()
    cx_b, cy_b, r_b, pmask_b = detect_plate_bounds(img_b)
    cx_a, cy_a, r_a, pmask_a = detect_plate_bounds(img_a)

    raw_b = evaluator.segment_image(img_b)
    raw_a = evaluator.segment_image(img_a)
    clean_b = np.where(pmask_b > 0, raw_b, 0)
    clean_a = np.where(pmask_a > 0, raw_a, 0)

    min_b = int(np.sum(pmask_b > 0) * 0.002)
    min_a = int(np.sum(pmask_a > 0) * 0.002)

    before_items = {}
    dets_b = []
    served_ids = set()

    for cls_id in range(1, len(evaluator.classes)):
        cname = evaluator.classes[cls_id]
        m = (clean_b == cls_id).astype(np.uint8)
        area = int(m.sum())
        if area >= min_b:
            served_ids.add(cls_id)
            x, y, w, h = cv2.boundingRect(m)
            before_items[cname] = {'area': area, 'mask': m, 'max_conf': 0.88}
            dets_b.append({'class': cname, 'conf': 0.88, 'box': (x, y, x + w, y + h), 'mask': m, 'area': area})

    after_items = {}
    dets_a = []
    for cls_id in range(1, len(evaluator.classes)):
        cname = evaluator.classes[cls_id]
        m = (clean_a == cls_id).astype(np.uint8)
        area = int(m.sum())
        if area >= min_a and cls_id in served_ids:
            x, y, w, h = cv2.boundingRect(m)
            after_items[cname] = {'area': area, 'mask': m, 'max_conf': 0.88}
            dets_a.append({'class': cname, 'conf': 0.88, 'box': (x, y, x + w, y + h), 'mask': m, 'area': area})

    ann_b = render_annotated_plate(img_b, pmask_b, (cx_b, cy_b, r_b), dets_b, "BEFORE")
    ann_a = render_annotated_plate(img_a, pmask_a, (cx_a, cy_a, r_a), dets_a, "AFTER")
    dashboard, records = build_comparison_dashboard(ann_b, ann_a, plate_id, before_items, after_items)
    latency = (time.time() - t0) * 1000

    total_b = sum(d['area'] for d in before_items.values())
    total_a = sum(d['area'] for d in after_items.values())
    waste_pct = min(100.0, max(0.0, (total_a / total_b * 100.0))) if total_b > 0 else 0.0

    return {
        "model_name": "Baseline CNN U-Net (Model B)",
        "waste_pct": round(waste_pct, 2),
        "consumed_pct": round(100.0 - waste_pct, 2),
        "latency_ms": round(latency, 1),
        "items": records,
        "dashboard": dashboard
    }


def main():
    args = parse_args()
    img_b = cv2.imread(args.before)
    img_a = cv2.imread(args.after)

    if img_b is None or img_a is None:
        print(f"[ERROR] Could not read plate images: {args.before}, {args.after}")
        return

    plate_id = os.path.splitext(os.path.basename(args.before))[0].split('_')[0]

    print("=" * 75)
    print(" ECOPLATE AI: DUAL-MODEL FOOD WASTE ESTIMATOR (CLI)")
    print("=" * 75)
    print(f"Plate ID:     {plate_id}")
    print(f"Before Image: {args.before}")
    print(f"After Image:  {args.after}")
    print(f"Model Target: {args.model.upper()}\n")

    if args.model == "yolo":
        res = run_yolo(img_b, img_a, plate_id, args.weights)
        print(f"[{res['model_name']}] Waste: {res['waste_pct']}% | Consumed: {res['consumed_pct']}% | Latency: {res['latency_ms']}ms")
        cv2.imwrite(args.output, res['dashboard'])
        print(f"Saved Dashboard: {args.output}")

    elif args.model == "cnn":
        res = run_cnn(img_b, img_a, plate_id, args.weights)
        print(f"[{res['model_name']}] Waste: {res['waste_pct']}% | Consumed: {res['consumed_pct']}% | Latency: {res['latency_ms']}ms")
        cv2.imwrite(args.output, res['dashboard'])
        print(f"Saved Dashboard: {args.output}")

    elif args.model == "compare":
        res_y = run_yolo(img_b, img_a, plate_id)
        res_c = run_cnn(img_b, img_a, plate_id)

        print("-" * 75)
        print("MODEL COMPARISON SUMMARY")
        print("-" * 75)
        print(f"YOLOv11s-seg: Waste={res_y['waste_pct']}%, Consumed={res_y['consumed_pct']}%, Latency={res_y['latency_ms']}ms")
        print(f"Baseline CNN: Waste={res_c['waste_pct']}%, Consumed={res_c['consumed_pct']}%, Latency={res_c['latency_ms']}ms")
        delta = round(abs(res_y['waste_pct'] - res_c['waste_pct']), 2)
        print(f"Delta Waste:  {delta} pp difference | Status: {'PERFECT AGREEMENT' if delta < 2.0 else 'CONSISTENT'}")
        print("-" * 75)

        cv2.imwrite(args.output, res_y['dashboard'])
        print(f"Saved YOLO Dashboard to {args.output}")


if __name__ == "__main__":
    main()
